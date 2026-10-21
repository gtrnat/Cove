/*
 * Parser for myBCA transaction receipt emails.
 *
 * Deliberately dependency-free (no imports) so it runs in the app and in
 * `node --test` without a build step.
 *
 * Gmail's plain-text rendering of these emails varies: sometimes
 * "Label : value" on one line, sometimes label, ":" and value on separate
 * lines. extractFields() handles both.
 */

export type BcaKind = "qris" | "transfer" | "virtual_account" | "other";

export type ParsedBcaTransaction = {
  /** "bca:<Reference No.>", or null when the email has no reference */
  externalId: string | null;
  occurredAt: Date;
  /** Display name, title-cased */
  merchant: string;
  /** Whole rupiah actually debited (includes admin fees) */
  amount: number;
  kind: BcaKind;
  reference: string | null;
  /** Non-sensitive details only: no account numbers, PANs, or RRNs. */
  metadata: Record<string, string | number>;
};

export type BcaParseResult =
  | { ok: true; value: ParsedBcaTransaction }
  | { ok: false; reason: "not_bca_receipt" | "not_successful" | "missing_fields"; detail: string };

const LABELS = [
  "Status",
  "Transaction Date",
  "Transaction Type",
  "Transfer Type",
  "Payment to",
  "Merchant Location",
  "Acquirer",
  "Merchant PAN",
  "Terminal ID",
  "Source of Fund",
  "Source Currency",
  "Customer PAN",
  "Beneficiary Account",
  "Beneficiary Bank",
  "Beneficiary Name",
  "Transfer Currency",
  "Transfer Amount",
  "Remarks",
  "BCA Virtual Account No.",
  "Virtual Account No.",
  "Company/Product Name",
  "Name",
  "Pay Amount",
  "Admin Fee",
  "Total Payment",
  "Amount",
  "Description",
  "RRN",
  "Reference No.",
].sort((a, b) => b.length - a.length); // longest first so "Transfer Amount" wins over "Amount"

function matchLabel(line: string): string | undefined {
  const lower = line.toLowerCase();
  return LABELS.find((label) => {
    if (!lower.startsWith(label.toLowerCase())) return false;
    const next = line.charAt(label.length);
    return next === "" || /[\s:]/.test(next);
  });
}

/** Label → value. First occurrence of each label wins. */
export function extractFields(body: string): Record<string, string> {
  const lines = body
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/\u00a0/g, " ").trim())
    .filter(Boolean);

  const out: Record<string, string> = {};
  for (let i = 0; i < lines.length; i++) {
    const label = matchLabel(lines[i]);
    if (!label || label in out) continue;

    const rest = lines[i].slice(label.length);
    // "Name of the bank ..." is prose, not a field: require a colon or nothing after the label.
    if (rest.trim() !== "" && !/^\s*:/.test(rest)) continue;

    const inline = rest.replace(/^\s*:\s*/, "").trim();
    if (inline) {
      out[label] = inline;
      continue;
    }

    // Value on a following line, possibly after a lone ":" line.
    let j = i + 1;
    while (j < lines.length && lines[j] === ":") j++;
    const next = lines[j];
    if (next !== undefined && !matchLabel(next)) {
      out[label] = next.replace(/^:\s*/, "").trim();
      i = j;
    } else {
      out[label] = "";
    }
  }
  return out;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mei: 4, jun: 5, jul: 6,
  aug: 7, agu: 7, agt: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11, des: 11,
};

/** "20 Oct 2026 19:20:53" in WIB (BCA always reports Jakarta time) → UTC instant. */
export function parseBcaDate(value: string): Date | null {
  const m = value.match(/(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  const [day, year, hour, minute, second] = [m[1], m[3], m[4], m[5], m[6] ?? "0"].map(Number);
  const date = new Date(Date.UTC(year, month, day, hour - 7, minute, second));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "IDR 20,000.00" → 20000. Also accepts "Rp 20.000,00". */
export function parseAmount(value: string | undefined): number | null {
  if (!value) return null;
  const m = value.match(/\d[\d.,]*/);
  if (!m) return null;
  let s = m[0];
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Whichever separator comes last is the decimal point.
    s = lastDot > lastComma ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
  } else if (lastComma > -1) {
    s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot > -1) {
    s = /\.\d{1,2}$/.test(s) ? s : s.replace(/\./g, "");
  }
  const n = Math.round(Number.parseFloat(s));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const KEEP_UPPER = new Set(["PT", "CV", "TBK", "BCA", "BRI", "BNI", "BSI", "QRIS", "ID", "ATM", "VA"]);

/** "ELOX JUS SENTUL" → "Elox Jus Sentul" */
export function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      const bare = word.replace(/[^A-Za-z]/g, "").toUpperCase();
      if (KEEP_UPPER.has(bare)) return word.toUpperCase();
      return word.toLowerCase().replace(/(^|["'(/&-])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
    })
    .join(" ");
}

function detectKind(typeLabel: string): BcaKind {
  if (/qris/i.test(typeLabel)) return "qris";
  if (/virtual\s*account/i.test(typeLabel)) return "virtual_account";
  if (/transfer/i.test(typeLabel)) return "transfer";
  return "other";
}

/** "PT DOMPET ANAK BANGSA / GOPAY TOPUP" → "GOPAY TOPUP" */
function productName(company: string | undefined) {
  if (!company) return undefined;
  const parts = company.split("/").map((p) => p.trim()).filter(Boolean);
  return parts.at(-1);
}

const present = (v: string | undefined) => (v && v !== "-" ? v : undefined);

export function parseBcaEmail(body: string): BcaParseResult {
  const f = extractFields(body);
  const typeLabel = f["Transaction Type"] || f["Transfer Type"];
  if (!f["Transaction Date"] || !typeLabel) {
    return { ok: false, reason: "not_bca_receipt", detail: "No transaction date or type found." };
  }

  const status = f["Status"];
  if (status && !/^success/i.test(status)) {
    return { ok: false, reason: "not_successful", detail: `Status: ${status}` };
  }

  const occurredAt = parseBcaDate(f["Transaction Date"]);
  if (!occurredAt) {
    return { ok: false, reason: "missing_fields", detail: `Unreadable date: ${f["Transaction Date"]}` };
  }

  const kind = detectKind(typeLabel);
  const company = present(f["Company/Product Name"]);
  const rawMerchant =
    kind === "qris"
      ? present(f["Payment to"])
      : kind === "virtual_account"
        ? productName(company) ?? present(f["Name"])
        : kind === "transfer"
          ? present(f["Beneficiary Name"])
          : present(f["Payment to"]) ?? present(f["Beneficiary Name"]) ?? productName(company) ?? present(f["Name"]);

  const amount =
    parseAmount(f["Total Payment"]) ??
    parseAmount(f["Transfer Amount"]) ??
    parseAmount(f["Pay Amount"]) ??
    parseAmount(f["Amount"]);

  if (!rawMerchant) return { ok: false, reason: "missing_fields", detail: "No merchant or beneficiary found." };
  if (!amount) return { ok: false, reason: "missing_fields", detail: "No amount found." };

  const reference = present(f["Reference No."]) ?? null;
  const metadata: Record<string, string | number> = { bcaType: typeLabel, rawMerchant };
  const extras: [string, string | number | null | undefined][] = [
    ["location", present(f["Merchant Location"])],
    ["acquirer", present(f["Acquirer"])],
    ["remarks", present(f["Remarks"])],
    ["description", present(f["Description"])],
    ["company", company],
    ["beneficiaryBank", present(f["Beneficiary Bank"])],
    ["payAmount", parseAmount(f["Pay Amount"])],
    ["adminFee", parseAmount(f["Admin Fee"])],
  ];
  for (const [key, value] of extras) if (value !== undefined && value !== null) metadata[key] = value;

  return {
    ok: true,
    value: {
      externalId: reference ? `bca:${reference}` : null,
      occurredAt,
      merchant: titleCase(rawMerchant),
      amount,
      kind,
      reference,
      metadata,
    },
  };
}
