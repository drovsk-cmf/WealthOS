-- =============================================================
-- Migration 024: INSS 2026 + Salário Mínimo 2026
-- Fonte: Portaria Interministerial MPS/MF Nº 13 (DOU 12/01/2026)
-- =============================================================

-- Close INSS 2025 validity
UPDATE tax_parameters
SET valid_until = '2025-12-31'
WHERE parameter_type = 'inss_employee'
  AND valid_from = '2025-01-01'
  AND valid_until = '2025-12-31';

-- Close Salário Mínimo 2025 validity
UPDATE tax_parameters
SET valid_until = '2025-12-31'
WHERE parameter_type = 'minimum_wage'
  AND valid_from = '2025-01-01'
  AND valid_until = '2025-12-31';

-- INSS 2026
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references)
VALUES (
  'inss_employee',
  '2026-01-01',
  NULL,
  '[
    {"min": 0,       "max": 1621.00, "rate": 7.5},
    {"min": 1621.01, "max": 2902.84, "rate": 9},
    {"min": 2902.85, "max": 4354.27, "rate": 12},
    {"min": 4354.28, "max": 8475.55, "rate": 14}
  ]'::jsonb,
  '{"ceiling": 8475.55}'::jsonb,
  '[
    {"source": "Portaria MPS/MF 13/2026", "url": "https://www.legisweb.com.br/legislacao/?id=489284", "date": "2026-01-09"},
    {"source": "INSS Gov", "url": "https://www.gov.br/inss/pt-br/assuntos/com-reajuste-de-3-9-teto-do-inss-chega-a-r-8-475-55-em-2026", "date": "2026-01-12"}
  ]'::jsonb
);

-- Salário Mínimo 2026
INSERT INTO tax_parameters (parameter_type, valid_from, valid_until, brackets, limits, source_references)
VALUES (
  'minimum_wage',
  '2026-01-01',
  NULL,
  '[]'::jsonb,
  '{"value": 1621.00}'::jsonb,
  '[
    {"source": "Decreto Presidencial", "url": "https://www.planalto.gov.br", "date": "2026-01-01"},
    {"source": "Portaria MPS/MF 13/2026", "url": "https://www.legisweb.com.br/legislacao/?id=489284", "date": "2026-01-09"}
  ]'::jsonb
);
