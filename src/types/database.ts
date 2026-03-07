/**
 * WealthOS Database Types
 *
 * PLACEHOLDER: Replace this file by running:
 *   npm run db:types
 *
 * This generates types directly from the Supabase schema.
 * Command: supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string;
          full_name: string | null;
          cpf_encrypted: string | null;
          default_currency: string;
          onboarding_completed: boolean;
          deletion_requested_at: string | null;
          encryption_key_encrypted: string | null;
          encryption_key_iv: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          cpf_encrypted?: string | null;
          default_currency?: string;
          onboarding_completed?: boolean;
          deletion_requested_at?: string | null;
          encryption_key_encrypted?: string | null;
          encryption_key_iv?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          cpf_encrypted?: string | null;
          default_currency?: string;
          onboarding_completed?: boolean;
          deletion_requested_at?: string | null;
          encryption_key_encrypted?: string | null;
          encryption_key_iv?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "checking" | "savings" | "credit_card" | "cash" | "investment";
          initial_balance: number;
          current_balance: number;
          projected_balance: number;
          color: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "checking" | "savings" | "credit_card" | "cash" | "investment";
          initial_balance?: number;
          current_balance?: number;
          projected_balance?: number;
          color?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: "checking" | "savings" | "credit_card" | "cash" | "investment";
          initial_balance?: number;
          current_balance?: number;
          projected_balance?: number;
          color?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "income" | "expense";
          icon: string | null;
          color: string | null;
          parent_id: string | null;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "income" | "expense";
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: "income" | "expense";
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          type: "income" | "expense" | "transfer";
          amount: number;
          description: string | null;
          date: string;
          is_paid: boolean;
          recurrence_id: string | null;
          transfer_pair_id: string | null;
          notes: string | null;
          tags: string[] | null;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          type: "income" | "expense" | "transfer";
          amount: number;
          description?: string | null;
          date: string;
          is_paid?: boolean;
          recurrence_id?: string | null;
          transfer_pair_id?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          type?: "income" | "expense" | "transfer";
          amount?: number;
          description?: string | null;
          date?: string;
          is_paid?: boolean;
          recurrence_id?: string | null;
          transfer_pair_id?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Remaining tables use Json placeholder - regenerate with npm run db:types
      recurrences: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      budgets: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      assets: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      tax_records: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      documents: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      asset_value_history: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      monthly_snapshots: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      notification_tokens: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      notification_log: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
    };
    Views: Record<string, never>;
    Functions: {
      create_default_categories: {
        Args: { p_user_id: string };
        Returns: void;
      };
    };
    Enums: {
      account_type: "checking" | "savings" | "credit_card" | "cash" | "investment";
      transaction_type: "income" | "expense" | "transfer";
      category_type: "income" | "expense";
      recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly";
      asset_category: "real_estate" | "vehicle" | "electronics" | "other";
      tax_record_type: "income" | "deduction" | "asset" | "debt";
      notification_type: "bill_due" | "budget_alert" | "insurance_expiry" | "account_deletion";
      notification_status: "sent" | "failed" | "skipped";
      value_change_source: "manual" | "depreciation";
    };
  };
}
