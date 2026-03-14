/**
 * Tests for useEscapeClose and useAutoReset hooks.
 * These are UX-critical: ESC should close dialogs, auto-reset should prevent stale confirm states.
 */

import { renderHook, act } from "@testing-library/react";
import { useEscapeClose, useAutoReset } from "@/lib/hooks/use-dialog-helpers";
import { useState } from "react";

describe("dialog helpers", () => {
  describe("useEscapeClose", () => {
    it("calls onClose when Escape is pressed and dialog is open", () => {
      const onClose = jest.fn();
      renderHook(() => useEscapeClose(true, onClose));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when dialog is closed", () => {
      const onClose = jest.fn();
      renderHook(() => useEscapeClose(false, onClose));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("does not call onClose for non-Escape keys", () => {
      const onClose = jest.fn();
      renderHook(() => useEscapeClose(true, onClose));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("cleans up listener when dialog closes", () => {
      const onClose = jest.fn();
      const { rerender } = renderHook(
        ({ open }) => useEscapeClose(open, onClose),
        { initialProps: { open: true } }
      );

      // Close the dialog
      rerender({ open: false });

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("useAutoReset", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("resets value to null after timeout", () => {
      const { result } = renderHook(() => {
        const [value, setValue] = useState<string | null>("confirm-123");
        useAutoReset(value, setValue, 5000);
        return { value, setValue };
      });

      expect(result.current.value).toBe("confirm-123");

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.value).toBeNull();
    });

    it("does not fire when value is already null", () => {
      const setter = jest.fn();
      renderHook(() => useAutoReset(null, setter, 5000));

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(setter).not.toHaveBeenCalled();
    });

    it("uses default 5s timeout", () => {
      const { result } = renderHook(() => {
        const [value, setValue] = useState<string | null>("test");
        useAutoReset(value, setValue);
        return { value };
      });

      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(result.current.value).toBe("test");

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current.value).toBeNull();
    });

    it("resets timer when value changes", () => {
      const { result } = renderHook(() => {
        const [value, setValue] = useState<string | null>("first");
        useAutoReset(value, setValue, 3000);
        return { value, setValue };
      });

      // Advance 2s
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Change value: timer restarts
      act(() => {
        result.current.setValue("second");
      });

      // 2s more (4s total, but only 2s since new value)
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.value).toBe("second");

      // 1s more (3s since "second" was set)
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.value).toBeNull();
    });
  });
});
