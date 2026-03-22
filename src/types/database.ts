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
      access_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          bank_connection_id: string | null
          coa_id: string | null
          color: string | null
          created_at: string
          currency: string
          current_balance: number
          external_account_id: string | null
          id: string
          initial_balance: number
          is_active: boolean
          liquidity_tier: string
          name: string
          projected_balance: number
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_connection_id?: string | null
          coa_id?: string | null
          color?: string | null
          created_at?: string
          currency?: string
          current_balance?: number
          external_account_id?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          liquidity_tier?: string
          name: string
          projected_balance?: number
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_connection_id?: string | null
          coa_id?: string | null
          color?: string | null
          created_at?: string
          currency?: string
          current_balance?: number
          external_account_id?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          liquidity_tier?: string
          name?: string
          projected_balance?: number
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_bank_connection_id_fkey"
            columns: ["bank_connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_coa_id_fkey"
            columns: ["coa_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cache: {
        Row: { id: string; prompt_hash: string; model: string; use_case: string; prompt_sanitized: string; response: Json; tokens_in: number; tokens_out: number; created_at: string; expires_at: string }
        Insert: { id?: string; prompt_hash: string; model: string; use_case: string; prompt_sanitized: string; response: Json; tokens_in?: number; tokens_out?: number; created_at?: string; expires_at?: string }
        Update: { id?: string; prompt_hash?: string; model?: string; use_case?: string; prompt_sanitized?: string; response?: Json; tokens_in?: number; tokens_out?: number; created_at?: string; expires_at?: string }
        Relationships: []
      }
      ai_usage_log: {
        Row: { id: string; user_id: string; use_case: string; model: string; tokens_in: number; tokens_out: number; cost_usd: number; cached: boolean; created_at: string }
        Insert: { id?: string; user_id: string; use_case: string; model: string; tokens_in?: number; tokens_out?: number; cost_usd?: number; cached?: boolean; created_at?: string }
        Update: { id?: string; user_id?: string; use_case?: string; model?: string; tokens_in?: number; tokens_out?: number; cost_usd?: number; cached?: boolean; created_at?: string }
        Relationships: []
      }
      asset_templates: {
        Row: { id: string; name: string; category: string; default_depreciation_rate: number; reference_value_brl: number | null; useful_life_years: number | null; tags: string[]; is_active: boolean; created_at: string }
        Insert: { id?: string; name: string; category: string; default_depreciation_rate?: number; reference_value_brl?: number | null; useful_life_years?: number | null; tags?: string[]; is_active?: boolean; created_at?: string }
        Update: { id?: string; name?: string; category?: string; default_depreciation_rate?: number; reference_value_brl?: number | null; useful_life_years?: number | null; tags?: string[]; is_active?: boolean; created_at?: string }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string
          event_name: string
          properties: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_name: string
          properties?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_name?: string
          properties?: Json
          created_at?: string
        }
        Relationships: []
      }
      asset_value_history: {
        Row: {
          asset_id: string
          change_reason: string | null
          change_source: Database["public"]["Enums"]["value_change_source"]
          created_at: string
          id: string
          new_value: number
          previous_value: number
          user_id: string
        }
        Insert: {
          asset_id: string
          change_reason?: string | null
          change_source: Database["public"]["Enums"]["value_change_source"]
          created_at?: string
          id?: string
          new_value: number
          previous_value: number
          user_id: string
        }
        Update: {
          asset_id?: string
          change_reason?: string | null
          change_source?: Database["public"]["Enums"]["value_change_source"]
          created_at?: string
          id?: string
          new_value?: number
          previous_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_value_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          acquisition_date: string
          acquisition_value: number
          category: Database["public"]["Enums"]["asset_category"]
          coa_id: string | null
          created_at: string
          currency: string
          current_value: number
          depreciation_rate: number
          id: string
          insurance_expiry: string | null
          insurance_policy: string | null
          license_plate: string | null
          name: string
          notes_encrypted: string | null
          parent_asset_id: string | null
          updated_at: string
          user_id: string
          vehicle_brand: string | null
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        Insert: {
          acquisition_date: string
          acquisition_value: number
          category: Database["public"]["Enums"]["asset_category"]
          coa_id?: string | null
          created_at?: string
          currency?: string
          current_value: number
          depreciation_rate?: number
          id?: string
          insurance_expiry?: string | null
          insurance_policy?: string | null
          license_plate?: string | null
          name: string
          notes_encrypted?: string | null
          parent_asset_id?: string | null
          updated_at?: string
          user_id: string
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
        }
        Update: {
          acquisition_date?: string
          acquisition_value?: number
          category?: Database["public"]["Enums"]["asset_category"]
          coa_id?: string | null
          created_at?: string
          currency?: string
          current_value?: number
          depreciation_rate?: number
          id?: string
          insurance_expiry?: string | null
          insurance_policy?: string | null
          license_plate?: string | null
          name?: string
          notes_encrypted?: string | null
          parent_asset_id?: string | null
          updated_at?: string
          user_id?: string
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_coa_id_fkey"
            columns: ["coa_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_connections: {
        Row: {
          consent_expires_at: string | null
          created_at: string
          error_message: string | null
          id: string
          institution_logo_url: string | null
          institution_name: string
          is_active: boolean
          last_sync_at: string | null
          provider: string
          provider_connection_id: string | null
          sync_status: Database["public"]["Enums"]["sync_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_expires_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          institution_logo_url?: string | null
          institution_name: string
          is_active?: boolean
          last_sync_at?: string | null
          provider?: string
          provider_connection_id?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_expires_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          institution_logo_url?: string | null
          institution_name?: string
          is_active?: boolean
          last_sync_at?: string | null
          provider?: string
          provider_connection_id?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          adjustment_index: Database["public"]["Enums"]["adjustment_index_type"] | null
          alert_threshold: number
          approval_status: Database["public"]["Enums"]["budget_approval_status"]
          category_id: string
          coa_id: string | null
          cost_center_id: string | null
          created_at: string
          decided_at: string | null
          decision_notes: string | null
          family_member_id: string | null
          id: string
          month: string
          planned_amount: number
          proposed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adjustment_index?: Database["public"]["Enums"]["adjustment_index_type"] | null
          alert_threshold?: number
          approval_status?: Database["public"]["Enums"]["budget_approval_status"]
          category_id: string
          coa_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          family_member_id?: string | null
          id?: string
          month: string
          planned_amount: number
          proposed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adjustment_index?: Database["public"]["Enums"]["adjustment_index_type"] | null
          alert_threshold?: number
          approval_status?: Database["public"]["Enums"]["budget_approval_status"]
          category_id?: string
          coa_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          family_member_id?: string | null
          id?: string
          month?: string
          planned_amount?: number
          proposed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_coa_id_fkey"
            columns: ["coa_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: { color: string | null; created_at: string; icon: string | null; id: string; is_system: boolean; name: string; parent_id: string | null; type: Database["public"]["Enums"]["category_type"]; updated_at: string; user_id: string }
        Insert: { color?: string | null; created_at?: string; icon?: string | null; id?: string; is_system?: boolean; name: string; parent_id?: string | null; type: Database["public"]["Enums"]["category_type"]; updated_at?: string; user_id: string }
        Update: { color?: string | null; created_at?: string; icon?: string | null; id?: string; is_system?: boolean; name?: string; parent_id?: string | null; type?: Database["public"]["Enums"]["category_type"]; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "categories_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }]
      }
      categorization_rules: {
        Row: { id: string; pattern: string; category_name: string; priority: number; is_active: boolean; created_at: string }
        Insert: { id?: string; pattern: string; category_name: string; priority?: number; is_active?: boolean; created_at?: string }
        Update: { id?: string; pattern?: string; category_name?: string; priority?: number; is_active?: boolean; created_at?: string }
        Relationships: []
      }
      center_allocations: {
        Row: { amount: number; cost_center_id: string; id: string; journal_line_id: string; percentage: number }
        Insert: { amount: number; cost_center_id: string; id?: string; journal_line_id: string; percentage: number }
        Update: { amount?: number; cost_center_id?: string; id?: string; journal_line_id?: string; percentage?: number }
        Relationships: [
          { foreignKeyName: "center_allocations_cost_center_id_fkey"; columns: ["cost_center_id"]; isOneToOne: false; referencedRelation: "cost_centers"; referencedColumns: ["id"] },
          { foreignKeyName: "center_allocations_journal_line_id_fkey"; columns: ["journal_line_id"]; isOneToOne: false; referencedRelation: "journal_lines"; referencedColumns: ["id"] },
        ]
      }
      chart_of_accounts: {
        Row: { account_name: string; color: string | null; created_at: string; depth: number; dirpf_group: string | null; display_name: string; group_type: Database["public"]["Enums"]["group_type"]; icon: string | null; id: string; internal_code: string; is_active: boolean; is_system: boolean; parent_id: string | null; sort_order: number; tax_treatment: Database["public"]["Enums"]["tax_treatment_type"] | null; updated_at: string; user_id: string }
        Insert: { account_name: string; color?: string | null; created_at?: string; depth?: number; dirpf_group?: string | null; display_name: string; group_type: Database["public"]["Enums"]["group_type"]; icon?: string | null; id?: string; internal_code: string; is_active?: boolean; is_system?: boolean; parent_id?: string | null; sort_order?: number; tax_treatment?: Database["public"]["Enums"]["tax_treatment_type"] | null; updated_at?: string; user_id: string }
        Update: { account_name?: string; color?: string | null; created_at?: string; depth?: number; dirpf_group?: string | null; display_name?: string; group_type?: Database["public"]["Enums"]["group_type"]; icon?: string | null; id?: string; internal_code?: string; is_active?: boolean; is_system?: boolean; parent_id?: string | null; sort_order?: number; tax_treatment?: Database["public"]["Enums"]["tax_treatment_type"] | null; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "chart_of_accounts_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "chart_of_accounts"; referencedColumns: ["id"] }]
      }
      cost_centers: {
        Row: { color: string | null; created_at: string; icon: string | null; id: string; is_active: boolean; is_default: boolean; is_overhead: boolean; name: string; parent_id: string | null; type: Database["public"]["Enums"]["center_type"]; updated_at: string; user_id: string }
        Insert: { color?: string | null; created_at?: string; icon?: string | null; id?: string; is_active?: boolean; is_default?: boolean; is_overhead?: boolean; name: string; parent_id?: string | null; type?: Database["public"]["Enums"]["center_type"]; updated_at?: string; user_id: string }
        Update: { color?: string | null; created_at?: string; icon?: string | null; id?: string; is_active?: boolean; is_default?: boolean; is_overhead?: boolean; name?: string; parent_id?: string | null; type?: Database["public"]["Enums"]["center_type"]; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "cost_centers_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "cost_centers"; referencedColumns: ["id"] }]
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
      family_members: {
        Row: { avatar_emoji: string | null; birth_date: string | null; cost_center_id: string | null; cpf_encrypted: string | null; created_at: string; id: string; is_active: boolean; is_tax_dependent: boolean; name: string; relationship: Database["public"]["Enums"]["family_relationship"]; role: Database["public"]["Enums"]["family_role"]; updated_at: string; user_id: string }
        Insert: { avatar_emoji?: string | null; birth_date?: string | null; cost_center_id?: string | null; cpf_encrypted?: string | null; created_at?: string; id?: string; is_active?: boolean; is_tax_dependent?: boolean; name: string; relationship?: Database["public"]["Enums"]["family_relationship"]; role?: Database["public"]["Enums"]["family_role"]; updated_at?: string; user_id: string }
        Update: { avatar_emoji?: string | null; birth_date?: string | null; cost_center_id?: string | null; cpf_encrypted?: string | null; created_at?: string; id?: string; is_active?: boolean; is_tax_dependent?: boolean; name?: string; relationship?: Database["public"]["Enums"]["family_relationship"]; role?: Database["public"]["Enums"]["family_role"]; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "family_members_cost_center_id_fkey"; columns: ["cost_center_id"]; isOneToOne: false; referencedRelation: "cost_centers"; referencedColumns: ["id"] }]
      }
      setup_journey: {
        Row: { id: string; user_id: string; step_key: string; step_order: number; title: string; description: string; status: string; completed_at: string | null; metadata: Json; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; step_key: string; step_order: number; title: string; description: string; status?: string; completed_at?: string | null; metadata?: Json; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; step_key?: string; step_order?: number; title?: string; description?: string; status?: string; completed_at?: string | null; metadata?: Json; created_at?: string; updated_at?: string }
        Relationships: []
      }
      description_aliases: {
        Row: { id: string; user_id: string; original_description: string; custom_description: string; category_id: string | null; usage_count: number; last_used_at: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; original_description: string; custom_description: string; category_id?: string | null; usage_count?: number; last_used_at?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; original_description?: string; custom_description?: string; category_id?: string | null; usage_count?: number; last_used_at?: string; created_at?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "description_aliases_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }]
      }
      journal_entries: {
        Row: { asset_id: string | null; created_at: string; description: string | null; document_url: string | null; entry_date: string; id: string; is_reversal: boolean; notes_encrypted: string | null; occurred_at: string | null; posted_at: string | null; reversed_entry_id: string | null; source: Database["public"]["Enums"]["entry_source"]; transaction_id: string | null; user_date: string | null; user_id: string; workflow_task_id: string | null }
        Insert: { asset_id?: string | null; created_at?: string; description?: string | null; document_url?: string | null; entry_date: string; id?: string; is_reversal?: boolean; notes_encrypted?: string | null; occurred_at?: string | null; posted_at?: string | null; reversed_entry_id?: string | null; source?: Database["public"]["Enums"]["entry_source"]; transaction_id?: string | null; user_date?: string | null; user_id: string; workflow_task_id?: string | null }
        Update: { asset_id?: string | null; created_at?: string; description?: string | null; document_url?: string | null; entry_date?: string; id?: string; is_reversal?: boolean; notes_encrypted?: string | null; occurred_at?: string | null; posted_at?: string | null; reversed_entry_id?: string | null; source?: Database["public"]["Enums"]["entry_source"]; transaction_id?: string | null; user_date?: string | null; user_id?: string; workflow_task_id?: string | null }
        Relationships: [
          { foreignKeyName: "je_workflow_task_fk"; columns: ["workflow_task_id"]; isOneToOne: false; referencedRelation: "workflow_tasks"; referencedColumns: ["id"] },
          { foreignKeyName: "journal_entries_reversed_entry_id_fkey"; columns: ["reversed_entry_id"]; isOneToOne: false; referencedRelation: "journal_entries"; referencedColumns: ["id"] },
          { foreignKeyName: "journal_entries_transaction_id_fkey"; columns: ["transaction_id"]; isOneToOne: false; referencedRelation: "transactions"; referencedColumns: ["id"] },
        ]
      }
      journal_lines: {
        Row: { account_id: string; amount_credit: number; amount_debit: number; id: string; journal_entry_id: string; memo: string | null }
        Insert: { account_id: string; amount_credit?: number; amount_debit?: number; id?: string; journal_entry_id: string; memo?: string | null }
        Update: { account_id?: string; amount_credit?: number; amount_debit?: number; id?: string; journal_entry_id?: string; memo?: string | null }
        Relationships: [
          { foreignKeyName: "journal_lines_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "chart_of_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "journal_lines_journal_entry_id_fkey"; columns: ["journal_entry_id"]; isOneToOne: false; referencedRelation: "journal_entries"; referencedColumns: ["id"] },
        ]
      }
      merchant_patterns: {
        Row: { id: string; user_id: string; pattern: string; category_id: string; usage_count: number; last_used_at: string; created_at: string }
        Insert: { id?: string; user_id: string; pattern: string; category_id: string; usage_count?: number; last_used_at?: string; created_at?: string }
        Update: { id?: string; user_id?: string; pattern?: string; category_id?: string; usage_count?: number; last_used_at?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "merchant_patterns_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
        ]
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
        Row: { created_at: string; device_name: string | null; device_token: string; id: string; is_active: boolean; platform: string; subscription_data: Json | null; updated_at: string; user_id: string }
        Insert: { created_at?: string; device_name?: string | null; device_token: string; id?: string; is_active?: boolean; platform?: string; subscription_data?: Json | null; updated_at?: string; user_id: string }
        Update: { created_at?: string; device_name?: string | null; device_token?: string; id?: string; is_active?: boolean; platform?: string; subscription_data?: Json | null; updated_at?: string; user_id?: string }
        Relationships: []
      }
      recurrences: {
        Row: { adjustment_index: Database["public"]["Enums"]["adjustment_index_type"] | null; adjustment_rate: number | null; coa_id: string | null; cost_center_id: string | null; created_at: string; end_date: string | null; frequency: Database["public"]["Enums"]["recurrence_frequency"]; id: string; interval_count: number; is_active: boolean; next_due_date: string; start_date: string; template_transaction: Json; updated_at: string; user_id: string }
        Insert: { adjustment_index?: Database["public"]["Enums"]["adjustment_index_type"] | null; adjustment_rate?: number | null; coa_id?: string | null; cost_center_id?: string | null; created_at?: string; end_date?: string | null; frequency: Database["public"]["Enums"]["recurrence_frequency"]; id?: string; interval_count?: number; is_active?: boolean; next_due_date: string; start_date: string; template_transaction: Json; updated_at?: string; user_id: string }
        Update: { adjustment_index?: Database["public"]["Enums"]["adjustment_index_type"] | null; adjustment_rate?: number | null; coa_id?: string | null; cost_center_id?: string | null; created_at?: string; end_date?: string | null; frequency?: Database["public"]["Enums"]["recurrence_frequency"]; id?: string; interval_count?: number; is_active?: boolean; next_due_date?: string; start_date?: string; template_transaction?: Json; updated_at?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "recurrences_coa_id_fkey"; columns: ["coa_id"]; isOneToOne: false; referencedRelation: "chart_of_accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "recurrences_cost_center_id_fkey"; columns: ["cost_center_id"]; isOneToOne: false; referencedRelation: "cost_centers"; referencedColumns: ["id"] },
        ]
      }
      tax_parameters: {
        Row: { brackets: Json; created_at: string; id: string; limits: Json | null; parameter_type: Database["public"]["Enums"]["parameter_type"]; source_references: Json; updated_at: string; updated_by: string | null; valid_from: string; valid_until: string | null }
        Insert: { brackets?: Json; created_at?: string; id?: string; limits?: Json | null; parameter_type: Database["public"]["Enums"]["parameter_type"]; source_references?: Json; updated_at?: string; updated_by?: string | null; valid_from: string; valid_until?: string | null }
        Update: { brackets?: Json; created_at?: string; id?: string; limits?: Json | null; parameter_type?: Database["public"]["Enums"]["parameter_type"]; source_references?: Json; updated_at?: string; updated_by?: string | null; valid_from?: string; valid_until?: string | null }
        Relationships: []
      }
      transactions: {
        Row: { account_id: string; amount: number; amount_adjustment: number; asset_id: string | null; bank_connection_id: string | null; category_id: string | null; category_source: Database["public"]["Enums"]["category_assignment_source"] | null; created_at: string; date: string; description: string | null; due_date: string | null; external_id: string | null; family_member_id: string | null; id: string; import_batch_id: string | null; is_deleted: boolean; is_paid: boolean; journal_entry_id: string | null; matched_transaction_id: string | null; notes: string | null; occurred_at: string | null; payment_status: Database["public"]["Enums"]["payment_status"]; posted_at: string | null; recurrence_id: string | null; source: Database["public"]["Enums"]["entry_source"]; tags: string[] | null; transfer_pair_id: string | null; type: Database["public"]["Enums"]["transaction_type"]; updated_at: string; user_id: string }
        Insert: { account_id: string; amount: number; amount_adjustment?: number; asset_id?: string | null; bank_connection_id?: string | null; category_id?: string | null; category_source?: Database["public"]["Enums"]["category_assignment_source"] | null; created_at?: string; date: string; description?: string | null; due_date?: string | null; external_id?: string | null; family_member_id?: string | null; id?: string; import_batch_id?: string | null; is_deleted?: boolean; is_paid?: boolean; journal_entry_id?: string | null; matched_transaction_id?: string | null; notes?: string | null; occurred_at?: string | null; payment_status?: Database["public"]["Enums"]["payment_status"]; posted_at?: string | null; recurrence_id?: string | null; source?: Database["public"]["Enums"]["entry_source"]; tags?: string[] | null; transfer_pair_id?: string | null; type: Database["public"]["Enums"]["transaction_type"]; updated_at?: string; user_id: string }
        Update: { account_id?: string; amount?: number; amount_adjustment?: number; asset_id?: string | null; bank_connection_id?: string | null; category_id?: string | null; category_source?: Database["public"]["Enums"]["category_assignment_source"] | null; created_at?: string; date?: string; description?: string | null; due_date?: string | null; external_id?: string | null; family_member_id?: string | null; id?: string; import_batch_id?: string | null; is_deleted?: boolean; is_paid?: boolean; journal_entry_id?: string | null; matched_transaction_id?: string | null; notes?: string | null; occurred_at?: string | null; payment_status?: Database["public"]["Enums"]["payment_status"]; posted_at?: string | null; recurrence_id?: string | null; source?: Database["public"]["Enums"]["entry_source"]; tags?: string[] | null; transfer_pair_id?: string | null; type?: Database["public"]["Enums"]["transaction_type"]; updated_at?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "fk_transactions_recurrence"; columns: ["recurrence_id"]; isOneToOne: false; referencedRelation: "recurrences"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_bank_connection_id_fkey"; columns: ["bank_connection_id"]; isOneToOne: false; referencedRelation: "bank_connections"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_family_member_id_fkey"; columns: ["family_member_id"]; isOneToOne: false; referencedRelation: "family_members"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_journal_entry_id_fkey"; columns: ["journal_entry_id"]; isOneToOne: false; referencedRelation: "journal_entries"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_matched_transaction_id_fkey"; columns: ["matched_transaction_id"]; isOneToOne: false; referencedRelation: "transactions"; referencedColumns: ["id"] },
        ]
      }
      user_insights: {
        Row: { id: string; user_id: string; month: string; insight_type: string; content: string; data_snapshot: Json | null; model: string; tokens_used: number; created_at: string }
        Insert: { id?: string; user_id: string; month: string; insight_type?: string; content: string; data_snapshot?: Json | null; model: string; tokens_used?: number; created_at?: string }
        Update: { id?: string; user_id?: string; month?: string; insight_type?: string; content?: string; data_snapshot?: Json | null; model?: string; tokens_used?: number; created_at?: string }
        Relationships: []
      }
      users_profile: {
        Row: { cpf_encrypted: string | null; created_at: string; cutoff_date: string | null; default_currency: string; deletion_requested_at: string | null; encryption_key_encrypted: string | null; encryption_key_iv: string | null; full_name: string | null; id: string; kek_material: string | null; onboarding_completed: boolean; updated_at: string }
        Insert: { cpf_encrypted?: string | null; created_at?: string; cutoff_date?: string | null; default_currency?: string; deletion_requested_at?: string | null; encryption_key_encrypted?: string | null; encryption_key_iv?: string | null; full_name?: string | null; id: string; kek_material?: string | null; onboarding_completed?: boolean; updated_at?: string }
        Update: { cpf_encrypted?: string | null; created_at?: string; cutoff_date?: string | null; default_currency?: string; deletion_requested_at?: string | null; encryption_key_encrypted?: string | null; encryption_key_iv?: string | null; full_name?: string | null; id?: string; kek_material?: string | null; onboarding_completed?: boolean; updated_at?: string }
        Relationships: []
      }
      workflow_tasks: {
        Row: { completed_at: string | null; created_at: string; description: string | null; document_id: string | null; id: string; period_end: string; period_start: string; result_data: Json | null; status: Database["public"]["Enums"]["task_status"]; task_type: Database["public"]["Enums"]["task_type"]; user_id: string; workflow_id: string }
        Insert: { completed_at?: string | null; created_at?: string; description?: string | null; document_id?: string | null; id?: string; period_end: string; period_start: string; result_data?: Json | null; status?: Database["public"]["Enums"]["task_status"]; task_type: Database["public"]["Enums"]["task_type"]; user_id: string; workflow_id: string }
        Update: { completed_at?: string | null; created_at?: string; description?: string | null; document_id?: string | null; id?: string; period_end?: string; period_start?: string; result_data?: Json | null; status?: Database["public"]["Enums"]["task_status"]; task_type?: Database["public"]["Enums"]["task_type"]; user_id?: string; workflow_id?: string }
        Relationships: [
          { foreignKeyName: "workflow_tasks_document_id_fkey"; columns: ["document_id"]; isOneToOne: false; referencedRelation: "documents"; referencedColumns: ["id"] },
          { foreignKeyName: "workflow_tasks_workflow_id_fkey"; columns: ["workflow_id"]; isOneToOne: false; referencedRelation: "workflows"; referencedColumns: ["id"] },
        ]
      }
      workflows: {
        Row: { created_at: string; day_of_period: number | null; id: string; is_active: boolean; last_completed_at: string | null; name: string; periodicity: Database["public"]["Enums"]["workflow_periodicity"]; related_account_id: string | null; related_coa_id: string | null; updated_at: string; user_id: string; workflow_type: Database["public"]["Enums"]["workflow_type"] }
        Insert: { created_at?: string; day_of_period?: number | null; id?: string; is_active?: boolean; last_completed_at?: string | null; name: string; periodicity?: Database["public"]["Enums"]["workflow_periodicity"]; related_account_id?: string | null; related_coa_id?: string | null; updated_at?: string; user_id: string; workflow_type: Database["public"]["Enums"]["workflow_type"] }
        Update: { created_at?: string; day_of_period?: number | null; id?: string; is_active?: boolean; last_completed_at?: string | null; name?: string; periodicity?: Database["public"]["Enums"]["workflow_periodicity"]; related_account_id?: string | null; related_coa_id?: string | null; updated_at?: string; user_id?: string; workflow_type?: Database["public"]["Enums"]["workflow_type"] }
        Relationships: [
          { foreignKeyName: "workflows_related_account_id_fkey"; columns: ["related_account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "workflows_related_coa_id_fkey"; columns: ["related_coa_id"]; isOneToOne: false; referencedRelation: "chart_of_accounts"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_to_centers: { Args: { p_allocations: Json; p_transaction_id: string; p_user_id: string }; Returns: Json }
      auto_categorize_transaction: { Args: { p_description: string; p_user_id: string }; Returns: string }
      check_ai_rate_limit: { Args: { p_user_id: string; p_limit?: number }; Returns: Json }
      cron_cleanup_ai_cache: { Args: Record<string, never>; Returns: undefined }
      auto_create_workflow_for_account: { Args: { p_account_id: string; p_account_name: string; p_account_type: string; p_user_id: string }; Returns: Json }
      complete_workflow_task: { Args: { p_result_data?: Json; p_status?: string; p_task_id: string; p_user_id: string }; Returns: Json }
      create_coa_child: { Args: { p_account_name?: string; p_display_name?: string; p_parent_code?: string; p_parent_id?: string; p_tax_treatment?: Database["public"]["Enums"]["tax_treatment_type"]; p_user_id: string }; Returns: string }
      create_default_categories: { Args: { p_user_id: string }; Returns: undefined }
      create_default_chart_of_accounts: { Args: { p_user_id: string }; Returns: undefined }
      create_default_cost_center: { Args: { p_user_id: string }; Returns: string }
      create_family_member: { Args: { p_avatar_emoji?: string; p_birth_date?: string; p_is_tax_dependent?: boolean; p_name: string; p_relationship?: Database["public"]["Enums"]["family_relationship"]; p_role?: Database["public"]["Enums"]["family_role"]; p_user_id: string }; Returns: string }
      create_transaction_with_journal: { Args: { p_account_id: string; p_amount?: number; p_category_id?: string; p_category_source?: Database["public"]["Enums"]["category_assignment_source"]; p_counterpart_coa_id?: string; p_date?: string; p_description?: string; p_family_member_id?: string; p_is_paid?: boolean; p_notes?: string; p_source?: Database["public"]["Enums"]["entry_source"]; p_tags?: string[]; p_type?: Database["public"]["Enums"]["transaction_type"]; p_user_id: string }; Returns: Json }
      create_transfer_with_journal: { Args: { p_amount: number; p_date?: string; p_description?: string; p_from_account_id: string; p_is_paid?: boolean; p_source?: Database["public"]["Enums"]["entry_source"]; p_to_account_id: string; p_user_id: string }; Returns: Json }
      cron_balance_integrity_check: { Args: Record<string, never>; Returns: undefined }
      cron_cleanup_access_logs: { Args: Record<string, never>; Returns: undefined }
      cron_cleanup_analytics_events: { Args: Record<string, never>; Returns: undefined }
      cron_cleanup_notification_log: { Args: Record<string, never>; Returns: undefined }
      cron_depreciate_assets: { Args: Record<string, never>; Returns: undefined }
      cron_fetch_economic_indices: { Args: Record<string, never>; Returns: Json }
      cron_generate_workflow_tasks: { Args: Record<string, never>; Returns: undefined }
      cron_generate_monthly_snapshots: { Args: Record<string, never>; Returns: undefined }
      cron_generate_recurring_transactions: { Args: Record<string, never>; Returns: undefined }
      cron_mark_overdue_transactions: { Args: Record<string, never>; Returns: undefined }
      cron_process_account_deletions: { Args: Record<string, never>; Returns: undefined }
      depreciate_asset: { Args: { p_asset_id: string; p_user_id: string }; Returns: Json }
      distribute_overhead: { Args: { p_user_id: string; p_month: string }; Returns: Json }
      edit_transaction: { Args: { p_user_id: string; p_transaction_id: string; p_account_id: string; p_category_id?: string; p_type?: Database["public"]["Enums"]["transaction_type"]; p_amount?: number; p_description?: string; p_date?: string; p_is_paid?: boolean; p_notes?: string; p_tags?: string[]; p_family_member_id?: string; p_category_source?: Database["public"]["Enums"]["category_assignment_source"] }; Returns: Json }
      edit_transfer: { Args: { p_user_id: string; p_transaction_id: string; p_from_account_id: string; p_to_account_id: string; p_amount: number; p_description?: string; p_date?: string; p_is_paid?: boolean }; Returns: Json }
      find_reconciliation_candidates: { Args: { p_account_id: string; p_amount: number; p_date: string; p_tolerance_days?: number; p_tolerance_pct?: number; p_user_id: string }; Returns: Json }
      generate_next_recurrence: { Args: { p_recurrence_id: string; p_user_id: string }; Returns: Json }
      generate_tasks_for_period: { Args: { p_month?: number; p_user_id: string; p_year?: number }; Returns: Json }
      get_ai_cache: { Args: { p_prompt_hash: string; p_model: string; p_use_case: string }; Returns: Json }
      get_assets_summary: { Args: { p_user_id: string }; Returns: Json }
      get_balance_evolution: { Args: { p_months?: number; p_user_id: string }; Returns: Json }
      get_balance_sheet: { Args: { p_user_id: string }; Returns: Json }
      get_budget_vs_actual: { Args: { p_family_member_id?: string; p_month?: number; p_user_id: string; p_year?: number }; Returns: Json }
      get_center_export: { Args: { p_center_id: string; p_user_id: string }; Returns: Json }
      get_center_pnl: { Args: { p_center_id: string; p_date_from?: string; p_date_to?: string; p_user_id: string }; Returns: Json }
      get_dashboard_summary: { Args: { p_user_id: string }; Returns: Json }
      get_dashboard_all: { Args: { p_user_id: string }; Returns: Json }
      get_economic_indices: { Args: { p_date_from?: string; p_date_to?: string; p_index_type?: string; p_limit?: number }; Returns: Json }
      get_currency_rates: { Args: Record<string, never>; Returns: Json }
      get_supported_currencies: { Args: Record<string, never>; Returns: Json }
      get_rate_to_brl: { Args: { p_currency: string }; Returns: number }
      get_fiscal_projection: { Args: { p_user_id: string; p_year?: number }; Returns: Json }
      get_fiscal_report: { Args: { p_user_id: string; p_year?: number }; Returns: Json }
      get_index_latest: { Args: Record<string, never>; Returns: Json }
      get_setup_journey: { Args: { p_user_id: string }; Returns: Json }
      get_solvency_metrics: { Args: { p_user_id: string }; Returns: Json }
      get_top_categories: { Args: { p_limit?: number; p_month?: number; p_user_id: string; p_year?: number }; Returns: Json }
      advance_setup_journey: { Args: { p_user_id: string; p_step_key: string; p_metadata?: Json }; Returns: Json }
      initialize_setup_journey: { Args: { p_user_id: string }; Returns: undefined }
      lookup_description_alias: { Args: { p_user_id: string; p_original: string }; Returns: Json }
      upsert_description_alias: { Args: { p_user_id: string; p_original: string; p_custom: string; p_category_id?: string }; Returns: Json }
      import_transactions_batch: { Args: { p_account_id: string; p_bank_connection_id?: string; p_batch_id: string; p_transactions: Json; p_user_id: string }; Returns: Json }
      learn_merchant_pattern: { Args: { p_user_id: string; p_description: string; p_category_id: string }; Returns: undefined }
      match_transactions: { Args: { p_imported_id: string; p_pending_id: string; p_user_id: string }; Returns: Json }
      recalculate_account_balance_for: { Args: { p_account_id: string }; Returns: undefined }
      reverse_transaction: { Args: { p_transaction_id: string; p_user_id: string }; Returns: Json }
      save_ai_result: { Args: { p_user_id: string; p_prompt_hash: string; p_model: string; p_use_case: string; p_prompt_sanitized: string; p_response: Json; p_tokens_in?: number; p_tokens_out?: number; p_cost_usd?: number; p_cached?: boolean }; Returns: undefined }
      track_event: { Args: { p_event_name: string; p_properties?: Json }; Returns: string }
      undo_import_batch: { Args: { p_user_id: string; p_batch_id: string }; Returns: Json }
      get_weekly_digest: { Args: { p_user_id: string }; Returns: Json }
      get_retention_metrics: { Args: Record<string, never>; Returns: Json }
    }
    Enums: {
      account_type: "checking" | "savings" | "credit_card" | "cash" | "investment" | "loan" | "financing"
      adjustment_index_type: "ipca" | "igpm" | "inpc" | "selic" | "manual" | "none"
      budget_approval_status: "approved" | "proposed" | "rejected"
      asset_category: "real_estate" | "vehicle" | "vehicle_auto" | "vehicle_moto" | "vehicle_recreational" | "vehicle_aircraft" | "electronics" | "jewelry" | "fashion" | "furniture" | "sports" | "collectibles" | "other" | "restricted"
      category_type: "income" | "expense"
      center_type: "cost_center" | "profit_center" | "neutral"
      entry_source: "bank_feed" | "card_feed" | "manual" | "csv_import" | "ofx_import" | "ocr" | "system"
      category_assignment_source: "manual" | "auto" | "import_auto"
      family_relationship: "self" | "spouse" | "child" | "parent" | "sibling" | "pet" | "other"
      family_role: "owner" | "member"
      group_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      index_type: "ipca" | "inpc" | "igpm" | "selic" | "cdi" | "tr" | "usd_brl" | "minimum_wage" | "ipca_food" | "ipca_housing" | "ipca_transport" | "ipca_health" | "ipca_education"
      notification_status: "sent" | "failed" | "skipped"
      notification_type: "bill_due" | "budget_alert" | "insurance_expiry" | "account_deletion" | "inactivity"
      parameter_type: "irpf_monthly" | "irpf_annual" | "irpf_reduction" | "irpf_min_high_income" | "inss_employee" | "inss_ceiling" | "minimum_wage" | "capital_gains" | "crypto_exemption" | "stock_exemption"
      payment_status: "pending" | "overdue" | "paid" | "cancelled"
      periodicity_type: "daily" | "monthly" | "annual"
      recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly"
      sync_status: "active" | "syncing" | "error" | "expired" | "manual"
      task_status: "pending" | "in_progress" | "completed" | "skipped"
      task_type: "upload_document" | "update_balance" | "categorize_transactions" | "review_fiscal"
      tax_treatment_type: "tributavel" | "isento" | "exclusivo_fonte" | "ganho_capital" | "dedutivel_integral" | "dedutivel_limitado" | "nao_dedutivel" | "variavel"
      transaction_type: "income" | "expense" | "transfer"
      value_change_source: "manual" | "depreciation"
      workflow_periodicity: "weekly" | "biweekly" | "monthly"
      workflow_type: "bank_statement" | "card_statement" | "loan_payment" | "investment_update" | "fiscal_review"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
