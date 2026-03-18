"use strict";

/**
 * Tests for RPC schemas added during debt remediation (DT-012, DT-008, DT-010, DT-016).
 *
 * Validates that:
 * 1. Zod schemas parse valid responses correctly
 * 2. Schemas reject invalid/missing fields
 * 3. TypeScript types align with schema shapes
 */

import {
  editTransactionResultSchema,
  budgetVsActualResultSchema,
  budgetWithCategorySchema,
} from "@/lib/schemas/rpc";

// ─── editTransactionResultSchema ──────────────────────────────────

describe("editTransactionResultSchema", () => {
  const validResult = {
    original_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    new_transaction_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    new_journal_entry_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    reversal_journal_id: "d4e5f6a7-b8c9-0123-defa-234567890123",
  };

  test("parses valid edit_transaction result", () => {
    const result = editTransactionResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.original_id).toBe(validResult.original_id);
      expect(result.data.new_transaction_id).toBe(validResult.new_transaction_id);
    }
  });

  test("accepts null journal IDs (no COA match)", () => {
    const result = editTransactionResultSchema.safeParse({
      ...validResult,
      new_journal_entry_id: null,
      reversal_journal_id: null,
    });
    expect(result.success).toBe(true);
  });

  test("rejects missing original_id", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { original_id, ...rest } = validResult;
    const result = editTransactionResultSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  test("rejects non-UUID transaction_id", () => {
    const result = editTransactionResultSchema.safeParse({
      ...validResult,
      new_transaction_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

// ─── budgetWithCategorySchema ─────────────────────────────────────

describe("budgetWithCategorySchema", () => {
  const validBudget = {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    user_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    category_id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    month: "2026-03-01",
    planned_amount: 1500,
    alert_threshold: 80,
    adjustment_index: "none" as const,
    approval_status: "approved" as const,
    proposed_at: null,
    decided_at: null,
    decision_notes: null,
    coa_id: null,
    cost_center_id: null,
    family_member_id: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    categories: {
      name: "Alimentação",
      icon: "utensils",
      color: "#A97824",
      type: "expense",
    },
  };

  test("parses valid budget with approval fields", () => {
    const result = budgetWithCategorySchema.safeParse(validBudget);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.approval_status).toBe("approved");
    }
  });

  test("accepts proposed status with proposed_at timestamp", () => {
    const result = budgetWithCategorySchema.safeParse({
      ...validBudget,
      approval_status: "proposed",
      proposed_at: "2026-03-15T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  test("accepts rejected status with decided_at + notes", () => {
    const result = budgetWithCategorySchema.safeParse({
      ...validBudget,
      approval_status: "rejected",
      decided_at: "2026-03-15T12:00:00Z",
      decision_notes: "Valor excessivo para este mês",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid approval_status", () => {
    const result = budgetWithCategorySchema.safeParse({
      ...validBudget,
      approval_status: "pending", // not a valid enum value
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing categories relation", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { categories, ...rest } = validBudget;
    const result = budgetWithCategorySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ─── budgetVsActualResultSchema ───────────────────────────────────

describe("budgetVsActualResultSchema", () => {
  const validResult = {
    items: [
      {
        category_name: "Alimentação",
        category_icon: "utensils",
        category_color: "#A97824",
        budget_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        planned: 1500,
        alert_threshold: 80,
        actual: 1200,
        remaining: 300,
        pct_used: 80,
        status: "warning" as const,
        family_member_id: null,
      },
    ],
    total_planned: 1500,
    total_actual: 1200,
    total_remaining: 300,
    pct_used: 80,
    month: "2026-03-01",
    budget_count: 1,
  };

  test("parses valid budget vs actual result", () => {
    const result = budgetVsActualResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
  });

  test("accepts empty items array", () => {
    const result = budgetVsActualResultSchema.safeParse({
      ...validResult,
      items: [],
      total_planned: 0,
      total_actual: 0,
      total_remaining: 0,
      pct_used: 0,
      budget_count: 0,
    });
    expect(result.success).toBe(true);
  });

  test("accepts exceeded status", () => {
    const result = budgetVsActualResultSchema.safeParse({
      ...validResult,
      items: [{ ...validResult.items[0], status: "exceeded", pct_used: 120 }],
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid status enum", () => {
    const result = budgetVsActualResultSchema.safeParse({
      ...validResult,
      items: [{ ...validResult.items[0], status: "critical" }],
    });
    expect(result.success).toBe(false);
  });
});
