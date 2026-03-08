/**
 * WealthOS Database Types
 * Auto-generated from Supabase schema (2026-03-08)
 * 23 tabelas | 21 ENUMs | 3 Functions
 * Regenerate: npx supabase gen types typescript --project-id hmwdfcsxtmbzlslxgqus > src/types/database.ts
 */


export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: { coa_id: string | null; color: string | null; created_at: string; current_balance: number; id: string; initial_balance: number; is_active: boolean; liquidity_tier: string; name: string; projected_balance: number; type: Database["public"]["Enums"]["account_type"]; updated_at: string; user_id: string }
        Insert: { coa_id?: string | null; color?: string | null; created_at?: string; current_balance?: number; id?: string; initial_balance?: number; is_active?: boolean; liquidity_tier?: string; name: string; projected_balance?: number; type: Database["public"]["Enums"]["account_type"]; updated_at?: string; user_id: string }
        Update: { coa_id?: string | null; color?: string | null; created_at?: string; current_balance?: number; id?: string; initial_balance?: number; is_active?: boolean; liquidity_tier?: string; name?: string; projected_balance?: number; type?: Database["public"]["Enums"]["account_type"]; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "accounts_coa_id_fkey"; columns: ["coa_id"]; isOneToOne: false; referencedRelation: "chart_of_accounts"; referencedColumns: ["id"] }]
      }
      asset_value_history: {
        Row: { asset_id: string; change_reason: string | null; change_source: Database["public"]["Enums"]["value_change_source"]; created_at: string; id: string; new_value: number; previous_value: number; user_id: string }
        Insert: { asset_id: string; change_reason?: string | null; change_source: Database["public"]["Enums"]["value_change_source"]; created_at?: string; id?: string; new_value: number; previous_value: number; user_id: string }
        Update: { asset_id?: string; change_reason?: string | null; change_source?: Database["public"]["Enums"]["value_change_source"]; created_at?: string; id?: string; new_value?: number; previous_value?: number; user_id?: string }
        Relationships: [{ foreignKeyName: "asset_value_history_asset_id_fkey"; columns: ["asset_id"]; isOneToOne: false; referencedRelation: "assets"; referencedColumns: ["id"] }]
      }
      assets: {
        Row: { acquisition_date: string; acquisition_value: number; category: Database["public"]["Enums"]["asset_category"]; coa_id: string | null; created_at: string; current_value: number; depreciation_rate: number; id: string; insurance_expiry: string | null; insurance_policy: string | null; name: string; notes_encrypted: string | null; updated_at: string; user_id: string }
        Insert: { acquisition_date: string; acquisition_value: number; category: Database["public"]["Enums"]["asset_category"]; coa_id?: string | null; created_at?: string; current_value: number; depreciation_rate?: number; id?: string; insurance_expiry?: string | null; insurance_policy?: string | null; name: string; notes_encrypted?: string | null; updated_at?: string; user_id: string }
        Update: { acquisition_date?: string; acquisition_value?: number; category?: Database["public"]["Enums"]["asset_category"]; coa_id?: string | null; created_at?: string; current_value?: number; depreciation_rate?: number; id?: string; insurance_expiry?: string | null; insurance_policy?: string | null; name?: string; notes_encrypted?: string | null; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "assets_coa_id_fkey"; columns: ["coa_id"]; isOneToOne: false; referencedRelation: "chart_of_accounts"; referencedColumns: ["id"] }]
      }
      budgets: {
        Row: { adjustment_index: Database["public"]["Enums"]["adjustment_index_type"] | null; alert_threshold: number; category_id: string; coa_id: string | null; cost_center_id: string | null; created_at: string; id: string; month: string; planned_amount: number; updated_at: string; user_id: string }
        Insert: { adjustment_index?: Database["public"]["Enums"]["adjustment_index_type"] | null; alert_threshold?: number; category_id: string; coa_id?: string | null; cost_center_id?: string | null; created_at?: string; id?: string; month: string; planned_amount: number; updated_at?: string; user_id: string }
        Update: { adjustment_index?: Database["public"]["Enums"]["adjustment_index_type"] | null; alert_threshold?: number; category_id?: string; coa_id?: string | null; cost_center_id?: string | null; created_at?: string; id?: string; month?: string; planned_amount?: number; updated_at?: string; user_id?: string }
        Relationships: []
      }
      categories: {
        Row: { color: string | null; created_at: string; icon: string | null; id: string; is_system: boolean; name: string; parent_id: string | null; type: Database["public"]["Enums"]["category_type"]; updated_at: string; user_id: string }
        Insert: { color?: string | null; created_at?: string; icon?: string | null; id?: string; is_system?: boolean; name: string; parent_id?: string | null; type: Database["public"]["Enums"]["category_type"]; updated_at?: string; user_id: string }
        Update: { color?: string | null; created_at?: string; icon?: string | null; id?: string; is_system?: boolean; name?: string; parent_id?: string | null; type?: Database["public"]["Enums"]["category_type"]; updated_at?: string; user_id?: string }
        Relationships: []
      }
      center_allocations: {
        Row: { amount: number; cost_center_id: string; id: string; journal_line_id: string; percentage: number }
        Insert: { amount: number; cost_center_id: string; id?: string; journal_line_id: string; percentage: number }
        Update: { amount?: number; cost_center_id?: string; id?: string; journal_line_id?: string; percentage?: number }
        Relationships: []
      }
      chart_of_accounts: {
        Row: { account_name: string; color: string | null; created_at: string; depth: number; dirpf_group: string | null; display_name: string; group_type: Database["public"]["Enums"]["group_type"]; icon: string | null; id: string; internal_code: string; is_active: boolean; is_system: boolean; parent_id: string | null; sort_order: number; tax_treatment: Database["public"]["Enums"]["tax_treatment_type"] | null; updated_at: string; user_id: string }
        Insert: { account_name: string; color?: string | null; created_at?: string; depth?: number; dirpf_group?: string | null; display_name: string; group_type: Database["public"]["Enums"]["group_type"]; icon?: string | null; id?: string; internal_code: string; is_active?: boolean; is_system?: boolean; parent_id?: string | null; sort_order?: number; tax_treatment?: Database["public"]["Enums"]["tax_treatment_type"] | null; updated_at?: string; user_id: string }
        Update: { account_name?: string; color?: string | null; created_at?: string; depth?: number; dirpf_group?: string | null; display_name?: string; group_type?: Database["public"]["Enums"]["group_type"]; icon?: string | null; id?: string; internal_code?: string; is_active?: boolean; is_system?: boolean; parent_id?: string | null; sort_order?: number; tax_treatment?: Database["public"]["Enums"]["tax_treatment_type"] | null; updated_at?: string; user_id?: string }
        Relationships: []
      }
      cost_centers: {
        Row: { color: string | null; created_at: string; icon: string | null; id: string; is_active: boolean; is_default: boolean; name: string; parent_id: string | null; type: Database["public"]["Enums"]["center_type"]; updated_at: string; user_id: string }
        Insert: { color?: string | null; created_at?: string; icon?: string | null; id?: string; is_active?: boolean; is_default?: boolean; name: string; parent_id?: string | null; type?: Database["public"]["Enums"]["center_type"]; updated_at?: string; user_id: string }
        Update: { color?: string | null; created_at?: string; icon?: string | null; id?: string; is_active?: boolean; is_default?: boolean; name?: string; parent_id?: string | null; type?: Database["public"]["Enums"]["center_type"]; updated_at?: string; user_id?: string }
        Relationships: []
      }
      documents: {
        Row: { created_at: string; file_name: string; file_path: string; id: string; mime_type: string; related_id: string; related_table: string; size_bytes: number; thumbnail_path: string | null; updated_at: string; user_id: string }
        Insert: { created_at?: string; file_name: string; file_path: string; id?: string; mime_type: string; related_id: string; related_table: string; size_bytes: number; thumbnail_path?: string | null; updated_at?: string; user_id: string }
        Update: { created_at?: string; file_name?: string; file_path?: string; id?: string; mime_type?: string; related_id?: string; related_table?: string; size_bytes?: number; thumbnail_path?: string | null; updated_at?: string; user_id?: string }
        Relationships: []
      }
      economic_indices: {
        Row: { accumulated_12m: number | null; accumulated_year: number | null; fetched_at: string; id: string; index_type: Database["public"]["Enums"]["index_type"]; reference_date: string; source_primary: string; source_secondary: string | null; value: number }
        Insert: { accumulated_12m?: number | null; accumulated_year?: number | null; fetched_at?: string; id?: string; index_type: Database["public"]["Enums"]["index_type"]; reference_date: string; source_primary: string; source_secondary?: string | null; value: number }
        Update: { accumulated_12m?: number | null; accumulated_year?: number | null; fetched_at?: string; id?: string; index_type?: Database["public"]["Enums"]["index_type"]; reference_date?: string; source_primary?: string; source_secondary?: string | null; value?: number }
        Relationships: []
      }
      economic_indices_sources: {
        Row: { api_url_template: string; id: string; index_type: Database["public"]["Enums"]["index_type"]; is_active: boolean; periodicity: Database["public"]["Enums"]["periodicity_type"]; priority: number; provider: string; series_code: string }
        Insert: { api_url_template: string; id?: string; index_type: Database["public"]["Enums"]["index_type"]; is_active?: boolean; periodicity: Database["public"]["Enums"]["periodicity_type"]; priority: number; provider: string; series_code: string }
        Update: { api_url_template?: string; id?: string; index_type?: Database["public"]["Enums"]["index_type"]; is_active?: boolean; periodicity?: Database["public"]["Enums"]["periodicity_type"]; priority?: number; provider?: string; series_code?: string }
        Relationships: []
      }
      journal_entries: {
        Row: { created_at: string; description: string | null; document_url: string | null; entry_date: string; id: string; is_reversal: boolean; notes_encrypted: string | null; occurred_at: string | null; posted_at: string | null; reversed_entry_id: string | null; source: Database["public"]["Enums"]["entry_source"]; transaction_id: string | null; user_date: string | null; user_id: string; workflow_task_id: string | null }
        Insert: { created_at?: string; description?: string | null; document_url?: string | null; entry_date: string; id?: string; is_reversal?: boolean; notes_encrypted?: string | null; occurred_at?: string | null; posted_at?: string | null; reversed_entry_id?: string | null; source?: Database["public"]["Enums"]["entry_source"]; transaction_id?: string | null; user_date?: string | null; user_id: string; workflow_task_id?: string | null }
        Update: { created_at?: string; description?: string | null; document_url?: string | null; entry_date?: string; id?: string; is_reversal?: boolean; notes_encrypted?: string | null; occurred_at?: string | null; posted_at?: string | null; reversed_entry_id?: string | null; source?: Database["public"]["Enums"]["entry_source"]; transaction_id?: string | null; user_date?: string | null; user_id?: string; workflow_task_id?: string | null }
        Relationships: []
      }
      journal_lines: {
        Row: { account_id: string; amount_credit: number; amount_debit: number; id: string; journal_entry_id: string; memo: string | null }
        Insert: { account_id: string; amount_credit?: number; amount_debit?: number; id?: string; journal_entry_id: string; memo?: string | null }
        Update: { account_id?: string; amount_credit?: number; amount_debit?: number; id?: string; journal_entry_id?: string; memo?: string | null }
        Relationships: []
      }
      monthly_snapshots: {
        Row: { burn_rate: number | null; created_at: string; id: string; lcr: number | null; month: string; runway_months: number | null; tier1_total: number | null; tier2_total: number | null; tier3_total: number | null; tier4_total: number | null; total_assets: number; total_balance: number; total_expense: number; total_income: number; total_projected: number; user_id: string }
        Insert: { burn_rate?: number | null; created_at?: string; id?: string; lcr?: number | null; month: string; runway_months?: number | null; tier1_total?: number | null; tier2_total?: number | null; tier3_total?: number | null; tier4_total?: number | null; total_assets?: number; total_balance?: number; total_expense?: number; total_income?: number; total_projected?: number; user_id: string }
        Update: { burn_rate?: number | null; created_at?: string; id?: string; lcr?: number | null; month?: string; runway_months?: number | null; tier1_total?: number | null; tier2_total?: number | null; tier3_total?: number | null; tier4_total?: number | null; total_assets?: number; total_balance?: number; total_expense?: number; total_income?: number; total_projected?: number; user_id?: string }
        Relationships: []
      }
      notification_log: {
        Row: { body: string; id: string; reference_id: string | null; sent_at: string; status: Database["public"]["Enums"]["notification_status"]; title: string; type: Database["public"]["Enums"]["notification_type"]; user_id: string }
        Insert: { body: string; id?: string; reference_id?: string | null; sent_at?: string; status: Database["public"]["Enums"]["notification_status"]; title: string; type: Database["public"]["Enums"]["notification_type"]; user_id: string }
        Update: { body?: string; id?: string; reference_id?: string | null; sent_at?: string; status?: Database["public"]["Enums"]["notification_status"]; title?: string; type?: Database["public"]["Enums"]["notification_type"]; user_id?: string }
        Relationships: []
      }
      notification_tokens: {
        Row: { created_at: string; device_name: string | null; device_token: string; id: string; is_active: boolean; platform: string; updated_at: string; user_id: string }
        Insert: { created_at?: string; device_name?: string | null; device_token: string; id?: string; is_active?: boolean; platform?: string; updated_at?: string; user_id: string }
        Update: { created_at?: string; device_name?: string | null; device_token?: string; id?: string; is_active?: boolean; platform?: string; updated_at?: string; user_id?: string }
        Relationships: []
      }
      recurrences: {
        Row: { adjustment_index: Database["public"]["Enums"]["adjustment_index_type"] | null; adjustment_rate: number | null; coa_id: string | null; cost_center_id: string | null; created_at: string; end_date: string | null; frequency: Database["public"]["Enums"]["recurrence_frequency"]; id: string; interval_count: number; is_active: boolean; next_due_date: string; start_date: string; template_transaction: Json; updated_at: string; user_id: string }
        Insert: { adjustment_index?: Database["public"]["Enums"]["adjustment_index_type"] | null; adjustment_rate?: number | null; coa_id?: string | null; cost_center_id?: string | null; created_at?: string; end_date?: string | null; frequency: Database["public"]["Enums"]["recurrence_frequency"]; id?: string; interval_count?: number; is_active?: boolean; next_due_date: string; start_date: string; template_transaction: Json; updated_at?: string; user_id: string }
        Update: { adjustment_index?: Database["public"]["Enums"]["adjustment_index_type"] | null; adjustment_rate?: number | null; coa_id?: string | null; cost_center_id?: string | null; created_at?: string; end_date?: string | null; frequency?: Database["public"]["Enums"]["recurrence_frequency"]; id?: string; interval_count?: number; is_active?: boolean; next_due_date?: string; start_date?: string; template_transaction?: Json; updated_at?: string; user_id?: string }
        Relationships: []
      }
      tax_parameters: {
        Row: { brackets: Json; created_at: string; id: string; limits: Json | null; parameter_type: Database["public"]["Enums"]["parameter_type"]; source_references: Json; updated_at: string; updated_by: string | null; valid_from: string; valid_until: string | null }
        Insert: { brackets?: Json; created_at?: string; id?: string; limits?: Json | null; parameter_type: Database["public"]["Enums"]["parameter_type"]; source_references?: Json; updated_at?: string; updated_by?: string | null; valid_from: string; valid_until?: string | null }
        Update: { brackets?: Json; created_at?: string; id?: string; limits?: Json | null; parameter_type?: Database["public"]["Enums"]["parameter_type"]; source_references?: Json; updated_at?: string; updated_by?: string | null; valid_from?: string; valid_until?: string | null }
        Relationships: []
      }
      tax_records: {
        Row: { amount: number; created_at: string; details_encrypted: string | null; document_url: string | null; id: string; irrf_withheld: number; source: string | null; type: Database["public"]["Enums"]["tax_record_type"]; updated_at: string; user_id: string; year: number }
        Insert: { amount: number; created_at?: string; details_encrypted?: string | null; document_url?: string | null; id?: string; irrf_withheld?: number; source?: string | null; type: Database["public"]["Enums"]["tax_record_type"]; updated_at?: string; user_id: string; year: number }
        Update: { amount?: number; created_at?: string; details_encrypted?: string | null; document_url?: string | null; id?: string; irrf_withheld?: number; source?: string | null; type?: Database["public"]["Enums"]["tax_record_type"]; updated_at?: string; user_id?: string; year?: number }
        Relationships: []
      }
      transactions: {
        Row: { account_id: string; amount: number; category_id: string | null; created_at: string; date: string; description: string | null; id: string; is_deleted: boolean; is_paid: boolean; journal_entry_id: string | null; notes: string | null; occurred_at: string | null; posted_at: string | null; recurrence_id: string | null; source: Database["public"]["Enums"]["entry_source"]; tags: string[] | null; transfer_pair_id: string | null; type: Database["public"]["Enums"]["transaction_type"]; updated_at: string; user_id: string }
        Insert: { account_id: string; amount: number; category_id?: string | null; created_at?: string; date: string; description?: string | null; id?: string; is_deleted?: boolean; is_paid?: boolean; journal_entry_id?: string | null; notes?: string | null; occurred_at?: string | null; posted_at?: string | null; recurrence_id?: string | null; source?: Database["public"]["Enums"]["entry_source"]; tags?: string[] | null; transfer_pair_id?: string | null; type: Database["public"]["Enums"]["transaction_type"]; updated_at?: string; user_id: string }
        Update: { account_id?: string; amount?: number; category_id?: string | null; created_at?: string; date?: string; description?: string | null; id?: string; is_deleted?: boolean; is_paid?: boolean; journal_entry_id?: string | null; notes?: string | null; occurred_at?: string | null; posted_at?: string | null; recurrence_id?: string | null; source?: Database["public"]["Enums"]["entry_source"]; tags?: string[] | null; transfer_pair_id?: string | null; type?: Database["public"]["Enums"]["transaction_type"]; updated_at?: string; user_id?: string }
        Relationships: []
      }
      users_profile: {
        Row: { cpf_encrypted: string | null; created_at: string; default_currency: string; deletion_requested_at: string | null; encryption_key_encrypted: string | null; encryption_key_iv: string | null; full_name: string | null; id: string; onboarding_completed: boolean; updated_at: string }
        Insert: { cpf_encrypted?: string | null; created_at?: string; default_currency?: string; deletion_requested_at?: string | null; encryption_key_encrypted?: string | null; encryption_key_iv?: string | null; full_name?: string | null; id: string; onboarding_completed?: boolean; updated_at?: string }
        Update: { cpf_encrypted?: string | null; created_at?: string; default_currency?: string; deletion_requested_at?: string | null; encryption_key_encrypted?: string | null; encryption_key_iv?: string | null; full_name?: string | null; id?: string; onboarding_completed?: boolean; updated_at?: string }
        Relationships: []
      }
      workflow_tasks: {
        Row: { completed_at: string | null; created_at: string; description: string | null; document_id: string | null; id: string; period_end: string; period_start: string; result_data: Json | null; status: Database["public"]["Enums"]["task_status"]; task_type: Database["public"]["Enums"]["task_type"]; user_id: string; workflow_id: string }
        Insert: { completed_at?: string | null; created_at?: string; description?: string | null; document_id?: string | null; id?: string; period_end: string; period_start: string; result_data?: Json | null; status?: Database["public"]["Enums"]["task_status"]; task_type: Database["public"]["Enums"]["task_type"]; user_id: string; workflow_id: string }
        Update: { completed_at?: string | null; created_at?: string; description?: string | null; document_id?: string | null; id?: string; period_end?: string; period_start?: string; result_data?: Json | null; status?: Database["public"]["Enums"]["task_status"]; task_type?: Database["public"]["Enums"]["task_type"]; user_id?: string; workflow_id?: string }
        Relationships: []
      }
      workflows: {
        Row: { created_at: string; day_of_period: number | null; id: string; is_active: boolean; last_completed_at: string | null; name: string; periodicity: Database["public"]["Enums"]["workflow_periodicity"]; related_account_id: string | null; related_coa_id: string | null; updated_at: string; user_id: string; workflow_type: Database["public"]["Enums"]["workflow_type"] }
        Insert: { created_at?: string; day_of_period?: number | null; id?: string; is_active?: boolean; last_completed_at?: string | null; name: string; periodicity?: Database["public"]["Enums"]["workflow_periodicity"]; related_account_id?: string | null; related_coa_id?: string | null; updated_at?: string; user_id: string; workflow_type: Database["public"]["Enums"]["workflow_type"] }
        Update: { created_at?: string; day_of_period?: number | null; id?: string; is_active?: boolean; last_completed_at?: string | null; name?: string; periodicity?: Database["public"]["Enums"]["workflow_periodicity"]; related_account_id?: string | null; related_coa_id?: string | null; updated_at?: string; user_id?: string; workflow_type?: Database["public"]["Enums"]["workflow_type"] }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_default_categories: { Args: { p_user_id: string }; Returns: undefined }
      create_default_chart_of_accounts: { Args: { p_user_id: string }; Returns: undefined }
      create_default_cost_center: { Args: { p_user_id: string }; Returns: string }
      create_transaction_with_journal: {
        Args: {
          p_user_id: string
          p_account_id: string
          p_category_id?: string | null
          p_type?: Database["public"]["Enums"]["transaction_type"]
          p_amount?: number
          p_description?: string | null
          p_date?: string
          p_is_paid?: boolean
          p_source?: Database["public"]["Enums"]["entry_source"]
          p_notes?: string | null
          p_tags?: string[] | null
          p_counterpart_coa_id?: string | null
        }
        Returns: Json
      }
      reverse_transaction: {
        Args: { p_user_id: string; p_transaction_id: string }
        Returns: Json
      }
      get_dashboard_summary: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_balance_sheet: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_solvency_metrics: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_top_categories: {
        Args: { p_user_id: string; p_year?: number; p_month?: number; p_limit?: number }
        Returns: Json
      }
      get_balance_evolution: {
        Args: { p_user_id: string; p_months?: number }
        Returns: Json
      }
      get_budget_vs_actual: {
        Args: { p_user_id: string; p_year?: number; p_month?: number }
        Returns: Json
      }
      generate_next_recurrence: {
        Args: { p_user_id: string; p_recurrence_id: string }
        Returns: Json
      }
      depreciate_asset: {
        Args: { p_user_id: string; p_asset_id: string }
        Returns: Json
      }
      get_assets_summary: {
        Args: { p_user_id: string }
        Returns: Json
      }
      allocate_to_centers: {
        Args: { p_user_id: string; p_transaction_id: string; p_allocations: string }
        Returns: Json
      }
      get_center_pnl: {
        Args: { p_user_id: string; p_center_id: string; p_date_from?: string; p_date_to?: string }
        Returns: Json
      }
      get_center_export: {
        Args: { p_user_id: string; p_center_id: string }
        Returns: Json
      }
    }
    Enums: {
      account_type: "checking" | "savings" | "credit_card" | "cash" | "investment"
      adjustment_index_type: "ipca" | "igpm" | "inpc" | "selic" | "manual" | "none"
      asset_category: "real_estate" | "vehicle" | "electronics" | "other" | "restricted"
      category_type: "income" | "expense"
      center_type: "cost_center" | "profit_center" | "neutral"
      entry_source: "bank_feed" | "card_feed" | "manual" | "csv_import" | "ofx_import" | "ocr" | "system"
      group_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      index_type: "ipca" | "inpc" | "igpm" | "selic" | "cdi" | "tr" | "usd_brl" | "minimum_wage" | "ipca_food" | "ipca_housing" | "ipca_transport" | "ipca_health" | "ipca_education"
      notification_status: "sent" | "failed" | "skipped"
      notification_type: "bill_due" | "budget_alert" | "insurance_expiry" | "account_deletion"
      parameter_type: "irpf_monthly" | "irpf_annual" | "irpf_reduction" | "irpf_min_high_income" | "inss_employee" | "inss_ceiling" | "minimum_wage" | "capital_gains" | "crypto_exemption" | "stock_exemption"
      periodicity_type: "daily" | "monthly" | "annual"
      recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly"
      task_status: "pending" | "in_progress" | "completed" | "skipped"
      task_type: "upload_document" | "update_balance" | "categorize_transactions" | "review_fiscal"
      tax_record_type: "income" | "deduction" | "asset" | "debt"
      tax_treatment_type: "tributavel" | "isento" | "exclusivo_fonte" | "ganho_capital" | "dedutivel_integral" | "dedutivel_limitado" | "nao_dedutivel" | "variavel"
      transaction_type: "income" | "expense" | "transfer"
      value_change_source: "manual" | "depreciation"
      workflow_periodicity: "weekly" | "biweekly" | "monthly"
      workflow_type: "bank_statement" | "card_statement" | "loan_payment" | "investment_update" | "fiscal_review"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
