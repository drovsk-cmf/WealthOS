"use client";

/**
 * FamilyMemberForm - Padrão A (componente separado + modal overlay)
 *
 * Criar/editar membros da família. Extraído de family/page.tsx
 * para consistência com AccountForm, AssetForm, GoalForm, etc.
 */

import { useState, useEffect } from "react";
import {
  useCreateFamilyMember,
  useUpdateFamilyMember,
  RELATIONSHIP_OPTIONS,
} from "@/lib/hooks/use-family-members";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";
import { FormError } from "@/components/ui/form-primitives";

type FamilyRelationship = Database["public"]["Enums"]["family_relationship"];

export interface FamilyEditData {
  id: string;
  name: string;
  relationship: FamilyRelationship;
  birth_date: string | null;
  is_tax_dependent: boolean;
  avatar_emoji: string | null;
}

interface FamilyMemberFormProps {
  open: boolean;
  onClose: () => void;
  editData?: FamilyEditData | null;
}

export function FamilyMemberForm({ open, onClose, editData }: FamilyMemberFormProps) {
  const isEdit = !!editData;

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<FamilyRelationship>("self");
  const [birthDate, setBirthDate] = useState("");
  const [isTaxDep, setIsTaxDep] = useState(false);
  const [avatar, setAvatar] = useState("👤");
  const [error, setError] = useState<string | null>(null);

  const createMember = useCreateFamilyMember();
  const updateMember = useUpdateFamilyMember();
  const loading = createMember.isPending || updateMember.isPending;

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setRelationship(editData.relationship);
      setBirthDate(editData.birth_date || "");
      setIsTaxDep(editData.is_tax_dependent);
      setAvatar(editData.avatar_emoji || "👤");
    } else {
      setName("");
      setRelationship("self");
      setBirthDate("");
      setIsTaxDep(false);
      setAvatar("👤");
    }
    setError(null);
  }, [editData, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    try {
      if (isEdit && editData) {
        await updateMember.mutateAsync({
          id: editData.id,
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
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  }

  if (!open) return null;

  return (
    <FocusTrap focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: true, onDeactivate: onClose }}>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-lg mx-4">
        <h2 className="text-lg font-bold">
          {isEdit ? "Editar membro" : "Novo membro"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? "Atualize os dados do membro."
            : "Uma divisão será criada automaticamente."}
        </p>

        <FormError message={error} />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João, Luna (pet)"
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
              disabled={!!editData}
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
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-md btn-alive border px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md btn-cta px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? "Salvando" : isEdit ? "Salvar" : "Criar membro"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
