/**
 * Tests: Sentry beforeSend PII scrubbing
 *
 * Verifies that exception messages, breadcrumbs, and values
 * are sanitized before being sent to Sentry.
 *
 * Source: Gemini audit finding (Sentry without beforeSend)
 */

import { sanitizePII } from "@/lib/utils/pii-sanitizer";

// Simulate the scrubEvent function from sentry configs
interface MockErrorEvent {
  exception?: {
    values?: { value?: string }[];
  };
  breadcrumbs?: { message?: string }[];
}

function scrubEvent(event: MockErrorEvent): MockErrorEvent {
  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) ex.value = sanitizePII(ex.value);
    }
  }
  if (event.breadcrumbs) {
    for (const bc of event.breadcrumbs) {
      if (bc.message) bc.message = sanitizePII(bc.message);
    }
  }
  return event;
}

describe("Sentry beforeSend PII scrubbing", () => {
  describe("exception values", () => {
    it("scrubs CPF from exception message", () => {
      const event = scrubEvent({
        exception: {
          values: [{ value: "Erro ao processar CPF 123.456.789-00 do usuário" }],
        },
      });
      expect(event.exception!.values![0].value).not.toContain("123.456.789-00");
      expect(event.exception!.values![0].value).toContain("[CPF]");
    });

    it("scrubs email from exception message", () => {
      const event = scrubEvent({
        exception: {
          values: [{ value: "Falha ao enviar email para user@example.com" }],
        },
      });
      expect(event.exception!.values![0].value).not.toContain("user@example.com");
      expect(event.exception!.values![0].value).toContain("[EMAIL]");
    });

    it("scrubs CNPJ from exception message", () => {
      const event = scrubEvent({
        exception: {
          values: [{ value: "Empresa 12.345.678/0001-00 não encontrada" }],
        },
      });
      expect(event.exception!.values![0].value).not.toContain("12.345.678/0001-00");
      expect(event.exception!.values![0].value).toContain("[CNPJ]");
    });

    it("scrubs phone from exception message", () => {
      const event = scrubEvent({
        exception: {
          values: [{ value: "Número (62) 99999-1234 inválido" }],
        },
      });
      expect(event.exception!.values![0].value).not.toContain("99999-1234");
      expect(event.exception!.values![0].value).toContain("[TEL]");
    });

    it("scrubs credit card from exception message", () => {
      const event = scrubEvent({
        exception: {
          values: [{ value: "Cartão 4111 2222 3333 4444 rejeitado" }],
        },
      });
      expect(event.exception!.values![0].value).not.toContain("4111");
      expect(event.exception!.values![0].value).toContain("[CARTAO]");
    });

    it("handles multiple PII types in same message", () => {
      const event = scrubEvent({
        exception: {
          values: [{ value: "CPF 123.456.789-00 email test@mail.com tel 11 98765-4321" }],
        },
      });
      const val = event.exception!.values![0].value!;
      expect(val).toContain("[CPF]");
      expect(val).toContain("[EMAIL]");
      expect(val).toContain("[TEL]");
    });

    it("handles multiple exception values", () => {
      const event = scrubEvent({
        exception: {
          values: [
            { value: "Error with CPF 111.222.333-44" },
            { value: "Caused by email admin@oniefy.com" },
          ],
        },
      });
      expect(event.exception!.values![0].value).toContain("[CPF]");
      expect(event.exception!.values![1].value).toContain("[EMAIL]");
    });

    it("preserves message without PII", () => {
      const event = scrubEvent({
        exception: {
          values: [{ value: "TypeError: Cannot read property 'x' of undefined" }],
        },
      });
      expect(event.exception!.values![0].value).toBe(
        "TypeError: Cannot read property 'x' of undefined"
      );
    });
  });

  describe("breadcrumbs", () => {
    it("scrubs PII from breadcrumb messages", () => {
      const event = scrubEvent({
        breadcrumbs: [
          { message: "User 123.456.789-00 logged in" },
          { message: "Fetching data" },
        ],
      });
      expect(event.breadcrumbs![0].message).toContain("[CPF]");
      expect(event.breadcrumbs![1].message).toBe("Fetching data");
    });

    it("handles breadcrumb without message", () => {
      const event = scrubEvent({
        breadcrumbs: [{ message: undefined }],
      });
      expect(event.breadcrumbs![0].message).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("handles event with no exception", () => {
      const event = scrubEvent({});
      expect(event).toEqual({});
    });

    it("handles event with empty values array", () => {
      const event = scrubEvent({ exception: { values: [] } });
      expect(event.exception!.values).toEqual([]);
    });

    it("handles event with null-ish value", () => {
      const event = scrubEvent({
        exception: { values: [{ value: undefined }] },
      });
      expect(event.exception!.values![0].value).toBeUndefined();
    });
  });
});
