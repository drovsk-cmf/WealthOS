"use client";

import { useCallback, useState } from "react";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useBankConnections, useImportBatch } from "@/lib/hooks/use-bank-connections";
import { mapToTransactions, parseCSVRaw, suggestMapping } from "@/lib/parsers/csv-parser";
import { parseOFX } from "@/lib/parsers/ofx-parser";
import { parseXLSX } from "@/lib/parsers/xlsx-parser";
import type { CSVColumnMapping, CSVTransaction } from "@/lib/parsers/csv-parser";
import type { OFXTransaction } from "@/lib/parsers/ofx-parser";
import { ImportStepMapping } from "./import-step-mapping";
import { ImportStepPreview } from "./import-step-preview";
import { ImportStepResult } from "./import-step-result";
import { ImportStepUpload } from "./import-step-upload";

type ImportStep = "upload" | "mapping" | "preview" | "result";

export function ImportWizard() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileType, setFileType] = useState<"csv" | "ofx" | "xlsx">("csv");
  const [accountId, setAccountId] = useState("");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CSVColumnMapping | null>(null);
  const [transactions, setTransactions] = useState<(CSVTransaction | OFXTransaction)[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const { data: accounts } = useAccounts();
  const { data: connections } = useBankConnections();
  const importBatch = useImportBatch();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setParseErrors(["Arquivo muito grande. Limite: 10MB."]);
      return;
    }

    const ext = file.name.toLowerCase().split(".").pop();

    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const buffer = ev.target?.result as ArrayBuffer;
        const result = parseXLSX(buffer);
        setFileType("xlsx");
        setCsvHeaders(result.headers);
        setCsvRows(result.rows);
        setMapping(suggestMapping(result.headers, result.rows[0] || []));
        setStep("mapping");
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;

      if (ext === "ofx" || ext === "qfx") {
        setFileType("ofx");
        const result = await parseOFX(content);
        setTransactions(result.transactions);
        setParseErrors(
          result.duplicatesSkipped > 0
            ? [...result.errors, `${result.duplicatesSkipped} transação(ões) duplicada(s) ignorada(s).`]
            : result.errors
        );
        setSelected(new Set(result.transactions.map((_, i) => i)));
        setStep("preview");
        return;
      }

      setFileType("csv");
      const { headers, rows } = parseCSVRaw(content);
      setCsvHeaders(headers);
      setCsvRows(rows);
      setMapping(suggestMapping(headers, rows[0] || []));
      setStep("mapping");
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const handleApplyMapping = useCallback(() => {
    if (!mapping) return;
    const { transactions: txs, errors } = mapToTransactions(csvRows, mapping);
    setTransactions(txs);
    setParseErrors(errors);
    setSelected(new Set(txs.map((_, i) => i)));
    setStep("preview");
  }, [csvRows, mapping]);

  const handleImport = useCallback(async () => {
    if (!accountId) return;
    const selectedTxs = transactions.filter((_, i) => selected.has(i));

    await importBatch.mutateAsync({
      accountId,
      bankConnectionId: connectionId,
      transactions: selectedTxs.map((tx) => ({
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        type: tx.type,
        external_id: tx.externalId,
      })),
    });

    setStep("result");
  }, [accountId, connectionId, importBatch, selected, transactions]);

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === transactions.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(transactions.map((_, i) => i)));
  };

  if (step === "upload") {
    return (
      <ImportStepUpload
        accountId={accountId}
        setAccountId={setAccountId}
        connectionId={connectionId}
        setConnectionId={setConnectionId}
        accounts={accounts}
        connections={connections}
        onFileUpload={handleFileUpload}
      />
    );
  }

  if (step === "mapping") {
    return (
      <ImportStepMapping
        csvHeaders={csvHeaders}
        csvRows={csvRows}
        mapping={mapping}
        setMapping={setMapping}
        onBack={() => setStep("upload")}
        onApply={handleApplyMapping}
      />
    );
  }

  if (step === "preview") {
    return (
      <ImportStepPreview
        transactions={transactions}
        selected={selected}
        parseErrors={parseErrors}
        isImporting={importBatch.isPending}
        onBack={() => setStep(fileType === "ofx" ? "upload" : "mapping")}
        onToggleAll={toggleAll}
        onToggleSelect={toggleSelect}
        onImport={handleImport}
      />
    );
  }

  return (
    <ImportStepResult
      imported={importBatch.data?.imported}
      skipped={importBatch.data?.skipped}
      categorized={importBatch.data?.categorized}
      matched={importBatch.data?.matched}
      batchId={importBatch.data?.batch_id}
      onReset={() => {
        setStep("upload");
        setTransactions([]);
      }}
    />
  );
}
