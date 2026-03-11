/**
 * Oniefy - Dialog & Confirm UX Helpers
 *
 * useEscapeClose: closes a dialog when ESC is pressed.
 * useAutoReset: auto-resets a state value after a timeout.
 */

import { useEffect, type Dispatch, type SetStateAction } from "react";

/**
 * Closes a dialog when the Escape key is pressed.
 * @param open - whether the dialog is currently open
 * @param onClose - function to close the dialog
 */
export function useEscapeClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
}

/**
 * Auto-resets a state value to null after a timeout (default 5s).
 * Useful for confirmDelete / confirmReverse patterns.
 * @param value - current state value
 * @param setter - state setter
 * @param ms - timeout in milliseconds (default 5000)
 */
export function useAutoReset<T>(
  value: T | null,
  setter: Dispatch<SetStateAction<T | null>>,
  ms: number = 5000
) {
  useEffect(() => {
    if (value === null) return;
    const timer = setTimeout(() => setter(null), ms);
    return () => clearTimeout(timer);
  }, [value, setter, ms]);
}
