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
import { createClient } from "@/lib/supabase/client";
import { getActiveDEK } from "@/lib/auth/encryption-manager";
import { encryptField, decryptField } from "@/lib/crypto";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";
import { FormError } from "@/components/ui/form-primitives";

type FamilyRelationship = Database["public"]["Enums"]["family_relationship"];

/** Format raw digits as ###.###.###-## */
function formatCpfDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCpf(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

export interface FamilyEditData {
  id: string;
  name: string;
  relationship: FamilyRelationship;
  birth_date: string | null;
  is_tax_dependent: boolean;
  avatar_emoji: string | null;
  cpf_encrypted: string | null;
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
  const [cpf, setCpf] = useState("");
  const [cpfConsent, setCpfConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
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
      // Decrypt CPF if exists
      const dek = getActiveDEK();
      if (dek && editData.cpf_encrypted) {
        decryptField(editData.cpf_encrypted, dek)
          .then((plain) => { setCpf(formatCpfDisplay(plain)); setCpfConsent(true); })
          .catch(() => setCpf(""));
      } else {
        setCpf("");
        setCpfConsent(false);
      }
    } else {
      setName("");
      setRelationship("self");
      setBirthDate("");
      setIsTaxDep(false);
      setAvatar("👤");
      setCpf("");
      setCpfConsent(false);
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

    // Validate CPF if provided
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits && !isValidCpf(cpfDigits)) {
      setError("CPF inválido. Verifique os dígitos.");
      return;
    }
    if (cpfDigits && !cpfConsent) {
      setError("Marque o consentimento para salvar o CPF.");
      return;
    }

    try {
      let memberId: string | undefined;

      if (isEdit && editData) {
        await updateMember.mutateAsync({
          id: editData.id,
          name: name.trim(),
          relationship,
          birth_date: birthDate || null,
          is_tax_dependent: isTaxDep,
          avatar_emoji: avatar,
        });
        memberId = editData.id;
      } else {
        const newId = await createMember.mutateAsync({
          name: name.trim(),
          relationship,
          birth_date: birthDate || undefined,
          is_tax_dependent: isTaxDep,
          avatar_emoji: avatar,
        });
        memberId = newId as string;
      }

      // Save CPF (encrypted) separately
      if (memberId) {
        const dek = getActiveDEK();
        if (cpfDigits && dek && cpfConsent) {
          const encrypted = await encryptField(cpfDigits, dek);
          await supabase.from("family_members").update({ cpf_encrypted: encrypted }).eq("id", memberId);
        } else if (!cpfDigits) {
          await supabase.from("family_members").update({ cpf_encrypted: null }).eq("id", memberId);
        }
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

          {/* CPF (L3 LGPD) — shown when tax dependent */}
          {isTaxDep && (
            <div className="space-y-3 rounded-lg border border-dashed border-border/60 p-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">CPF do dependente</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpfDisplay(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  inputMode="numeric"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums"
                />
              </div>
              {cpf.replace(/\D/g, "").length > 0 && (
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={cpfConsent}
                    onChange={(e) => setCpfConsent(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-input"
                  />
                  <span>
                    Autorizo o armazenamento criptografado do CPF para fins fiscais.
                  </span>
                </label>
              )}
            </div>
          )}

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
