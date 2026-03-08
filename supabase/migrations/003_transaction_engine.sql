-- ============================================
-- WealthOS - Migration 003: Transaction Engine
-- ============================================
-- Applied: 2026-03-08 via Supabase MCP
-- Functions: create_transaction_with_journal(), reverse_transaction()
-- ============================================

-- See full SQL in Supabase migration history.
-- This file documents the migration for version control.
-- Applied via: Supabase:apply_migration MCP tool

-- create_transaction_with_journal(p_user_id, p_account_id, p_category_id, p_type, p_amount,
--   p_description, p_date, p_is_paid, p_source, p_notes, p_tags, p_counterpart_coa_id)
-- RETURNS JSON { transaction_id, journal_entry_id }
--
-- Atomic: creates transaction + journal_entry + 2 journal_lines
-- Debit/credit rules:
--   income: D asset, C revenue
--   expense (bank): D expense, C asset
--   expense (card): D expense, C liability
-- Balance recalculation via existing trigger recalculate_account_balance()

-- reverse_transaction(p_user_id, p_transaction_id)
-- RETURNS JSON { reversed_transaction_id, reversal_journal_id }
--
-- Soft-deletes transaction (is_deleted=true)
-- Creates reversal journal_entry (is_reversal=true, swapped debit/credit)
-- Append-only: original journal never modified
