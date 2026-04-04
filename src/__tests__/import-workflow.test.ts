/**
 * Tests: Import Failure Workflow Generator (E71)
 * Ref: docs/IMPORT-ENGINE-SPEC.md §2.4
 */
import {
  generateImportWorkflow,
  classifyImportError,
  type ImportFailure,
} from "@/lib/services/import-workflow";

describe("generateImportWorkflow", () => {
  it("unauthorized_sender: gera workflow com e-mail do remetente", () => {
    const w = generateImportWorkflow({
      type: "unauthorized_sender",
      senderEmail: "faturas@btgpactual.com",
    });
    expect(w.title).toBe("Remetente não autorizado");
    expect(w.description).toContain("faturas@btgpactual.com");
    expect(w.priority).toBe("action");
    expect(w.primaryAction).toContain("Autorizar");
  });

  it("password_required: gera workflow com nome do banco", () => {
    const w = generateImportWorkflow({
      type: "password_required",
      bankName: "BTG Pactual",
      fileName: "fatura_btg_mar2026.xlsx",
    });
    expect(w.title).toContain("senha");
    expect(w.description).toContain("BTG Pactual");
    expect(w.description).toContain("fatura_btg_mar2026.xlsx");
    expect(w.primaryAction).toContain("Informar senha");
    expect(w.secondaryAction).toContain("CPF");
  });

  it("unknown_format: gera workflow com nome do arquivo", () => {
    const w = generateImportWorkflow({
      type: "unknown_format",
      fileName: "extrato.ods",
    });
    expect(w.description).toContain("extrato.ods");
    expect(w.primaryAction).toContain("upload manual");
  });

  it("parser_failed: gera workflow com mapeamento de colunas", () => {
    const w = generateImportWorkflow({
      type: "parser_failed",
      bankName: "Banco Novo",
    });
    expect(w.description).toContain("mapear");
    expect(w.primaryAction).toContain("Mapear colunas");
  });

  it("no_attachment: gera workflow info (não urgente)", () => {
    const w = generateImportWorkflow({
      type: "no_attachment",
      senderEmail: "noreply@enel.com.br",
    });
    expect(w.priority).toBe("info");
    expect(w.description).toContain("sem anexo");
  });

  it("total_mismatch: calcula diferença corretamente", () => {
    const w = generateImportWorkflow({
      type: "total_mismatch",
      expectedTotal: 4200.0,
      actualTotal: 4350.0,
      bankName: "Nubank",
    });
    expect(w.description).toContain("4200.00");
    expect(w.description).toContain("4350.00");
    expect(w.description).toContain("150.00");
    expect(w.metadata.difference).toBe(150);
  });

  it("duplicate_invoice: gera workflow com data anterior", () => {
    const w = generateImportWorkflow({
      type: "duplicate_invoice",
      bankName: "Itaú",
      previousImportDate: "15/03/2026",
    });
    expect(w.description).toContain("já foi importada");
    expect(w.description).toContain("15/03/2026");
    expect(w.primaryAction).toContain("Substituir");
  });

  it("empty_file: gera workflow info", () => {
    const w = generateImportWorkflow({
      type: "empty_file",
      fileName: "resumo.csv",
    });
    expect(w.priority).toBe("info");
    expect(w.description).toContain("resumo.csv");
  });

  it("todos os tipos geram metadata com failure_type", () => {
    const types: ImportFailure["type"][] = [
      "unauthorized_sender", "password_required", "unknown_format",
      "parser_failed", "no_attachment", "total_mismatch",
      "duplicate_invoice", "empty_file",
    ];
    for (const type of types) {
      const w = generateImportWorkflow({ type });
      expect(w.metadata.failure_type).toBe(type);
    }
  });
});

describe("classifyImportError", () => {
  it("classifica erro de senha", () => {
    expect(classifyImportError("File is password protected").type).toBe("password_required");
    expect(classifyImportError("Arquivo protegido com senha").type).toBe("password_required");
    expect(classifyImportError("Encrypted PDF").type).toBe("password_required");
  });

  it("classifica erro de formato", () => {
    expect(classifyImportError("Unsupported MIME type").type).toBe("unknown_format");
    expect(classifyImportError("Tipo de arquivo não suportado").type).toBe("unknown_format");
  });

  it("classifica erro de parser", () => {
    expect(classifyImportError("Could not parse header columns").type).toBe("parser_failed");
    expect(classifyImportError("Layout desconhecido").type).toBe("parser_failed");
  });

  it("classifica arquivo vazio", () => {
    expect(classifyImportError("0 lançamentos encontrados").type).toBe("empty_file");
    expect(classifyImportError("Arquivo vazio").type).toBe("empty_file");
  });

  it("classifica duplicata", () => {
    expect(classifyImportError("Fatura já importada anteriormente").type).toBe("duplicate_invoice");
  });

  it("classifica remetente não autorizado", () => {
    expect(classifyImportError("Remetente não autorizado").type).toBe("unauthorized_sender");
  });

  it("classifica e-mail sem anexo", () => {
    expect(classifyImportError("E-mail sem anexo").type).toBe("no_attachment");
  });

  it("classifica total divergente", () => {
    expect(classifyImportError("Soma dos lançamentos diverge do total").type).toBe("total_mismatch");
  });

  it("fallback para parser_failed", () => {
    expect(classifyImportError("Unknown error occurred").type).toBe("parser_failed");
  });

  it("propaga contexto", () => {
    const result = classifyImportError("Encrypted file", {
      bankName: "BTG",
      fileName: "fatura.xlsx",
    });
    expect(result.type).toBe("password_required");
    expect(result.bankName).toBe("BTG");
    expect(result.fileName).toBe("fatura.xlsx");
  });
});
