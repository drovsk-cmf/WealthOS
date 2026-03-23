"use client";

import { useState, useEffect } from "react";
import {
  useCreateCategory,
  useUpdateCategory,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/lib/hooks/use-categories";
import { getColorName } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/types/database";
import FocusTrap from "focus-trap-react";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type CategoryType = Database["public"]["Enums"]["category_type"];

interface CategoryFormProps {
  category?: Category | null;
  open: boolean;
  onClose: () => void;
  defaultType?: CategoryType;
}

export function CategoryForm({ category, open, onClose, defaultType = "expense" }: CategoryFormProps) {
  const isEdit = !!category;

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(defaultType);
  const [icon, setIcon] = useState("circle-dot");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const loading = createCategory.isPending || updateCategory.isPending;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setIcon(category.icon || "circle-dot");
      setColor(category.color || CATEGORY_COLORS[0]);
    } else {
      setName("");
      setType(defaultType);
      setIcon("circle-dot");
      setColor(CATEGORY_COLORS[0]);
    }
    setError(null);
  }, [category, open, defaultType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    try {
      if (isEdit && category) {
        await updateCategory.mutateAsync({
          id: category.id,
          name: name.trim(),
          icon,
          color,
          // type doesn't change on edit
        });
      } else {
        await createCategory.mutateAsync({
          name: name.trim(),
          type,
          icon,
          color,
        });
      }
      toast.success(isEdit ? "Categoria atualizada." : "Categoria criada com sucesso.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar categoria.");
    }
  }

  if (!open) return null;

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-lg bg-card p-6 shadow-elevated">
        <h2 className="text-lg font-semibold">
          {isEdit ? "Editar categoria" : "Nova categoria"}
        </h2>

        {error && (
          <div role="alert" className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="cat-name" className="text-sm font-medium">Nome</label>
            <input
              id="cat-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mercado"
              aria-required="true"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
          </div>

          {/* Type */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <div role="radiogroup" aria-label="Tipo de categoria" className="flex gap-2">
                {(["expense", "income"] as CategoryType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={type === t}
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      type === t
                        ? t === "income"
                          ? "border-verdant bg-verdant/10 text-verdant"
                          : "border-terracotta bg-terracotta/10 text-terracotta"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    {t === "income" ? "Receita" : "Despesa"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cor</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={getColorName(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-1.5">
            <label id="cat-icon-label" className="text-sm font-medium">Ícone</label>
            <div role="radiogroup" aria-labelledby="cat-icon-label" className="grid max-h-32 grid-cols-10 gap-1 overflow-y-auto rounded-md border p-2">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  role="radio"
                  aria-checked={icon === ic}
                  onClick={() => setIcon(ic)}
                  className={`flex h-8 w-8 items-center justify-center rounded text-xs transition-colors ${
                    icon === ic ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                  aria-label={ic}
                >
                  {ic.slice(0, 2)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecionado: <span className="font-mono">{icon}</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md btn-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? "Salvando" : isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FocusTrap>
  );
}
