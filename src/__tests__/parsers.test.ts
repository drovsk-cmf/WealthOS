import * as XLSX from "xlsx";
import { mapToTransactions, parseCSVRaw, suggestMapping } from "@/lib/parsers/csv-parser";
import { parseOFX } from "@/lib/parsers/ofx-parser";
import { parseXLSX } from "@/lib/parsers/xlsx-parser";

describe("parsers", () => {
  describe("csv-parser", () => {
    it("parseia CSV válido com headers e linhas", () => {
      const input = "Data,Descrição,Valor\n13/03/2026,Salário,5000,00".replace(",00", ".00");
      const parsed = parseCSVRaw(input);
      expect(parsed.headers).toEqual(["Data", "Descrição", "Valor"]);
      expect(parsed.rows).toHaveLength(1);
    });

    it("retorna vazio com conteúdo insuficiente", () => {
      const parsed = parseCSVRaw("Data,Valor");
      expect(parsed.headers).toEqual([]);
      expect(parsed.rows).toEqual([]);
    });

    it("sugere mapeamento por headers", () => {
      const mapping = suggestMapping(["Data", "Descrição", "Valor"], ["13/03/2026", "Uber", "-15,00"]);
      expect(mapping).toEqual({ date: 0, amount: 2, description: 1 });
    });

    it("retorna null no suggestMapping com entrada inválida", () => {
      expect(suggestMapping(["Data"], ["13/03/2026"])) .toBeNull();
      expect(suggestMapping(["Data", "Valor"], [])).toBeNull();
    });

    it("converte linhas válidas para transações e normaliza valores", () => {
      const rows = [["13/03/2026", "Mercado", "1.234,56"], ["2026-03-14", "Pix", "-100"]];
      const result = mapToTransactions(rows, { date: 0, description: 1, amount: 2 });
      expect(result.errors).toEqual([]);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0]).toMatchObject({ date: "2026-03-13", amount: 1234.56, type: "income" });
      expect(result.transactions[1]).toMatchObject({ amount: 100, type: "expense" });
    });

    it("reporta erro para data inválida", () => {
      const result = mapToTransactions([["sem-data", "desc", "10"]], { date: 0, description: 1, amount: 2 });
      expect(result.transactions).toHaveLength(0);
      expect(result.errors[0]).toContain('data inválida');
    });

    it("reporta erro para valor inválido", () => {
      const result = mapToTransactions([["13/03/2026", "desc", "abc"]], { date: 0, description: 1, amount: 2 });
      expect(result.transactions).toHaveLength(0);
      expect(result.errors[0]).toContain('valor inválido');
    });
  });

  describe("xlsx-parser", () => {
    function workbookBuffer(data: unknown[][], sheetName = "Extrato") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      return out as ArrayBuffer;
    }

    it("parseia planilha válida", () => {
      const buffer = workbookBuffer([
        ["Data", "Descrição", "Valor"],
        ["13/03/2026", "Mercado", "100,00"],
      ]);
      const result = parseXLSX(buffer);
      expect(result.headers).toEqual(["Data", "Descrição", "Valor"]);
      expect(result.rows).toHaveLength(1);
      expect(result.activeSheet).toBe("Extrato");
    });

    it("retorna vazio para planilha sem linhas suficientes", () => {
      const buffer = workbookBuffer([["Data"]]);
      const result = parseXLSX(buffer);
      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it("respeita sheetName quando existe", () => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["A"], ["1"]]), "Aba1");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Data", "Valor"], ["13/03/2026", "50"]]), "Aba2");
      const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
      const result = parseXLSX(buffer, "Aba2");
      expect(result.activeSheet).toBe("Aba2");
      expect(result.headers).toEqual(["Data", "Valor"]);
    });

    it("faz fallback para primeira aba quando sheetName não existe", () => {
      const buffer = workbookBuffer([["Col1", "Col2"], ["x", "y"]], "Principal");
      const result = parseXLSX(buffer, "Inexistente");
      expect(result.activeSheet).toBe("Principal");
    });
  });

  describe("ofx-parser", () => {
    const originalCrypto = global.crypto;

    beforeAll(() => {
      const digest = async (_alg: string, data: ArrayBuffer): Promise<ArrayBuffer> => {
        const input = new Uint8Array(data);
        const out = new Uint8Array(32);
        let acc = 0;
        for (const b of input) acc = (acc + b) % 256;
        out[0] = acc;
        return out.buffer;
      };

      const baseCrypto = originalCrypto ?? ({} as Crypto);
      Object.defineProperty(global, "crypto", {
        value: {
          ...baseCrypto,
          subtle: { ...(baseCrypto as Crypto).subtle, digest },
        },
        configurable: true,
      });
    });

    afterAll(() => {
      Object.defineProperty(global, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });
    it("parseia OFX válido (SGML) com transações", async () => {
      const ofx = `<OFX><BANKID>001</BANKID><ACCTID>123</ACCTID><CURDEF>BRL</CURDEF><DTSTART>20260301</DTSTART><DTEND>20260331</DTEND><BANKTRANLIST><STMTTRN><FITID>1</FITID><DTPOSTED>20260305120000</DTPOSTED><TRNAMT>-10.50</TRNAMT><NAME>Padaria</NAME><MEMO>Cafe</MEMO></STMTTRN><STMTTRN><FITID>2</FITID><DTPOSTED>20260306120000</DTPOSTED><TRNAMT>100.00</TRNAMT><NAME>Salario</NAME></STMTTRN></BANKTRANLIST></OFX>`;
      const result = await parseOFX(ofx);
      expect(result.accountId).toBe("123");
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].type).toBe("expense");
      expect(result.transactions[1].type).toBe("income");
      expect(result.errors).toEqual([]);
    });

    it("descarta duplicatas dentro do mesmo arquivo", async () => {
      const ofx = `<OFX><BANKID>001</BANKID><ACCTID>123</ACCTID><BANKTRANLIST><STMTTRN><FITID>dup</FITID><DTPOSTED>20260305</DTPOSTED><TRNAMT>10</TRNAMT><NAME>A</NAME></STMTTRN><STMTTRN><FITID>dup</FITID><DTPOSTED>20260305</DTPOSTED><TRNAMT>10</TRNAMT><NAME>A</NAME></STMTTRN></BANKTRANLIST></OFX>`;
      const result = await parseOFX(ofx);
      expect(result.transactions).toHaveLength(1);
      expect(result.duplicatesSkipped).toBe(1);
    });

    it("reporta erro para transação incompleta", async () => {
      const ofx = `<OFX><STMTTRN><FITID>x<TRNAMT>10</STMTTRN></OFX>`;
      const result = await parseOFX(ofx);
      expect(result.transactions).toHaveLength(0);
      expect(result.errors.some((e) => e.includes("Transação incompleta"))).toBe(true);
    });

    it("reporta erro para valor inválido", async () => {
      const ofx = `<OFX><STMTTRN><FITID>x<DTPOSTED>20260305<TRNAMT>abc<NAME>Teste</STMTTRN></OFX>`;
      const result = await parseOFX(ofx);
      expect(result.transactions).toHaveLength(0);
      expect(result.errors.some((e) => e.includes("Valor inválido"))).toBe(true);
    });

    it("usa descrição padrão quando NAME e MEMO ausentes", async () => {
      const ofx = `<OFX><BANKTRANLIST><STMTTRN><FITID>x</FITID><DTPOSTED>20260305</DTPOSTED><TRNAMT>10</TRNAMT></STMTTRN></BANKTRANLIST></OFX>`;
      const result = await parseOFX(ofx);
      expect(result.transactions[0]?.description).toBe("Sem descrição");
    });
  });
});
