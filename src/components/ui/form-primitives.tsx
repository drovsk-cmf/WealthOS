/**
 * Shared form primitives (D08 - reduce form duplication)
 *
 * Used by: account-form, category-form, budget-form, recurrence-form,
 * asset-form, cutoff-date-modal, etc.
 */

/**
 * Error alert banner for forms.
 * Replaces the duplicated pattern:
 *   <div role="alert" className="mt-3 rounded-md border border-destructive/50 ...">
 */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

/**
 * Labeled text input with standard Plum Ledger styling.
 * Replaces the duplicated pattern:
 *   <div className="space-y-1.5">
 *     <label htmlFor={id} className="text-sm font-medium">...</label>
 *     <input className="flex h-10 w-full rounded-md border ..." />
 *   </div>
 */
export function FormInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  disabled,
  min,
  max,
  step,
  inputMode,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  step?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        inputMode={inputMode}
        autoFocus={autoFocus}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      />
    </div>
  );
}

/**
 * Labeled select dropdown with standard styling.
 */
export function FormSelect({
  id,
  label,
  value,
  onChange,
  children,
  required,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  );
}

/**
 * Parse Brazilian monetary amount string to number.
 * "1.234,56" → 1234.56
 * Returns NaN if invalid.
 */
export function parseMonetaryAmount(raw: string): number {
  return parseFloat(raw.replace(/\./g, "").replace(",", "."));
}
