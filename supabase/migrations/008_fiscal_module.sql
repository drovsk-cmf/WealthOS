-- ============================================
-- WealthOS - Migration 008: Fiscal Module
-- ============================================
-- Applied: 2026-03-08 via Supabase MCP
-- Phase 7: FIS-01 to FIS-06 + Tax Provisioning Intelligence
-- ============================================

-- SEED: 7 records in tax_parameters
--   - IRPF monthly 2025 + 2026 (with Lei 15.270/2025 reductions)
--   - IRPF annual 2025 + 2026
--   - INSS employee 2025
--   - Minimum wage 2025
--   - Capital gains (Lei 13.259/2016)

-- 1. get_fiscal_report(p_user_id, p_year) → JSON
--    FIS-01 to FIS-04, FIS-06: Groups journal_entries by tax_treatment.
--    Returns: {year, by_treatment[], totals{tributavel, isento, dedutivel}}

-- 2. get_fiscal_projection(p_user_id, p_year) → JSON
--    TAX PROVISIONING INTELLIGENCE (Claudio's scenario)
--    Calculates: YTD taxable income → projected annual → progressive table
--    → annual reduction (Lei 15.270) → IRRF gap → monthly provision
--    Returns: {projected_annual_income, estimated_annual_tax, tax_gap,
--              monthly_provision, months_remaining, disclaimer}
