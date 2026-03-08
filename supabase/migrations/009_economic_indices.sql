-- ============================================
-- WealthOS - Migration 009: Economic Indices
-- ============================================
-- Applied: 2026-03-08 via Supabase MCP
-- Phase 8: Index collection, storage, querying
-- ============================================

-- SEED: 24 records (11 IPCA + 13 Selic, Mar 2025 - Mar 2026)
-- IPCA with calculated accumulated_year and accumulated_12m

-- 1. get_economic_indices(p_index_type?, p_date_from?, p_date_to?, p_limit?) → JSON
--    Read indices with filters. Public (anon + authenticated).
--    Returns: {data[], filters{}}

-- 2. get_index_latest() → JSON
--    Latest value per index type. Public.
--    Returns: {indices[{index_type, reference_date, value, ...}]}
