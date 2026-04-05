"use client";

import { toast } from "sonner";

import { useState } from "react";
import { Users, Archive } from "lucide-react";
import {
  useFamilyMembers,
  useDeactivateFamilyMember,
  RELATIONSHIP_LABELS,
  ROLE_LABELS,
} from "@/lib/hooks/use-family-members";
import { useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import type { Database } from "@/types/database";
import { FamilyMemberForm } from "@/components/family/family-member-form";
import type { FamilyEditData } from "@/components/family/family-member-form";

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];

export default function FamilyPage() {
  const { data: members, isLoading } = useFamilyMembers();
  const deactivateMember = useDeactivateFamilyMember();

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<FamilyEditData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useAutoReset(confirmDelete, setConfirmDelete);

  function handleNew() {
    setEditData(null);
    setFormOpen(true);
  }

  function handleEdit(m: FamilyMember) {
    setEditData({
      id: m.id,
      name: m.name,
      relationship: m.relationship,
      birth_date: m.birth_date,
      is_tax_dependent: m.is_tax_dependent,
      avatar_emoji: m.avatar_emoji,
      cpf_encrypted: m.cpf_encrypted,
    });
    setFormOpen(true);
  }

  async function handleDeactivate(id: string) {
    await deactivateMember.mutateAsync(id);
    toast.success("Membro desativado.");
    setConfirmDelete(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estrutura Familiar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members?.length || 0} membro(s). Cada membro gera automaticamente uma divisão.
          </p>
        </div>
        <button type="button"
          onClick={handleNew}
          className="rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + Novo membro
        </button>
      </div>

      {/* Info box */}
      <div className="rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Como funciona</p>
        <p className="mt-1">
          Membros com receita própria (Titular, Cônjuge) são criados como divisões de lucro.
          Dependentes (Filhos, Pets, etc.) são divisões de custo. Despesas compartilhadas
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
            className="mt-4 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground"
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
              className="flex items-center gap-4 rounded-lg bg-card px-4 py-3 shadow-card card-alive"
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

      {/* Form modal (Padrão A) */}
      <FamilyMemberForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        editData={editData}
      />
    </div>
  );
}
