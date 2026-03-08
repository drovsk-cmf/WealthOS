"use client";

import { useState } from "react";
import {
  useCategories,
  useDeleteCategory,
  CATEGORY_TYPE_LABELS,
} from "@/lib/hooks/use-categories";
import { CategoryForm } from "@/components/categories/category-form";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type CategoryType = Database["public"]["Enums"]["category_type"];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = categories?.filter((c) => c.type === activeTab) ?? [];
  const expenseCount = categories?.filter((c) => c.type === "expense").length ?? 0;
  const incomeCount = categories?.filter((c) => c.type === "income").length ?? 0;

  function handleNew() {
    setEditingCategory(null);
    setFormOpen(true);
  }

  function handleEdit(cat: Category) {
    setEditingCategory(cat);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await deleteCategory.mutateAsync(id);
    setConfirmDelete(null);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
        <button
          onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nova categoria
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {(["expense", "income"] as CategoryType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {CATEGORY_TYPE_LABELS[t]} ({t === "expense" ? expenseCount : incomeCount})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria de {activeTab === "expense" ? "despesa" : "receita"}.
          </p>
          <button
            onClick={handleNew}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Criar primeira
          </button>
        </div>
      )}

      {/* Category list */}
      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
            >
              {/* Color dot */}
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                style={{ backgroundColor: cat.color || "#6B7280" }}
              >
                {(cat.icon || "?").slice(0, 2).toUpperCase()}
              </div>

              {/* Name + badges */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{cat.name}</p>
                  {cat.is_system && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Sistema
                    </span>
                  )}
                </div>
                {cat.icon && (
                  <p className="text-xs text-muted-foreground">{cat.icon}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(cat)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Editar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                {!cat.is_system && (
                  <>
                    {confirmDelete === cat.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deleteCategory.isPending}
                          className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(cat.id)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Excluir"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <CategoryForm
        category={editingCategory}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCategory(null);
        }}
        defaultType={activeTab}
      />
    </div>
  );
}
