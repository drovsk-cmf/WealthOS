"use client";

/**
 * MoneyInput - Máscara monetária automática (pt-BR)
 *
 * Comportamento tipo app bancário:
 * - Usuário digita apenas números (sem ponto ou vírgula)
 * - Últimos 2 dígitos são sempre centavos
 * - Formatação em tempo real: "150000" → "1.500,00"
 * - Backspace apaga o último dígito e reajusta
 * - Valor zero mostra "0,00"
 *
 * Props:
 * - value: valor em reais (float). Ex: 1500.00
 * - onChange: callback com valor em reais (float). Ex: onChange(1500.00)
 * - Demais props são repassadas ao <input>
 */

import { useCallback, useRef, type InputHTMLAttributes } from "react";

interface MoneyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode"> {
  /** Valor em reais (float). Ex: 1500.00 */
  value: number;
  /** Callback com valor em reais (float) */
  onChange: (value: number) => void;
}

/** Formata centavos inteiros para string pt-BR: 150000 → "1.500,00" */
function formatCentavos(centavos: number): string {
  const reais = centavos / 100;
  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function MoneyInput({ value, onChange, className, ...rest }: MoneyInputProps) {
  // Track raw centavos to avoid float drift
  const centavosRef = useRef(Math.round(value * 100));

  // Sync ref when parent value changes externally
  const expectedCentavos = Math.round(value * 100);
  if (centavosRef.current !== expectedCentavos) {
    centavosRef.current = expectedCentavos;
  }

  const displayValue = formatCentavos(centavosRef.current);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: Tab, Enter, Escape, arrow keys
      if (["Tab", "Enter", "Escape", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        return;
      }

      e.preventDefault();

      if (e.key === "Backspace") {
        // Remove last digit
        centavosRef.current = Math.floor(centavosRef.current / 10);
        onChange(centavosRef.current / 100);
        return;
      }

      // Only accept digit keys
      if (e.key >= "0" && e.key <= "9") {
        const digit = parseInt(e.key, 10);
        const next = centavosRef.current * 10 + digit;
        // Cap at 999,999,999.99 (99999999999 centavos)
        if (next > 99999999999) return;
        centavosRef.current = next;
        onChange(centavosRef.current / 100);
      }
    },
    [onChange]
  );

  const handleChange = useCallback(() => {
    // No-op: all logic handled via onKeyDown
    // This handler exists to satisfy React's controlled input requirement
  }, []);

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      className={className}
    />
  );
}
