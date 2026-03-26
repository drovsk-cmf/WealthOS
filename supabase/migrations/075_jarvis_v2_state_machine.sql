-- ══════════════════════════════════════════════════════════════════════
-- get_jarvis_v2: Motor v2 com Grafo de Dependências + Máquina de Estados
--
-- Arquitetura em 6 camadas:
--   L0: dados brutos (transactions, accounts, assets, recurrences, indices)
--   L1: métricas derivadas (avg_income, avg_expense, liquid, debt, CDI)
--   L2: indicadores compostos (RR, DS, SR, FI, CV, WACC, HHI)
--   L3: classificação de estado (SEM_DADOS/CRISE/SOBREVIVENCIA/ESTABILIZACAO/OTIMIZACAO/CRESCIMENTO)
--   L4: fila de prioridades por estado (regras filtradas e ordenadas)
--   L5: resolução de conflitos (R07 vs R02, R01 vs D/E, CV → reserve multiplier)
--   L6: output (estado + classification_inputs + metrics + actions ordenadas)
--
-- Dependência: accounts.is_collateralized (migration 074)
-- Ref: FINANCIAL-METHODOLOGY.md, sessão 33 (26/03/2026)
-- ══════════════════════════════════════════════════════════════════════
-- Fonte completa aplicada via execute_sql (MCP OAuth).
-- Para recuperar a definição: SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_jarvis_v2';
-- CREATE OR REPLACE é idempotente.
-- Full function source: retrieve with pg_get_functiondef if needed for audit.
-- This migration is a placeholder. The function was created via Supabase MCP execute_sql
-- because apply_migration was unavailable (endpoint not GA for this project).
-- The function get_jarvis_v2 is 350+ lines of PL/pgSQL implementing:
--   6 states: SEM_DADOS, CRISE, SOBREVIVENCIA, ESTABILIZACAO, OTIMIZACAO, CRESCIMENTO
--   4 classification inputs: reserve_ratio, debt_stress, savings_rate, fi_progress
--   5 conflict resolution rules
--   Priority queue per state with contextual actions
-- To view the full source: SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_jarvis_v2';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_jarvis_v2') THEN
    RAISE EXCEPTION 'get_jarvis_v2 not found. Apply via execute_sql first.';
  END IF;
END $$;
