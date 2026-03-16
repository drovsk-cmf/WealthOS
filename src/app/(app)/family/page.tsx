"use client";

import { toast } from "sonner";

import { useState, useEffect } from "react";
import { Users, Archive } from "lucide-react";
import {
  useFamilyMembers,
  useCreateFamilyMember,
  useUpdateFamilyMember,
  useDeactivateFamilyMember,
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_LABELS,
  ROLE_LABELS,
} from "@/lib/hooks/use-family-members";
import { useAutoReset, useEscapeClose } from "@/lib/hooks/use-dialog-helpers";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
type FamilyRelationship = Database["public"]["Enums"]["family_relationship"];

export default function FamilyPage() {
  const { data: members, isLoading } = useFamilyMembers();
  const createMember = useCreateFamilyMember();
  const updateMember = useUpdateFamilyMember();
  const deactivateMember = useDeactivateFamilyMember();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);
  useEscapeClose(showForm, () => { setShowForm(false); setEditing(null); });

  // Form state
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<FamilyRelationship>("self");
  const [birthDate, setBirthDate] = useState("");
  const [isTaxDep, setIsTaxDep] = useState(false);
  const [avatar, setAvatar] = useState("👤");
  const [error, setError] = useState<string | null>(null);

  const loading = createMember.isPending || updateMember.isPending;

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setRelationship(editing.relationship);
      setBirthDate(editing.birth_date || "");
      setIsTaxDep(editing.is_tax_dependent);
      setAvatar(editing.avatar_emoji || "👤");
    } else {
      setName("");
      setRelationship("self");
      setBirthDate("");
      setIsTaxDep(false);
      setAvatar("👤");
    }
    setError(null);
  }, [editing, showForm]);

  function handleNew() {
    setEditing(null);
    setShowForm(true);
  }

  function handleEdit(m: FamilyMember) {
    setEditing(m);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    try {
      if (editing) {
        await updateMember.mutateAsync({
          id: editing.id,
          name: name.trim(),
          relationship,
          birth_date: birthDate || null,
          is_tax_dependent: isTaxDep,
          avatar_emoji: avatar,
        });
      } else {
        await createMember.mutateAsync({
          name: name.trim(),
          relationship,
          birth_date: birthDate || undefined,
          is_tax_dependent: isTaxDep,
          avatar_emoji: avatar,
        });
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  async function handleDeactivate(id: string) {
    await deactivateMember.mutateAsync(id);
    toast.success("Membro desativado.");
    setConfirmDelete(null);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estrutura Familiar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members?.length || 0} membro(s). Cada membro gera automaticamente um centro de custo.
          </p>
        </div>
        <button type="button"
          onClick={handleNew}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Novo membro
        </button>
      </div>

      {/* Info box */}
      <div className="rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Como funciona</p>
        <p className="mt-1">
          Membros com receita própria (Titular, Cônjuge) são criados como centros de lucro.
          Dependentes (Filhos, Pets, etc.) são centros de custo. Despesas compartilhadas
          (supermercado, energia) podem ser lançadas em &quot;Família (Geral)&quot; sem atribuir a ninguém.
        </p>
      </div>

      {/* Empty state */}
      {(!members || members.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Nenhum membro cadastrado</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Nenhum membro cadastrado. Adicione os membros da família para rastrear despesas e receitas individuais.
          </p>
          <button type="button"
            onClick={handleNew}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Adicionar primeiro membro
          </button>
        </div>
      )}

      {/* Members list */}
      {members && members.length > 0 && (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 shadow-sm"
            >
              {/* Avatar */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
                {m.avatar_emoji || "👤"}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{m.name}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {RELATIONSHIP_LABELS[m.relationship]}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    m.role === "owner"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {ROLE_LABELS[m.role]}
                  </span>
                </div>
                <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                  {m.birth_date && (
                    <span>Nasc: {new Date(m.birth_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                  )}
                  {m.is_tax_dependent && (
                    <span className="text-info-slate font-medium">Dependente IRPF</span>
                  )}
                  {(m.relationship === "self" || m.relationship === "spouse") && (
                    <span className="text-verdant font-medium">Centro de lucro</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button type="button"
                  onClick={() => handleEdit(m)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Editar" aria-label="Editar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {confirmDelete === m.id ? (
                  <div className="flex items-center gap-1">
                    <button type="button"
                      onClick={() => handleDeactivate(m.id)}
                      disabled={deactivateMember.isPending}
                      className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground"
                    >
                      Confirmar
                    </button>
                    <button type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => setConfirmDelete(m.id)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Desativar" aria-label="Desativar"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      {showForm && (
        <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">
              {editing ? "Editar membro" : "Novo membro"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {editing
                ? "Atualize os dados do membro."
                : "Um centro de custo/lucro será criado automaticamente."}
            </p>

            {error && (
              <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Claudio, Luna (pet)"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              {/* Relationship */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Parentesco</label>
                <select
                  value={relationship}
                  onChange={(e) => {
                    const r = e.target.value as FamilyRelationship;
                    setRelationship(r);
                    setAvatar(RELATIONSHIP_OPTIONS.find((o) => o.value === r)?.emoji || "👤");
                  }}
                  disabled={!!editing}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.emoji} {opt.label}
                    </option>
                  ))}
                </select>
                {(relationship === "self" || relationship === "spouse") && (
                  <p className="text-xs text-verdant">
                    Será criado como centro de lucro (gera receita).
                  </p>
                )}
              </div>

              {/* Birth date */}
              {relationship !== "pet" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Data de nascimento <span className="font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}

              {/* Tax dependent */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="tax-dep"
                  checked={isTaxDep}
                  onChange={(e) => setIsTaxDep(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="tax-dep" className="text-sm">
                  Dependente no IRPF
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditing(null); }}
                  className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Salvando" : editing ? "Salvar" : "Criar membro"}
                </button>
              </div>
            </form>
          </div>
        </div>
        </FocusTrap>
      )}
    </div>
  );
}
