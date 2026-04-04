/**
 * Oniefy - Import Failure Workflow Generator (E71)
 *
 * Generates structured workflow items when bank statement import fails.
 * Each failure type produces a specific workflow with user-friendly
 * message and actionable resolution options.
 *
 * These workflows feed into the notification bell (E22) and the
 * workflows page (/workflows).
 *
 * Ref: docs/IMPORT-ENGINE-SPEC.md §2.4
 */

// ── Tipos ──

export type ImportFailureType =
  | "unauthorized_sender"
  | "password_required"
  | "unknown_format"
  | "parser_failed"
  | "no_attachment"
  | "total_mismatch"
  | "duplicate_invoice"
  | "empty_file";

export interface ImportFailure {
  type: ImportFailureType;
  /** Bank name (if detected) */
  bankName?: string;
  /** Sender email (for inbound email failures) */
  senderEmail?: string;
  /** File name */
  fileName?: string;
  /** Additional context */
  details?: string;
  /** For total_mismatch: expected and actual totals */
  expectedTotal?: number;
  actualTotal?: number;
  /** For duplicate_invoice: date of previous import */
  previousImportDate?: string;
}

export interface ImportWorkflow {
  /** Workflow title (shown in notification bell and workflows page) */
  title: string;
  /** Detailed description from the Onie */
  description: string;
  /** Priority: urgent (red), action (amber), info (neutral) */
  priority: "urgent" | "action" | "info";
  /** Primary action label */
  primaryAction: string;
  /** Secondary action label (optional) */
  secondaryAction?: string;
  /** Workflow type for the DB */
  workflowType: "monthly_close" | "document_upload" | "account_review" | "tax_filing";
  /** Metadata to store with the workflow */
  metadata: Record<string, string | number | boolean>;
}

// ── Gerador ──

/**
 * Generate a workflow from an import failure.
 *
 * @param failure - The import failure details
 * @returns A structured workflow ready to be persisted
 */
export function generateImportWorkflow(failure: ImportFailure): ImportWorkflow {
  switch (failure.type) {
    case "unauthorized_sender":
      return {
        title: "Remetente não autorizado",
        description: `Recebi um e-mail de ${failure.senderEmail ?? "remetente desconhecido"} mas não está na sua lista de autorizados. Quer adicionar?`,
        priority: "action",
        primaryAction: "Autorizar remetente",
        secondaryAction: "Descartar",
        workflowType: "account_review",
        metadata: {
          failure_type: "unauthorized_sender",
          sender_email: failure.senderEmail ?? "",
          file_name: failure.fileName ?? "",
        },
      };

    case "password_required":
      return {
        title: `Fatura protegida com senha`,
        description: `Não consegui abrir a fatura${failure.bankName ? ` do ${failure.bankName}` : ""}${failure.fileName ? ` (${failure.fileName})` : ""}. Qual é a senha do arquivo?`,
        priority: "action",
        primaryAction: "Informar senha",
        secondaryAction: "Tentar com CPF",
        workflowType: "document_upload",
        metadata: {
          failure_type: "password_required",
          bank_name: failure.bankName ?? "",
          file_name: failure.fileName ?? "",
        },
      };

    case "unknown_format":
      return {
        title: "Formato não reconhecido",
        description: `Recebi o arquivo ${failure.fileName ?? "desconhecido"} mas não sei processar. É uma fatura?`,
        priority: "action",
        primaryAction: "Sim, fazer upload manual",
        secondaryAction: "Não, descartar",
        workflowType: "document_upload",
        metadata: {
          failure_type: "unknown_format",
          file_name: failure.fileName ?? "",
          details: failure.details ?? "",
        },
      };

    case "parser_failed":
      return {
        title: `Erro ao processar fatura`,
        description: `Consegui abrir a fatura${failure.bankName ? ` do ${failure.bankName}` : ""} mas não entendi o formato. Preciso da sua ajuda para mapear as colunas.`,
        priority: "action",
        primaryAction: "Mapear colunas",
        secondaryAction: "Tentar novamente",
        workflowType: "document_upload",
        metadata: {
          failure_type: "parser_failed",
          bank_name: failure.bankName ?? "",
          file_name: failure.fileName ?? "",
          details: failure.details ?? "",
        },
      };

    case "no_attachment":
      return {
        title: "E-mail sem anexo",
        description: `Recebi um e-mail de ${failure.senderEmail ?? "remetente"} sem anexo. A fatura pode estar no corpo do e-mail ou em um link.`,
        priority: "info",
        primaryAction: "Tentar ler corpo do e-mail",
        secondaryAction: "Descartar",
        workflowType: "account_review",
        metadata: {
          failure_type: "no_attachment",
          sender_email: failure.senderEmail ?? "",
        },
      };

    case "total_mismatch": {
      const diff = (failure.actualTotal ?? 0) - (failure.expectedTotal ?? 0);
      const diffStr = Math.abs(diff).toFixed(2);
      return {
        title: "Total da fatura divergente",
        description: `A soma dos lançamentos (R$ ${(failure.actualTotal ?? 0).toFixed(2)}) não bate com o total da fatura (R$ ${(failure.expectedTotal ?? 0).toFixed(2)}). Diferença de R$ ${diffStr}.`,
        priority: "action",
        primaryAction: "Aceitar com diferença",
        secondaryAction: "Verificar manualmente",
        workflowType: "monthly_close",
        metadata: {
          failure_type: "total_mismatch",
          expected_total: failure.expectedTotal ?? 0,
          actual_total: failure.actualTotal ?? 0,
          difference: diff,
          bank_name: failure.bankName ?? "",
        },
      };
    }

    case "duplicate_invoice":
      return {
        title: "Fatura já importada",
        description: `Esta fatura${failure.bankName ? ` do ${failure.bankName}` : ""} já foi importada${failure.previousImportDate ? ` em ${failure.previousImportDate}` : ""}. Quer substituir?`,
        priority: "info",
        primaryAction: "Substituir",
        secondaryAction: "Manter anterior",
        workflowType: "account_review",
        metadata: {
          failure_type: "duplicate_invoice",
          bank_name: failure.bankName ?? "",
          previous_import_date: failure.previousImportDate ?? "",
          file_name: failure.fileName ?? "",
        },
      };

    case "empty_file":
      return {
        title: "Arquivo vazio",
        description: `O arquivo ${failure.fileName ?? ""} não contém lançamentos. Pode ser um resumo ou cabeçalho sem transações.`,
        priority: "info",
        primaryAction: "Descartar",
        workflowType: "document_upload",
        metadata: {
          failure_type: "empty_file",
          file_name: failure.fileName ?? "",
        },
      };
  }
}

/**
 * Classify an error from the import pipeline into a failure type.
 * Useful for mapping generic errors to structured workflows.
 */
export function classifyImportError(
  error: string,
  context?: { bankName?: string; fileName?: string; senderEmail?: string }
): ImportFailure {
  const lower = error.toLowerCase();

  if (lower.includes("password") || lower.includes("senha") || lower.includes("encrypted") || lower.includes("proteg")) {
    return { type: "password_required", ...context };
  }

  if (lower.includes("format") || lower.includes("mime") || lower.includes("tipo de arquivo")) {
    return { type: "unknown_format", ...context, details: error };
  }

  if (lower.includes("parse") || lower.includes("coluna") || lower.includes("header") || lower.includes("layout")) {
    return { type: "parser_failed", ...context, details: error };
  }

  if (lower.includes("vazio") || lower.includes("empty") || lower.includes("0 lançamento") || lower.includes("sem transaç")) {
    return { type: "empty_file", ...context };
  }

  if (lower.includes("duplica") || lower.includes("já importa")) {
    return { type: "duplicate_invoice", ...context };
  }

  if (lower.includes("remetente") || lower.includes("sender") || lower.includes("autoriz")) {
    return { type: "unauthorized_sender", ...context };
  }

  if (lower.includes("anexo") || lower.includes("attachment")) {
    return { type: "no_attachment", ...context };
  }

  if (lower.includes("total") || lower.includes("soma") || lower.includes("diverge")) {
    return { type: "total_mismatch", ...context };
  }

  // Default: parser failed
  return { type: "parser_failed", ...context, details: error };
}
