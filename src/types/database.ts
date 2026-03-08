/**
 * WealthOS Database Types
 * Auto-generated from Supabase schema (2026-03-08).
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
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: { color: string | null; created_at: string; current_balance: number; id: string; initial_balance: number; is_active: boolean; name: string; projected_balance: number; type: Database["public"]["Enums"]["account_type"]; updated_at: string; user_id: string }
        Insert: { color?: string | null; created_at?: string; current_balance?: number; id?: string; initial_balance?: number; is_active?: boolean; name: string; projected_balance?: number; type: Database["public"]["Enums"]["account_type"]; updated_at?: string; user_id: string }
        Update: { color?: string | null; created_at?: string; current_balance?: number; id?: string; initial_balance?: number; is_active?: boolean; name?: string; projected_balance?: number; type?: Database["public"]["Enums"]["account_type"]; updated_at?: string; user_id?: string }
        Relationships: []
      }
      asset_value_history: {
        Row: { asset_id: string; change_reason: string | null; change_source: Database["public"]["Enums"]["value_change_source"]; created_at: string; id: string; new_value: number; previous_value: number; user_id: string }
        Insert: { asset_id: string; change_reason?: string | null; change_source: Database["public"]["Enums"]["value_change_source"]; created_at?: string; id?: string; new_value: number; previous_value: number; user_id: string }
        Update: { asset_id?: string; change_reason?: string | null; change_source?: Database["public"]["Enums"]["value_change_source"]; created_at?: string; id?: string; new_value?: number; previous_value?: number; user_id?: string }
        Relationships: [{ foreignKeyName: "asset_value_history_asset_id_fkey"; columns: ["asset_id"]; isOneToOne: false; referencedRelation: "assets"; referencedColumns: ["id"] }]
      }
      assets: {
        Row: { acquisition_date: string; acquisition_value: number; category: Database["public"]["Enums"]["asset_category"]; created_at: string; current_value: number; depreciation_rate: number; id: string; insurance_expiry: string | null; insurance_policy: string | null; name: string; notes_encrypted: string | null; updated_at: string; user_id: string }
        Insert: { acquisition_date: string; acquisition_value: number; category: Database["public"]["Enums"]["asset_category"]; created_at?: string; current_value: number; depreciation_rate?: number; id?: string; insurance_expiry?: string | null; insurance_policy?: string | null; name: string; notes_encrypted?: string | null; updated_at?: string; user_id: string }
        Update: { acquisition_date?: string; acquisition_value?: number; category?: Database["public"]["Enums"]["asset_category"]; created_at?: string; current_value?: number; depreciation_rate?: number; id?: string; insurance_expiry?: string | null; insurance_policy?: string | null; name?: string; notes_encrypted?: string | null; updated_at?: string; user_id?: string }
        Relationships: []
      }
      budgets: {
        Row: { alert_threshold: number; category_id: string; created_at: string; id: string; month: string; planned_amount: number; updated_at: string; user_id: string }
        Insert: { alert_threshold?: number; category_id: string; created_at?: string; id?: string; month: string; planned_amount: number; updated_at?: string; user_id: string }
        Update: { alert_threshold?: number; category_id?: string; created_at?: string; id?: string; month?: string; planned_amount?: number; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "budgets_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }]
      }
      categories: {
        Row: { color: string | null; created_at: string; icon: string | null; id: string; is_system: boolean; name: string; parent_id: string | null; type: Database["public"]["Enums"]["category_type"]; updated_at: string; user_id: string }
        Insert: { color?: string | null; created_at?: string; icon?: string | null; id?: string; is_system?: boolean; name: string; parent_id?: string | null; type: Database["public"]["Enums"]["category_type"]; updated_at?: string; user_id: string }
        Update: { color?: string | null; created_at?: string; icon?: string | null; id?: string; is_system?: boolean; name?: string; parent_id?: string | null; type?: Database["public"]["Enums"]["category_type"]; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "categories_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }]
      }
      documents: {
        Row: { created_at: string; file_name: string; file_path: string; id: string; mime_type: string; related_id: string; related_table: string; size_bytes: number; updated_at: string; user_id: string }
        Insert: { created_at?: string; file_name: string; file_path: string; id?: string; mime_type: string; related_id: string; related_table: string; size_bytes: number; updated_at?: string; user_id: string }
        Update: { created_at?: string; file_name?: string; file_path?: string; id?: string; mime_type?: string; related_id?: string; related_table?: string; size_bytes?: number; updated_at?: string; user_id?: string }
        Relationships: []
      }
      monthly_snapshots: {
        Row: { created_at: string; id: string; month: string; total_assets: number; total_balance: number; total_expense: number; total_income: number; total_projected: number; user_id: string }
        Insert: { created_at?: string; id?: string; month: string; total_assets?: number; total_balance?: number; total_expense?: number; total_income?: number; total_projected?: number; user_id: string }
        Update: { created_at?: string; id?: string; month?: string; total_assets?: number; total_balance?: number; total_expense?: number; total_income?: number; total_projected?: number; user_id?: string }
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
        Row: { created_at: string; end_date: string | null; frequency: Database["public"]["Enums"]["recurrence_frequency"]; id: string; interval_count: number; is_active: boolean; next_due_date: string; start_date: string; template_transaction: Json; updated_at: string; user_id: string }
        Insert: { created_at?: string; end_date?: string | null; frequency: Database["public"]["Enums"]["recurrence_frequency"]; id?: string; interval_count?: number; is_active?: boolean; next_due_date: string; start_date: string; template_transaction: Json; updated_at?: string; user_id: string }
        Update: { created_at?: string; end_date?: string | null; frequency?: Database["public"]["Enums"]["recurrence_frequency"]; id?: string; interval_count?: number; is_active?: boolean; next_due_date?: string; start_date?: string; template_transaction?: Json; updated_at?: string; user_id?: string }
        Relationships: []
      }
      tax_records: {
        Row: { amount: number; created_at: string; details_encrypted: string | null; document_url: string | null; id: string; irrf_withheld: number; source: string | null; type: Database["public"]["Enums"]["tax_record_type"]; updated_at: string; user_id: string; year: number }
        Insert: { amount: number; created_at?: string; details_encrypted?: string | null; document_url?: string | null; id?: string; irrf_withheld?: number; source?: string | null; type: Database["public"]["Enums"]["tax_record_type"]; updated_at?: string; user_id: string; year: number }
        Update: { amount?: number; created_at?: string; details_encrypted?: string | null; document_url?: string | null; id?: string; irrf_withheld?: number; source?: string | null; type?: Database["public"]["Enums"]["tax_record_type"]; updated_at?: string; user_id?: string; year?: number }
        Relationships: []
      }
      transactions: {
        Row: { account_id: string; amount: number; category_id: string | null; created_at: string; date: string; description: string | null; id: string; is_deleted: boolean; is_paid: boolean; notes: string | null; recurrence_id: string | null; tags: string[] | null; transfer_pair_id: string | null; type: Database["public"]["Enums"]["transaction_type"]; updated_at: string; user_id: string }
        Insert: { account_id: string; amount: number; category_id?: string | null; created_at?: string; date: string; description?: string | null; id?: string; is_deleted?: boolean; is_paid?: boolean; notes?: string | null; recurrence_id?: string | null; tags?: string[] | null; transfer_pair_id?: string | null; type: Database["public"]["Enums"]["transaction_type"]; updated_at?: string; user_id: string }
        Update: { account_id?: string; amount?: number; category_id?: string | null; created_at?: string; date?: string; description?: string | null; id?: string; is_deleted?: boolean; is_paid?: boolean; notes?: string | null; recurrence_id?: string | null; tags?: string[] | null; transfer_pair_id?: string | null; type?: Database["public"]["Enums"]["transaction_type"]; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "fk_transactions_recurrence"; columns: ["recurrence_id"]; isOneToOne: false; referencedRelation: "recurrences"; referencedColumns: ["id"] }, { foreignKeyName: "transactions_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "accounts"; referencedColumns: ["id"] }, { foreignKeyName: "transactions_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }]
      }
      users_profile: {
        Row: { cpf_encrypted: string | null; created_at: string; default_currency: string; deletion_requested_at: string | null; encryption_key_encrypted: string | null; encryption_key_iv: string | null; full_name: string | null; id: string; onboarding_completed: boolean; updated_at: string }
        Insert: { cpf_encrypted?: string | null; created_at?: string; default_currency?: string; deletion_requested_at?: string | null; encryption_key_encrypted?: string | null; encryption_key_iv?: string | null; full_name?: string | null; id: string; onboarding_completed?: boolean; updated_at?: string }
        Update: { cpf_encrypted?: string | null; created_at?: string; default_currency?: string; deletion_requested_at?: string | null; encryption_key_encrypted?: string | null; encryption_key_iv?: string | null; full_name?: string | null; id?: string; onboarding_completed?: boolean; updated_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_default_categories: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      account_type: "checking" | "savings" | "credit_card" | "cash" | "investment"
      asset_category: "real_estate" | "vehicle" | "electronics" | "other"
      category_type: "income" | "expense"
      notification_status: "sent" | "failed" | "skipped"
      notification_type: "bill_due" | "budget_alert" | "insurance_expiry" | "account_deletion"
      recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly"
      tax_record_type: "income" | "deduction" | "asset" | "debt"
      transaction_type: "income" | "expense" | "transfer"
      value_change_source: "manual" | "depreciation"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
