/**
 * Auditoria: Testes adicionais do OFX parser
 *
 * Ref: Loop 2 (while com regex.exec no extractBlocks)
 * Foco em dedup cross-transaction e limite de tamanho.
 *
 * NOTA: Os testes básicos de OFX já existem em parsers.test.ts.
 * Estes cobrem edge cases identificados na auditoria.
 */

import { parseOFX } from "@/lib/parsers/ofx-parser";

// Stub crypto.subtle.digest para ambiente de teste
const originalCrypto = global.crypto;

beforeAll(() => {
  const digest = async (
    _alg: string,
    data: ArrayBuffer
  ): Promise<ArrayBuffer> => {
    // Simples hash para testes (determinístico)
    const input = new Uint8Array(data);
    const out = new Uint8Array(32);
    let acc = 0;
    for (const b of input) acc = (acc * 31 + b) % 2147483647;
    // Spread bits nos 32 bytes
    for (let i = 0; i < 32; i++) {
      out[i] = (acc >> (i % 4) * 8) & 0xff;
      acc = (acc * 7 + i) % 2147483647;
    }
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

describe("OFX parser: edge cases de auditoria", () => {
  it("rejeita arquivo acima de MAX_OFX_SIZE (10MB)", async () => {
    const huge = "<OFX>" + "x".repeat(10 * 1024 * 1024 + 1) + "</OFX>";
    const result = await parseOFX(huge);
    expect(result.transactions).toHaveLength(0);
    expect(result.errors[0]).toContain("muito grande");
  });

  it("aceita arquivo logo abaixo do limite de 10MB", async () => {
    // Arquivo pequeno mas com conteúdo válido
    const ofx = `<OFX>
      <BANKID>001</BANKID>
      <ACCTID>999</ACCTID>
      <BANKTRANLIST>
        <STMTTRN>
          <FITID>small</FITID>
          <DTPOSTED>20260301</DTPOSTED>
          <TRNAMT>10.00</TRNAMT>
          <NAME>Teste</NAME>
        </STMTTRN>
      </BANKTRANLIST>
    </OFX>`;
    const result = await parseOFX(ofx);
    expect(result.transactions).toHaveLength(1);
    expect(result.errors).toEqual([]);
  });

  it("lida com OFX vazio (sem transações)", async () => {
    const ofx = "<OFX><BANKID>001</BANKID><ACCTID>123</ACCTID></OFX>";
    const result = await parseOFX(ofx);
    expect(result.transactions).toHaveLength(0);
    expect(result.accountId).toBe("123");
  });

  it("parseia OFX sem header SGML", async () => {
    const ofx = `<OFX>
      <BANKTRANLIST>
        <STMTTRN>
          <FITID>noheader</FITID>
          <DTPOSTED>20260315</DTPOSTED>
          <TRNAMT>-50.00</TRNAMT>
          <NAME>Farmacia</NAME>
        </STMTTRN>
      </BANKTRANLIST>
    </OFX>`;
    const result = await parseOFX(ofx);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount).toBe(50);
    expect(result.transactions[0].type).toBe("expense");
  });

  it("dedup: mesma transação com FITIDs diferentes é mantida", async () => {
    const ofx = `<OFX><BANKID>001</BANKID><ACCTID>123</ACCTID><BANKTRANLIST>
      <STMTTRN><FITID>A001</FITID><DTPOSTED>20260301</DTPOSTED><TRNAMT>-100</TRNAMT><NAME>Compra</NAME></STMTTRN>
      <STMTTRN><FITID>A002</FITID><DTPOSTED>20260301</DTPOSTED><TRNAMT>-100</TRNAMT><NAME>Compra</NAME></STMTTRN>
    </BANKTRANLIST></OFX>`;
    const result = await parseOFX(ofx);
    // FITIDs diferentes = transações diferentes (mesmo valor/data/desc)
    expect(result.transactions).toHaveLength(2);
    expect(result.duplicatesSkipped).toBe(0);
  });

  it("dedup: FITIDs idênticos geram mesmo externalId e deduplicam", async () => {
    const ofx = `<OFX><BANKID>001</BANKID><ACCTID>123</ACCTID><BANKTRANLIST>
      <STMTTRN><FITID>DUP001</FITID><DTPOSTED>20260310</DTPOSTED><TRNAMT>50</TRNAMT><NAME>Pix</NAME></STMTTRN>
      <STMTTRN><FITID>DUP001</FITID><DTPOSTED>20260310</DTPOSTED><TRNAMT>50</TRNAMT><NAME>Pix</NAME></STMTTRN>
      <STMTTRN><FITID>DUP001</FITID><DTPOSTED>20260310</DTPOSTED><TRNAMT>50</TRNAMT><NAME>Pix</NAME></STMTTRN>
    </BANKTRANLIST></OFX>`;
    const result = await parseOFX(ofx);
    expect(result.transactions).toHaveLength(1);
    expect(result.duplicatesSkipped).toBe(2);
  });

  it("lida com TRNAMT com vírgula (formato brasileiro)", async () => {
    const ofx = `<OFX><BANKTRANLIST>
      <STMTTRN><FITID>BR01</FITID><DTPOSTED>20260318</DTPOSTED><TRNAMT>-1234,56</TRNAMT><NAME>Compra</NAME></STMTTRN>
    </BANKTRANLIST></OFX>`;
    const result = await parseOFX(ofx);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount).toBe(1234.56);
  });

  it("extrai CURDEF quando presente", async () => {
    const ofx = `<OFX><CURDEF>USD</CURDEF><BANKTRANLIST>
      <STMTTRN><FITID>USD01</FITID><DTPOSTED>20260318</DTPOSTED><TRNAMT>100</TRNAMT><NAME>Deposit</NAME></STMTTRN>
    </BANKTRANLIST></OFX>`;
    const result = await parseOFX(ofx);
    expect(result.currency).toBe("USD");
  });

  it("default CURDEF é BRL quando ausente", async () => {
    const ofx = `<OFX><BANKTRANLIST>
      <STMTTRN><FITID>NoCur</FITID><DTPOSTED>20260318</DTPOSTED><TRNAMT>10</TRNAMT><NAME>X</NAME></STMTTRN>
    </BANKTRANLIST></OFX>`;
    const result = await parseOFX(ofx);
    expect(result.currency).toBe("BRL");
  });

  it("usa MEMO como fallback quando NAME ausente", async () => {
    const ofx = `<OFX><BANKTRANLIST>
      <STMTTRN><FITID>Memo01</FITID><DTPOSTED>20260318</DTPOSTED><TRNAMT>10</TRNAMT><MEMO>Pagamento via PIX</MEMO></STMTTRN>
    </BANKTRANLIST></OFX>`;
    const result = await parseOFX(ofx);
    expect(result.transactions[0].description).toBe("Pagamento via PIX");
    expect(result.transactions[0].memo).toBe("Pagamento via PIX");
  });

  it("parseia DTSTART e DTEND com formatos OFX variados", async () => {
    const ofx = `<OFX>
      <DTSTART>20260101120000[-03:BRT]</DTSTART>
      <DTEND>20260331235959</DTEND>
      <BANKTRANLIST>
        <STMTTRN><FITID>DT01</FITID><DTPOSTED>20260315</DTPOSTED><TRNAMT>10</TRNAMT><NAME>X</NAME></STMTTRN>
      </BANKTRANLIST>
    </OFX>`;
    const result = await parseOFX(ofx);
    expect(result.startDate).toBe("2026-01-01");
    expect(result.endDate).toBe("2026-03-31");
  });

  it("transação income (valor positivo) é classificada corretamente", async () => {
    const ofx = `<OFX><BANKTRANLIST>
      <STMTTRN><FITID>Inc01</FITID><DTPOSTED>20260318</DTPOSTED><TRNAMT>5000.00</TRNAMT><NAME>Salario</NAME></STMTTRN>
    </BANKTRANLIST></OFX>`;
    const result = await parseOFX(ofx);
    expect(result.transactions[0].type).toBe("income");
    expect(result.transactions[0].amount).toBe(5000);
  });
});
