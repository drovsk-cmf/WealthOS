-- ============================================
-- WealthOS - Migration 002: Modelo Contabil
-- ============================================
-- 10 novas tabelas, 12 novos ENUMs, 5 tabelas alteradas
-- 16+ indexes, 20+ politicas RLS, triggers, functions
-- Referencia: wealthos-estudo-tecnico-v2.0 + adendos v1.2/v1.4
-- Pre-requisito: migration 001_initial_schema.sql executada
-- ============================================


-- ============================
-- 0. NOVOS TIPOS ENUM (12)
-- ============================

CREATE TYPE group_type AS ENUM (
  'asset', 'liability', 'equity', 'revenue', 'expense'
);

CREATE TYPE tax_treatment_type AS ENUM (
  'tributavel', 'isento', 'exclusivo_fonte',
  'ganho_capital', 'dedutivel_integral',
  'dedutivel_limitado', 'nao_dedutivel', 'variavel'
);

CREATE TYPE center_type AS ENUM (
  'cost_center', 'profit_center', 'neutral'
);

CREATE TYPE entry_source AS ENUM (
  'bank_feed', 'card_feed', 'manual',
  'csv_import', 'ofx_import', 'ocr', 'system'
);

CREATE TYPE parameter_type AS ENUM (
  'irpf_monthly', 'irpf_annual', 'irpf_reduction',
  'irpf_min_high_income', 'inss_employee', 'inss_ceiling',
  'minimum_wage', 'capital_gains',
  'crypto_exemption', 'stock_exemption'
);

CREATE TYPE index_type AS ENUM (
  'ipca', 'inpc', 'igpm', 'selic', 'cdi', 'tr',
  'usd_brl', 'minimum_wage',
  'ipca_food', 'ipca_housing', 'ipca_transport',
  'ipca_health', 'ipca_education'
);

CREATE TYPE periodicity_type AS ENUM (
  'daily', 'monthly', 'annual'
);

CREATE TYPE workflow_type AS ENUM (
  'bank_statement', 'card_statement', 'loan_payment',
  'investment_update', 'fiscal_review'
);

CREATE TYPE workflow_periodicity AS ENUM (
  'weekly', 'biweekly', 'monthly'
);

CREATE TYPE task_type AS ENUM (
  'upload_document', 'update_balance',
  'categorize_transactions', 'review_fiscal'
);

CREATE TYPE task_status AS ENUM (
  'pending', 'in_progress', 'completed', 'skipped'
);

CREATE TYPE adjustment_index_type AS ENUM (
  'ipca', 'igpm', 'inpc', 'selic', 'manual', 'none'
);


-- ============================
-- 1. NOVAS TABELAS (10)
-- ============================

-- 1.1 chart_of_accounts
-- Plano de contas hierarquico com 133 contas-semente
CREATE TABLE chart_of_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  internal_code   TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  group_type      group_type NOT NULL,
  parent_id       UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  depth           INTEGER NOT NULL DEFAULT 0,
  tax_treatment   tax_treatment_type,
  dirpf_group     TEXT,
  icon            TEXT,
  color           TEXT,
  is_system       BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT coa_unique_user_code UNIQUE (user_id, internal_code)
);

-- 1.2 journal_entries
-- Cabecalho do lancamento contabil. IMUTAVEL (append-only).
CREATE TABLE journal_entries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date          DATE NOT NULL,
  occurred_at         TIMESTAMPTZ,
  posted_at           TIMESTAMPTZ,
  user_date           DATE,
  source              entry_source NOT NULL DEFAULT 'manual',
  description         TEXT,
  document_url        TEXT,
  is_reversal         BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_entry_id   UUID REFERENCES journal_entries(id),
  transaction_id      UUID REFERENCES transactions(id) ON DELETE SET NULL,
  workflow_task_id    UUID,  -- FK adicionada apos criacao de workflow_tasks
  notes_encrypted     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- SEM updated_at: tabela imutavel
);

-- 1.3 journal_lines
-- Linhas de debito/credito. IMUTAVEIS.
CREATE TABLE journal_lines (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id  UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id        UUID NOT NULL REFERENCES chart_of_accounts(id),
  amount_debit      NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_credit     NUMERIC(14,2) NOT NULL DEFAULT 0,
  memo              TEXT,

  -- Cada linha e debito OU credito, nunca ambos, nunca zero
  CONSTRAINT jl_debit_or_credit CHECK (
    amount_debit >= 0
    AND amount_credit >= 0
    AND (amount_debit > 0 OR amount_credit > 0)
    AND NOT (amount_debit > 0 AND amount_credit > 0)
  )
);

-- 1.4 cost_centers
-- Centros de custo, lucro ou neutros. Hierarquia ate 3 niveis.
CREATE TABLE cost_centers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        center_type NOT NULL DEFAULT 'cost_center',
  parent_id   UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  icon        TEXT,
  color       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 center_allocations
-- Rateio de linhas contabeis entre centros. IMUTAVEIS.
CREATE TABLE center_allocations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_line_id  UUID NOT NULL REFERENCES journal_lines(id) ON DELETE CASCADE,
  cost_center_id   UUID NOT NULL REFERENCES cost_centers(id),
  percentage       NUMERIC(5,2) NOT NULL,
  amount           NUMERIC(14,2) NOT NULL,

  CONSTRAINT ca_percentage_range CHECK (percentage > 0 AND percentage <= 100)
);

-- 1.6 tax_parameters
-- Parametros fiscais versionados por vigencia
CREATE TABLE tax_parameters (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parameter_type      parameter_type NOT NULL,
  valid_from          DATE NOT NULL,
  valid_until         DATE,
  brackets            JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits              JSONB,
  source_references   JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7 economic_indices
-- Valores historicos de indices economicos (dados publicos)
CREATE TABLE economic_indices (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  index_type        index_type NOT NULL,
  reference_date    DATE NOT NULL,
  value             NUMERIC(12,6) NOT NULL,
  accumulated_12m   NUMERIC(12,6),
  accumulated_year  NUMERIC(12,6),
  source_primary    TEXT NOT NULL,
  source_secondary  TEXT,
  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ei_unique_type_date UNIQUE (index_type, reference_date)
);

-- 1.8 economic_indices_sources
-- Mapeamento de fontes para cada indice
CREATE TABLE economic_indices_sources (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  index_type       index_type NOT NULL,
  priority         INTEGER NOT NULL,
  provider         TEXT NOT NULL,
  series_code      TEXT NOT NULL,
  api_url_template TEXT NOT NULL,
  periodicity      periodicity_type NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE
);

-- 1.9 workflows
-- Definicoes de workflows periodicos
CREATE TABLE workflows (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  workflow_type       workflow_type NOT NULL,
  periodicity         workflow_periodicity NOT NULL DEFAULT 'monthly',
  related_account_id  UUID REFERENCES accounts(id) ON DELETE SET NULL,
  related_coa_id      UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  day_of_period       INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_completed_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.10 workflow_tasks
-- Tarefas individuais por ciclo de workflow
CREATE TABLE workflow_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  status          task_status NOT NULL DEFAULT 'pending',
  task_type       task_type NOT NULL,
  description     TEXT,
  document_id     UUID REFERENCES documents(id) ON DELETE SET NULL,
  result_data     JSONB,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar FK de journal_entries.workflow_task_id (referencia circular resolvida)
ALTER TABLE journal_entries
  ADD CONSTRAINT je_workflow_task_fk
  FOREIGN KEY (workflow_task_id) REFERENCES workflow_tasks(id) ON DELETE SET NULL;


-- ============================
-- 2. ALTERACOES EM TABELAS EXISTENTES
-- ============================

-- 2.1 transactions: novos campos para modelo contabil
ALTER TABLE transactions
  ADD COLUMN journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  ADD COLUMN occurred_at      TIMESTAMPTZ,
  ADD COLUMN posted_at        TIMESTAMPTZ,
  ADD COLUMN source           entry_source NOT NULL DEFAULT 'manual';

-- 2.2 accounts: vinculo com chart_of_accounts + tier de liquidez (adendo v1.4)
ALTER TABLE accounts
  ADD COLUMN coa_id         UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  ADD COLUMN liquidity_tier TEXT NOT NULL DEFAULT 'T1';

-- 2.3 budgets: vinculo com chart_of_accounts e centros
ALTER TABLE budgets
  ADD COLUMN coa_id            UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  ADD COLUMN cost_center_id    UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN adjustment_index  adjustment_index_type;

-- 2.4 assets: vinculo com chart_of_accounts
ALTER TABLE assets
  ADD COLUMN coa_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL;

-- 2.5 recurrences: vinculo com chart_of_accounts, centros e reajuste
ALTER TABLE recurrences
  ADD COLUMN coa_id            UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  ADD COLUMN cost_center_id    UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN adjustment_index  adjustment_index_type,
  ADD COLUMN adjustment_rate   NUMERIC(5,2);

-- 2.6 documents: campo thumbnail_path (adendo v1.2)
ALTER TABLE documents
  ADD COLUMN thumbnail_path TEXT;

-- 2.7 monthly_snapshots: campos de solvencia (adendo v1.4)
ALTER TABLE monthly_snapshots
  ADD COLUMN lcr            NUMERIC(6,2),
  ADD COLUMN runway_months  NUMERIC(6,1),
  ADD COLUMN burn_rate      NUMERIC(14,2),
  ADD COLUMN tier1_total    NUMERIC(14,2),
  ADD COLUMN tier2_total    NUMERIC(14,2),
  ADD COLUMN tier3_total    NUMERIC(14,2),
  ADD COLUMN tier4_total    NUMERIC(14,2);

-- 2.8 asset_category: novo valor 'restricted' (adendo v1.4)
ALTER TYPE asset_category ADD VALUE IF NOT EXISTS 'restricted';

-- 2.9 Storage: MIME types expandidos para importacao de arquivos (adendo v1.2)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.text',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/x-ofx'
]
WHERE id = 'documents';


-- ============================
-- 3. INDEXES (18)
-- ============================

-- chart_of_accounts
CREATE UNIQUE INDEX idx_coa_user_code ON chart_of_accounts(user_id, internal_code);
CREATE INDEX idx_coa_user_group ON chart_of_accounts(user_id, group_type);
CREATE INDEX idx_coa_user_active ON chart_of_accounts(user_id, is_active) WHERE is_active = TRUE;

-- journal_entries
CREATE INDEX idx_je_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX idx_je_user_source ON journal_entries(user_id, source);
CREATE INDEX idx_je_transaction ON journal_entries(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX idx_je_reversal ON journal_entries(reversed_entry_id) WHERE reversed_entry_id IS NOT NULL;

-- journal_lines
CREATE INDEX idx_jl_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_jl_account ON journal_lines(account_id);

-- center_allocations
CREATE INDEX idx_ca_line ON center_allocations(journal_line_id);
CREATE INDEX idx_ca_center ON center_allocations(cost_center_id);

-- cost_centers
CREATE INDEX idx_cc_user ON cost_centers(user_id);

-- economic_indices
CREATE INDEX idx_ei_type_date ON economic_indices(index_type, reference_date DESC);

-- tax_parameters
CREATE INDEX idx_tp_type_valid ON tax_parameters(parameter_type, valid_from, valid_until);

-- workflows
CREATE INDEX idx_wf_user ON workflows(user_id, is_active) WHERE is_active = TRUE;

-- workflow_tasks
CREATE INDEX idx_wt_workflow_status ON workflow_tasks(workflow_id, status);
CREATE INDEX idx_wt_user_status ON workflow_tasks(user_id, status, created_at DESC);

-- transactions: index no novo campo
CREATE INDEX idx_tx_journal_entry ON transactions(journal_entry_id) WHERE journal_entry_id IS NOT NULL;


-- ============================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================

-- Habilitar RLS nas novas tabelas
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indices_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;


-- chart_of_accounts: CRUD, mas UPDATE/DELETE bloqueados para contas is_system
CREATE POLICY "coa_select" ON chart_of_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coa_insert" ON chart_of_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coa_update" ON chart_of_accounts
  FOR UPDATE USING (auth.uid() = user_id AND NOT is_system);
CREATE POLICY "coa_delete" ON chart_of_accounts
  FOR DELETE USING (auth.uid() = user_id AND NOT is_system);

-- journal_entries: SELECT e INSERT apenas. IMUTAVEL (sem UPDATE/DELETE).
CREATE POLICY "je_select" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "je_insert" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- journal_lines: SELECT e INSERT via journal_entry ownership. IMUTAVEL.
CREATE POLICY "jl_select" ON journal_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_lines.journal_entry_id
        AND journal_entries.user_id = auth.uid()
    )
  );
CREATE POLICY "jl_insert" ON journal_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_lines.journal_entry_id
        AND journal_entries.user_id = auth.uid()
    )
  );

-- cost_centers: CRUD, mas DELETE bloqueado para centro default
CREATE POLICY "cc_select" ON cost_centers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cc_insert" ON cost_centers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cc_update" ON cost_centers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cc_delete" ON cost_centers
  FOR DELETE USING (auth.uid() = user_id AND NOT is_default);

-- center_allocations: SELECT e INSERT via journal_line > journal_entry. IMUTAVEL.
CREATE POLICY "ca_select" ON center_allocations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_lines jl
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      WHERE jl.id = center_allocations.journal_line_id
        AND je.user_id = auth.uid()
    )
  );
CREATE POLICY "ca_insert" ON center_allocations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_lines jl
      JOIN journal_entries je ON je.id = jl.journal_entry_id
      WHERE jl.id = center_allocations.journal_line_id
        AND je.user_id = auth.uid()
    )
  );

-- tax_parameters: leitura publica, escrita restrita a service_role
CREATE POLICY "tp_select" ON tax_parameters
  FOR SELECT USING (true);

-- economic_indices: leitura publica, escrita restrita a service_role
CREATE POLICY "ei_select" ON economic_indices
  FOR SELECT USING (true);

-- economic_indices_sources: leitura publica, escrita restrita a service_role
CREATE POLICY "eis_select" ON economic_indices_sources
  FOR SELECT USING (true);

-- workflows: CRUD completo
CREATE POLICY "wf_select" ON workflows
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wf_insert" ON workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wf_update" ON workflows
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wf_delete" ON workflows
  FOR DELETE USING (auth.uid() = user_id);

-- workflow_tasks: SELECT, INSERT, UPDATE. Sem DELETE (skipped, nao removidas).
CREATE POLICY "wt_select" ON workflow_tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wt_insert" ON workflow_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wt_update" ON workflow_tasks
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================
-- 5. FUNCTIONS E TRIGGERS
-- ============================

-- 5.1 updated_at triggers para novas tabelas mutaveis
-- (reutiliza update_updated_at() da migration 001)
CREATE TRIGGER trg_coa_updated_at
  BEFORE UPDATE ON chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cost_centers_updated_at
  BEFORE UPDATE ON cost_centers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tax_parameters_updated_at
  BEFORE UPDATE ON tax_parameters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 5.2 activate_account_on_use()
-- Quando uma journal_line referencia uma conta inativa, ativa-a automaticamente.
CREATE OR REPLACE FUNCTION activate_account_on_use()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chart_of_accounts
  SET is_active = TRUE
  WHERE id = NEW.account_id
    AND is_active = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_jl_activate_account
  AFTER INSERT ON journal_lines
  FOR EACH ROW EXECUTE FUNCTION activate_account_on_use();


-- 5.3 create_default_cost_center()
-- Cria o centro default 'Pessoal' no onboarding.
CREATE OR REPLACE FUNCTION create_default_cost_center(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_center_id UUID;
BEGIN
  INSERT INTO cost_centers (user_id, name, type, is_default)
  VALUES (p_user_id, 'Pessoal', 'neutral', TRUE)
  RETURNING id INTO v_center_id;

  RETURN v_center_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================
-- 6. COMENTARIOS
-- ============================

COMMENT ON TABLE chart_of_accounts IS 'Plano de contas hierarquico (partida dobrada). 5 grupos, 133 contas-semente. Ref: estudo-contabil-v1.5';
COMMENT ON TABLE journal_entries IS 'Cabecalho de lancamentos contabeis. IMUTAVEL (append-only). Estornos via is_reversal.';
COMMENT ON TABLE journal_lines IS 'Linhas de debito/credito. IMUTAVEIS. Soma debitos = soma creditos por journal_entry.';
COMMENT ON TABLE cost_centers IS 'Centros de custo/lucro. Dimensao analitica ortogonal ao plano de contas.';
COMMENT ON TABLE center_allocations IS 'Rateio percentual de journal_lines entre centros. IMUTAVEL.';
COMMENT ON TABLE tax_parameters IS 'Parametros fiscais versionados (IRPF, INSS, etc.). Dados publicos, escrita via service_role.';
COMMENT ON TABLE economic_indices IS 'Indices economicos historicos (IPCA, Selic, etc.). Alimentado por Edge Function fetch-economic-indices.';
COMMENT ON TABLE economic_indices_sources IS 'Mapeamento de fontes (BCB SGS, IBGE SIDRA, IPEADATA) por indice.';
COMMENT ON TABLE workflows IS 'Definicoes de workflows periodicos (extratos, faturas, etc.).';
COMMENT ON TABLE workflow_tasks IS 'Tarefas individuais geradas por ciclo de workflow.';

COMMENT ON COLUMN transactions.journal_entry_id IS 'Vinculo com lancamento contabil. NULL para transacoes legadas pre-modelo contabil.';
COMMENT ON COLUMN transactions.source IS 'Origem: bank_feed, card_feed, manual, csv_import, ofx_import, ocr, system.';
COMMENT ON COLUMN accounts.coa_id IS 'Conta contabil correspondente (Grupo 1.1 para bancarias, 2.1.01 para cartoes).';
COMMENT ON COLUMN accounts.liquidity_tier IS 'Tier de liquidez para metricas de solvencia: T1/T2/T3/T4.';
