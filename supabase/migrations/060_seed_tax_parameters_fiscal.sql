-- Seed tax_parameters: 9 registros fiscais faltantes no oniefy-prod
-- Origem: migrations 008_fiscal_module + 024_tax_params_2026 (projeto legado)
-- Consolidação da sessão 22 não incluiu dados de seed, apenas DDL.
-- Applied to oniefy-prod (mngjbrbxapazdddzgoje) as 'seed_tax_parameters_all'
-- Post-apply: deduplicação via ctid + unique index idx_tax_params_unique

-- IRPF Monthly 2025
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_monthly', '2025-05-01', '2025-12-31',
  '[{"min":0,"max":2428.80,"rate":0,"deduction":0},{"min":2428.81,"max":2826.65,"rate":7.5,"deduction":182.16},{"min":2826.66,"max":3751.05,"rate":15,"deduction":394.16},{"min":3751.06,"max":4664.68,"rate":22.5,"deduction":675.49},{"min":4664.69,"max":99999999,"rate":27.5,"deduction":908.73}]'::JSONB,
  '{"simplified_discount_monthly":607.20,"dependent_deduction_monthly":189.59}'::JSONB,
  '[{"source":"RFB","url":"https://www.gov.br/receitafederal","date":"2025-05-01"}]'::JSONB,
  'system_seed'
);

-- IRPF Monthly 2026
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_monthly', '2026-01-01', NULL,
  '[{"min":0,"max":2428.80,"rate":0,"deduction":0},{"min":2428.81,"max":2826.65,"rate":7.5,"deduction":182.16},{"min":2826.66,"max":3751.05,"rate":15,"deduction":394.16},{"min":3751.06,"max":4664.68,"rate":22.5,"deduction":675.49},{"min":4664.69,"max":99999999,"rate":27.5,"deduction":908.73}]'::JSONB,
  '{"simplified_discount_monthly":607.20,"dependent_deduction_monthly":189.59,"reduction_flat":312.89,"reduction_formula_constant":978.62,"reduction_formula_factor":0.133145,"reduction_threshold_full":5000,"reduction_threshold_partial":7350,"annual_exemption":60000,"annual_simplified_discount":17640,"education_deduction_annual_per_person":3561.50}'::JSONB,
  '[{"source":"RFB","url":"https://www.gov.br/receitafederal","date":"2025-12-11"},{"source":"Lei 15.270/2025","url":"https://www.planalto.gov.br","date":"2025-11-26"}]'::JSONB,
  'system_seed'
);

-- IRPF Annual 2025
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_annual', '2025-01-01', '2025-12-31',
  '[{"min":0,"max":26963.20,"rate":0,"deduction":0},{"min":26963.21,"max":33919.80,"rate":7.5,"deduction":2022.24},{"min":33919.81,"max":45012.60,"rate":15,"deduction":4566.23},{"min":45012.61,"max":55976.16,"rate":22.5,"deduction":7942.17},{"min":55976.17,"max":99999999,"rate":27.5,"deduction":10740.98}]'::JSONB,
  '{"simplified_discount_annual":16754.34}'::JSONB,
  '[{"source":"RFB","url":"https://www.gov.br/receitafederal","date":"2025-01-01"}]'::JSONB,
  'system_seed'
);

-- IRPF Annual 2026
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'irpf_annual', '2026-01-01', NULL,
  '[{"min":0,"max":29145.60,"rate":0,"deduction":0},{"min":29145.61,"max":33919.80,"rate":7.5,"deduction":2185.92},{"min":33919.81,"max":45012.60,"rate":15,"deduction":4731.41},{"min":45012.61,"max":55976.16,"rate":22.5,"deduction":8107.35},{"min":55976.17,"max":99999999,"rate":27.5,"deduction":10906.16}]'::JSONB,
  '{"annual_exemption":60000,"simplified_discount_annual":17640,"annual_reduction_flat":3754.68,"annual_reduction_formula_constant":11743.44,"annual_reduction_formula_factor":0.133145,"annual_reduction_threshold_full":60000,"annual_reduction_threshold_partial":88200}'::JSONB,
  '[{"source":"RFB","url":"https://www.gov.br/receitafederal","date":"2025-12-11"},{"source":"Lei 15.270/2025","url":"https://www.planalto.gov.br","date":"2025-11-26"}]'::JSONB,
  'system_seed'
);

-- INSS Employee 2025
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'inss_employee', '2025-01-01', '2025-12-31',
  '[{"min":0,"max":1518.00,"rate":7.5},{"min":1518.01,"max":2793.88,"rate":9},{"min":2793.89,"max":4190.83,"rate":12},{"min":4190.84,"max":8157.41,"rate":14}]'::JSONB,
  '{"ceiling":8157.41}'::JSONB,
  '[{"source":"Portaria MPS/MF","url":"https://www.in.gov.br","date":"2025-01-01"}]'::JSONB,
  'system_seed'
);

-- Minimum Wage 2025
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'minimum_wage', '2025-01-01', '2025-12-31',
  '[]'::JSONB,
  '{"value":1518.00}'::JSONB,
  '[{"source":"Decreto Presidencial","url":"https://www.planalto.gov.br","date":"2025-01-01"}]'::JSONB,
  'system_seed'
);

-- Capital Gains (since 2016)
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references, updated_by)
VALUES (
  'capital_gains', '2016-01-01', NULL,
  '[{"min":0,"max":5000000,"rate":15},{"min":5000001,"max":10000000,"rate":17.5},{"min":10000001,"max":30000000,"rate":20},{"min":30000001,"max":99999999999,"rate":22.5}]'::JSONB,
  '{"stock_monthly_exemption":20000,"crypto_monthly_exemption":35000}'::JSONB,
  '[{"source":"Lei 13.259/2016","url":"https://www.planalto.gov.br","date":"2016-03-16"}]'::JSONB,
  'system_seed'
);

-- INSS Employee 2026
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references)
VALUES (
  'inss_employee', '2026-01-01', NULL,
  '[{"min":0,"max":1621.00,"rate":7.5},{"min":1621.01,"max":2902.84,"rate":9},{"min":2902.85,"max":4354.27,"rate":12},{"min":4354.28,"max":8475.55,"rate":14}]'::jsonb,
  '{"ceiling":8475.55}'::jsonb,
  '[{"source":"Portaria MPS/MF 13/2026","url":"https://www.legisweb.com.br/legislacao/?id=489284","date":"2026-01-09"},{"source":"INSS Gov","url":"https://www.gov.br/inss/pt-br/assuntos/com-reajuste-de-3-9-teto-do-inss-chega-a-r-8-475-55-em-2026","date":"2026-01-12"}]'::jsonb
);

-- Minimum Wage 2026
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references)
VALUES (
  'minimum_wage', '2026-01-01', NULL,
  '[]'::jsonb,
  '{"value":1621.00}'::jsonb,
  '[{"source":"Decreto Presidencial","url":"https://www.planalto.gov.br","date":"2026-01-01"},{"source":"Portaria MPS/MF 13/2026","url":"https://www.legisweb.com.br/legislacao/?id=489284","date":"2026-01-09"}]'::jsonb
);

-- Prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_params_unique
ON tax_parameters (parameter_type, valid_from);
