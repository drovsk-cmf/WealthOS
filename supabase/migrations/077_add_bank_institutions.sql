-- Migration: 077_add_bank_institutions.sql
-- Description: Creates bank_institutions reference table (BCB COMPE codes),
--              adds bank fields to accounts table, seeds 96 institutions.
-- Applied: 2026-03-31 via execute_sql (apply_migration broken for this project)

DO $$ BEGIN
IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'bank_institutions' AND schemaname = 'public') THEN

  -- 1. Create bank_institutions reference table
  CREATE TABLE public.bank_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compe_code TEXT NOT NULL,
    ispb_code TEXT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT bank_institutions_compe_unique UNIQUE (compe_code)
  );

  COMMENT ON TABLE public.bank_institutions IS 'Tabela de referência de instituições financeiras brasileiras. Fonte: BCB (STR/COMPE). Atualização periódica.';
  COMMENT ON COLUMN public.bank_institutions.compe_code IS 'Código COMPE de 3 dígitos (ex: 001, 260). Fonte: BCB/FEBRABAN.';
  COMMENT ON COLUMN public.bank_institutions.ispb_code IS 'Código ISPB de 8 dígitos para SPB/PIX. Fonte: BCB.';
  COMMENT ON COLUMN public.bank_institutions.short_name IS 'Nome comercial/popular (ex: Nubank, Itaú). Usado na UI.';

  -- 2. Enable RLS (read-only for authenticated users)
  ALTER TABLE public.bank_institutions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "bank_institutions_select_authenticated"
    ON public.bank_institutions FOR SELECT TO authenticated USING (true);

  -- 3. Indexes
  CREATE INDEX idx_bank_institutions_compe ON public.bank_institutions (compe_code);
  CREATE INDEX idx_bank_institutions_short_name ON public.bank_institutions USING gin (to_tsvector('portuguese', short_name));

  RAISE NOTICE 'bank_institutions table created';
END IF;
END $$;

-- 4. Add bank fields to accounts
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS bank_institution_id UUID REFERENCES public.bank_institutions(id),
  ADD COLUMN IF NOT EXISTS branch_number TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS account_digit TEXT;

COMMENT ON COLUMN public.accounts.bank_institution_id IS 'FK para bank_institutions. Identifica a instituição financeira.';
COMMENT ON COLUMN public.accounts.branch_number IS 'Número da agência (ex: 0001, 1234). Formato livre.';
COMMENT ON COLUMN public.accounts.account_number IS 'Número da conta (ex: 12345678). Formato livre (varia por banco).';
COMMENT ON COLUMN public.accounts.account_digit IS 'Dígito verificador da conta (ex: 9, X). Opcional.';

CREATE INDEX IF NOT EXISTS idx_accounts_bank_institution ON public.accounts (bank_institution_id);

-- 5. Seed: 96 instituições financeiras brasileiras (fonte: BCB STR/COMPE, mar/2026)
INSERT INTO public.bank_institutions (compe_code, ispb_code, name, short_name) VALUES
('001', '00000000', 'Banco do Brasil S.A.', 'Banco do Brasil'),
('033', '90400888', 'Banco Santander (Brasil) S.A.', 'Santander'),
('104', '00360305', 'Caixa Econômica Federal', 'Caixa'),
('237', '60746948', 'Banco Bradesco S.A.', 'Bradesco'),
('341', '60701190', 'Itaú Unibanco S.A.', 'Itaú'),
('745', '33479023', 'Banco Citibank S.A.', 'Citibank'),
('077', '00416968', 'Banco Inter S.A.', 'Inter'),
('260', '18236120', 'Nu Pagamentos S.A.', 'Nubank'),
('336', '31872495', 'Banco C6 S.A.', 'C6 Bank'),
('290', '08561701', 'PagSeguro Internet S.A.', 'PagBank'),
('323', '10573521', 'Mercado Pago Instituição de Pagamento Ltda.', 'Mercado Pago'),
('380', '22896431', 'PicPay Serviços S.A.', 'PicPay'),
('403', '37880206', 'Cora Sociedade de Crédito Direto S.A.', 'Cora'),
('301', '92874270', 'BPP Instituição de Pagamento S.A.', 'RecargaPay'),
('197', '16501555', 'Stone Pagamentos S.A.', 'Stone'),
('332', '09554480', 'Acesso Soluções de Pagamento S.A.', 'Acesso'),
('208', '30306294', 'Banco BTG Pactual S.A.', 'BTG Pactual'),
('102', '02332886', 'XP Investimentos S.A.', 'XP Investimentos'),
('746', '30723886', 'Banco Modal S.A.', 'Modal'),
('735', '00253448', 'Banco Neon S.A.', 'Neon'),
('655', '59588111', 'Banco Votorantim S.A.', 'Banco BV'),
('422', '58160789', 'Banco Safra S.A.', 'Safra'),
('074', '03017677', 'Banco J. Safra S.A.', 'Safra Investimentos'),
('318', '61186680', 'Banco BMG S.A.', 'BMG'),
('623', '59285411', 'Banco Pan S.A.', 'Banco Pan'),
('707', '62232889', 'Banco Daycoval S.A.', 'Daycoval'),
('633', '68900810', 'Banco Rendimento S.A.', 'Rendimento'),
('634', '17351180', 'Banco Triângulo S.A.', 'Tribanco'),
('637', '60889128', 'Banco Sofisa S.A.', 'Sofisa'),
('643', '62144175', 'Banco Pine S.A.', 'Pine'),
('389', '17184037', 'Banco Mercantil do Brasil S.A.', 'Mercantil'),
('246', '28195667', 'Banco ABC Brasil S.A.', 'ABC Brasil'),
('025', '03323840', 'Banco Alfa S.A.', 'Alfa'),
('224', '58616418', 'Banco Fibra S.A.', 'Fibra'),
('604', '31895683', 'Banco Industrial do Brasil S.A.', 'BIB'),
('653', '61024352', 'Banco Indusval S.A.', 'Indusval'),
('265', '33644196', 'Banco Fator S.A.', 'Fator'),
('266', '33132044', 'Banco Cédula S.A.', 'Cédula'),
('741', '00517645', 'Banco Ribeirão Preto S.A.', 'Ribeirão Preto'),
('743', '00795423', 'Banco Semear S.A.', 'Semear'),
('611', '61820817', 'Banco Paulista S.A.', 'Paulista'),
('612', '31880826', 'Banco Guanabara S.A.', 'Guanabara'),
('412', '15173776', 'Banco Capital S.A.', 'Capital'),
('610', '78626983', 'Banco VR S.A.', 'VR'),
('748', '01181521', 'Banco Cooperativo Sicredi S.A.', 'Sicredi'),
('756', '02038232', 'Banco Cooperativo do Brasil S.A.', 'Sicoob'),
('133', '10398952', 'Cresol Confederação', 'Cresol'),
('085', '05463212', 'Cooperativa Central de Crédito Urbano - Cecred/Ailos', 'Ailos'),
('136', '00315557', 'Confederação Nacional das Cooperativas Centrais Unicred', 'Unicred'),
('003', '04902979', 'Banco da Amazônia S.A.', 'Banco da Amazônia'),
('004', '07237373', 'Banco do Nordeste do Brasil S.A.', 'Banco do Nordeste'),
('021', '28127603', 'Banestes S.A. - Banco do Estado do Espírito Santo', 'Banestes'),
('037', '04913711', 'Banco do Estado do Pará S.A.', 'Banpará'),
('041', '92702067', 'Banco do Estado do Rio Grande do Sul S.A.', 'Banrisul'),
('047', '13009717', 'Banco do Estado de Sergipe S.A.', 'Banese'),
('070', '00000208', 'BRB - Banco de Brasília S.A.', 'BRB'),
('366', '61533584', 'Banco Société Générale Brasil S.A.', 'Société Générale'),
('376', '33172537', 'Banco J.P. Morgan S.A.', 'J.P. Morgan'),
('487', '62331228', 'Deutsche Bank S.A. - Banco Alemão', 'Deutsche Bank'),
('752', '01522368', 'Banco BNP Paribas Brasil S.A.', 'BNP Paribas'),
('747', '01023570', 'Banco Rabobank International Brasil S.A.', 'Rabobank'),
('300', '33042151', 'Banco de La Nacion Argentina', 'Nacion Argentina'),
('456', '60498557', 'Banco MUFG Brasil S.A.', 'MUFG'),
('464', '60518222', 'Banco Sumitomo Mitsui Brasileiro S.A.', 'SMBC'),
('083', '10690848', 'Banco da China Brasil S.A.', 'Banco da China'),
('757', '02318507', 'Banco KEB Hana do Brasil S.A.', 'KEB Hana'),
('217', '91884981', 'Banco John Deere S.A.', 'John Deere'),
('040', '03609817', 'Banco Cargill S.A.', 'Cargill'),
('066', '02801938', 'Banco Morgan Stanley S.A.', 'Morgan Stanley'),
('505', '32062580', 'Banco Credit Suisse (Brasil) S.A.', 'Credit Suisse'),
('184', '17298092', 'Banco Itaú BBA S.A.', 'Itaú BBA'),
('204', '59438325', 'Banco Bradesco Cartões S.A.', 'Bradesco Cartões'),
('036', '06271464', 'Banco Bradesco BBI S.A.', 'Bradesco BBI'),
('652', '60872504', 'Itaú Unibanco Holding S.A.', 'Itaú Unibanco'),
('212', '92894922', 'Banco Original S.A.', 'Original'),
('218', '71027866', 'Banco BS2 S.A.', 'BS2'),
('121', '10664513', 'Banco Agibank S.A.', 'Agibank'),
('254', '14388334', 'Paraná Banco S.A.', 'Paraná Banco'),
('739', '00558456', 'Banco Cetelem S.A.', 'Cetelem'),
('626', '61348538', 'Banco Ficsa S.A.', 'Ficsa'),
('364', '21332862', 'Gerencianet S.A.', 'Efí (Gerencianet)'),
('280', '23862762', 'Will Financeira S.A.', 'Will Bank'),
('529', '47593544', 'Pinbank Brasil Instituição de Pagamento S.A.', 'Pinbank'),
('461', '36113876', 'Asaas Gestão Financeira Instituição de Pagamento S.A.', 'Asaas'),
('125', '45246410', 'Plural S.A. Banco Múltiplo', 'Plural'),
('082', '07679404', 'Banco Topázio S.A.', 'Topázio'),
('600', '59118133', 'Banco Luso Brasileiro S.A.', 'Luso Brasileiro'),
('243', '33923798', 'Banco Máxima S.A.', 'Máxima'),
('654', '92874270', 'Banco Digimais S.A.', 'Digimais'),
('349', '27351731', 'Banco Afinz S.A.', 'Afinz'),
('413', '00000000', 'Banco BV S.A.', 'BV (Votorantim)'),
('348', '33264668', 'Banco XP S.A.', 'Banco XP'),
('536', '48795256', 'Neon Pagamentos S.A.', 'Neon Pagamentos'),
('335', '27098060', 'Banco Digio S.A.', 'Digio'),
('269', '43180355', 'Banco HSBC S.A.', 'HSBC Brasil'),
('613', '60850229', 'Banco Pecúnia S.A.', 'Pecúnia')
ON CONFLICT (compe_code) DO NOTHING;
