"use client";

/**
 * CostCenterForm - Padrão A (componente separado + modal overlay)
 *
 * Criar/editar divisões (centros de custo / lucro).
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useCreateCostCenter,
  useUpdateCostCenter,
  CENTER_TYPE_OPTIONS,
} from "@/lib/hooks/use-cost-centers";
import { getColorName } from "@/lib/utils";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";
import { FormError } from "@/components/ui/form-primitives";

type CenterType = Database["public"]["Enums"]["center_type"];

const PRESET_COLORS = [
  "#56688F", "#2F7A68", "#A97824", "#A64A45", "#6F6678",
  "#A7794E", "#7E9487", "#241E29", "#4A7A6E", "#8B6B4A",
];

export interface CostCenterEditData {
  id: string;
  name: string;
  type: CenterType;
  color: string | null;
}

interface CostCenterFormProps {
  open: boolean;
  onClose: () => void;
  editData?: CostCenterEditData | null;
}

export function CostCenterForm({ open, onClose, editData }: CostCenterFormProps) {
  const isEdit = !!editData;

  const [name, setName] = useState("");
  const [type, setType] = useState<CenterType>("cost_center");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const createCenter = useCreateCostCenter();
  const updateCenter = useUpdateCostCenter();
  const loading = createCenter.isPending || updateCenter.isPending;

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setType(editData.type);
      setColor(editData.color || PRESET_COLORS[0]);
    } else {
      setName("");
      setType("cost_center");
      setColor(PRESET_COLORS[0]);
    }
    setError(null);
  }, [editData, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Nome é obrigatório."); return; }

    try {
      if (isEdit && editData) {
        await updateCenter.mutateAsync({ id: editData.id, name: name.trim(), type, color });
      } else {
        await createCenter.mutateAsync({ name: name.trim(), type, color });
      }
      toast.success(isEdit ? "Divisão atualizada." : "Divisão criada com sucesso.");
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
        <h2 className="text-lg font-bold">{isEdit ? "Editar divisão" : "Nova divisão"}</h2>

        <FormError message={error} />

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="cc-name" className="text-sm font-medium">Nome</label>
            <input id="cc-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Casa, Trabalho, Reforma" autoFocus aria-required="true"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>

          <div className="space-y-1.5">
            <label id="center-type-label" className="text-sm font-medium">Tipo</label>
            <div role="radiogroup" aria-labelledby="center-type-label" className="space-y-2">
              {CENTER_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" role="radio" aria-checked={type === opt.value}
                  onClick={() => setType(opt.value)}
                  className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                    type === opt.value ? "border-primary bg-primary/5" : "border-input hover:bg-accent"
                  }`}>
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
                <button key={c} type="button" onClick={() => setColor(c)}
                  aria-label={getColorName(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 rounded-md btn-alive border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-md btn-cta px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {loading ? "Salvando" : isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
