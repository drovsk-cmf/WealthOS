"use client";

import { useState, useEffect } from "react";
import {
  useCostCenters,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
  CENTER_TYPE_LABELS,
  CENTER_TYPE_OPTIONS,
} from "@/lib/hooks/use-cost-centers";
import type { Database } from "@/types/database";

type CostCenter = Database["public"]["Tables"]["cost_centers"]["Row"];
type CenterType = Database["public"]["Enums"]["center_type"];

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

export default function CostCentersPage() {
  const { data: centers, isLoading } = useCostCenters();
  const createCenter = useCreateCostCenter();
  const updateCenter = useUpdateCostCenter();
  const deleteCenter = useDeleteCostCenter();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<CenterType>("cost_center");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editing;
  const loading = createCenter.isPending || updateCenter.isPending;

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setColor(editing.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setType("cost_center");
      setColor(PRESET_COLORS[0]);
    }
    setError(null);
  }, [editing, formOpen]);

  function handleNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(center: CostCenter) {
    setEditing(center);
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    try {
      if (isEdit && editing) {
        await updateCenter.mutateAsync({
          id: editing.id,
          name: name.trim(),
          type,
          color,
        });
      } else {
        await createCenter.mutateAsync({
          name: name.trim(),
          type,
          color,
        });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  async function handleDelete(id: string) {
    await deleteCenter.mutateAsync(id);
    setConfirmDelete(null);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize suas transações por projeto, pessoa ou atividade.
          </p>
        </div>
        <button
          onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Novo centro
        </button>
      </div>

      {/* List */}
      {centers && centers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum centro de custo.</p>
          <button onClick={handleNew} className="mt-3 text-sm font-medium text-primary hover:underline">
            Criar primeiro
          </button>
        </div>
      )}

      {centers && centers.length > 0 && (
        <div className="space-y-2">
          {centers.map((center) => (
            <div
              key={center.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
            >
              <div
                className="h-9 w-9 flex-shrink-0 rounded-lg"
                style={{ backgroundColor: center.color || "#6366F1" }}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{center.name}</p>
                  {center.is_default && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Padrão
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {CENTER_TYPE_LABELS[center.type]}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(center)}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Editar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                {!center.is_default && (
                  <>
                    {confirmDelete === center.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(center.id)}
                          disabled={deleteCenter.isPending}
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
                        onClick={() => setConfirmDelete(center.id)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Desativar"
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
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setFormOpen(false); setEditing(null); }} />
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">{isEdit ? "Editar centro" : "Novo centro"}</h2>

            {error && (
              <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cc-name" className="text-sm font-medium">Nome</label>
                <input
                  id="cc-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Casa, Trabalho, Reforma"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo</label>
                <div className="space-y-2">
                  {CENTER_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                        type === opt.value ? "border-primary bg-primary/5" : "border-input hover:bg-accent"
                      }`}
                    >
                      <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                        type === opt.value ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {type === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        color === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setFormOpen(false); setEditing(null); }}
                  className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                  {loading ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
