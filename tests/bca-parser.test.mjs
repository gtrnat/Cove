// Run with: npm test   (Node strips TypeScript types natively)
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAmount, parseBcaDate, parseBcaEmail, titleCase } from "../src/features/ingest/bca-parser.ts";

const QRIS_1 = `Hello NATHANAEL GERALD WIJAYA,
You just made a transaction through myBCA.
Here are the details of your transaction :

Status\t:\tSuccessful
Transaction Date\t:\t18 Oct 2026 11:03:58
Transaction Type\t:\tQRIS Payment
Payment to\t:\tELOX JUS SENTUL
Merchant Location\t:\tBOGOR, 16128, ID
Acquirer\t:\tBRI
Merchant PAN\t:\t9360000200424005234
Terminal ID\t:\tA01
Source of Fund\t:\tTAHAPAN XPRESI - 4300****30
Customer PAN\t:\t9360001410183503829
Total Payment\t:\tIDR 12,000.00
RRN\t:\t350917886
Reference No.\t:\t9527120261018110356384QRS1344429969`;

const QRIS_2 = `Hello NATHANAEL GERALD WIJAYA,

You just made a transaction through myBCA.

Here are the details of your transaction :

Status\t:\tSuccessful

Transaction Date\t:\t17 Oct 2026 09:08:38

Transaction Type\t:\tQRIS Payment

Payment to\t:\tWAROENG "APV" HIDANGAN

Merchant Location\t:\tBOGOR, 16810, ID

Acquirer\t:\tBCA

Merchant PAN\t:\t9360001400018927335

Terminal ID\t:\tA01

Source of Fund\t:\tTAHAPAN XPRESI - 4300****30

Customer PAN\t:\t9360001410183503829

Total Payment\t:\tIDR 20,000.00

RRN\t:\t309759864

Reference No.\t:\t9527120261017090835422QRS1338089391`;

const TRANSFER = `Hi NATHANAEL GERALD WIJAYA,

You just made a transaction through myBCA.

Here are the details of your transaction :

Status\t:\tSuccessful

Transaction Date\t:\t20 Oct 2026 19:20:53

Transfer Type\t:\tTransfer to BCA Account

Source of Fund\t:\t4300xxxx30

Source Currency\t:\tIDR - Indonesian Rupiah

Beneficiary Account\t:\t7180045699

Transfer Currency\t:\tIDR - Indonesian Rupiah

Beneficiary Name\t:\tMUHAMAD REJA ROZAK

Transfer Amount\t:\tIDR 20,000.00

Remarks\t:\t-

Reference No.\t:\t9527120261020192053700TRF1632801451`;

const VA = `Hello NATHANAEL GERALD WIJAYA,

You just made a transaction through myBCA.

Here are the details of your transaction :

Status\t:\tSuccessful

Transaction Date\t:\t18 Oct 2026 13:42:56

Transfer Type\t:\tTransfer to BCA Virtual Account

Source of Fund\t:\t4300xxxx30

BCA Virtual Account No.\t:\t70001081284400050

Name\t:\tNxxxxxxxx Gxxxxx Wxxxxx

Company/Product Name\t:\tPT DOMPET ANAK BANGSA / GOPAY TOPUP

Pay Amount\t:\tIDR 15,000.00

Admin Fee\t:\tIDR 1,000.00

Total Payment\t:\tIDR 16,000.00

Description\t:\t

Reference No.\t:\t9527120261018134256860TVA9956337100`;

function ok(body) {
  const r = parseBcaEmail(body);
  assert.equal(r.ok, true, r.ok ? "" : `${r.reason}: ${r.detail}`);
  return r.value;
}

test("QRIS payment", () => {
  const v = ok(QRIS_1);
  assert.equal(v.kind, "qris");
  assert.equal(v.merchant, "Elox Jus Sentul");
  assert.equal(v.amount, 12000);
  assert.equal(v.occurredAt.toISOString(), "2026-10-18T04:03:58.000Z"); // 11:03:58 WIB
  assert.equal(v.externalId, "bca:9527120261018110356384QRS1344429969");
  assert.equal(v.metadata.location, "BOGOR, 16128, ID");
});

test("QRIS with quotes and blank lines", () => {
  const v = ok(QRIS_2);
  assert.equal(v.merchant, 'Waroeng "Apv" Hidangan');
  assert.equal(v.amount, 20000);
});

test("transfer to BCA account", () => {
  const v = ok(TRANSFER);
  assert.equal(v.kind, "transfer");
  assert.equal(v.merchant, "Muhamad Reja Rozak");
  assert.equal(v.amount, 20000);
  assert.equal(v.metadata.remarks, undefined, "'-' remarks are dropped");
  assert.equal(v.externalId, "bca:9527120261020192053700TRF1632801451");
});

test("virtual account uses total incl. admin fee and the product name", () => {
  const v = ok(VA);
  assert.equal(v.kind, "virtual_account");
  assert.equal(v.merchant, "Gopay Topup");
  assert.equal(v.amount, 16000);
  assert.equal(v.metadata.payAmount, 15000);
  assert.equal(v.metadata.adminFee, 1000);
  assert.equal(v.metadata.company, "PT DOMPET ANAK BANGSA / GOPAY TOPUP");
  assert.equal(v.metadata.description, undefined, "empty description isn't confused with the next line");
});

test("no sensitive identifiers end up in metadata", () => {
  for (const body of [QRIS_1, TRANSFER, VA]) {
    const json = JSON.stringify(ok(body).metadata);
    assert.doesNotMatch(json, /4300|9360001410183503829|7180045699|70001081284400050/);
  }
});

test("label, colon, and value on separate lines", () => {
  const split = TRANSFER.replace(/\t:\t/g, "\n:\n");
  const v = ok(split);
  assert.equal(v.merchant, "Muhamad Reja Rozak");
  assert.equal(v.amount, 20000);
});

test("Windows line endings and non-breaking spaces", () => {
  const v = ok(QRIS_1.replace(/\n/g, "\r\n").replace(/\t/g, "\u00a0"));
  assert.equal(v.amount, 12000);
});

test("failed transactions are skipped", () => {
  const r = parseBcaEmail(QRIS_1.replace("Successful", "Failed"));
  assert.equal(r.ok, false);
  assert.equal(r.reason, "not_successful");
});

test("non-receipt emails are rejected", () => {
  const r = parseBcaEmail("Hello, here is your monthly e-statement. Thank you for banking with BCA.");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "not_bca_receipt");
});

test("missing amount is reported", () => {
  const r = parseBcaEmail(QRIS_1.replace(/Total Payment.*\n/, ""));
  assert.equal(r.ok, false);
  assert.equal(r.reason, "missing_fields");
});

test("helpers", () => {
  assert.equal(parseAmount("IDR 1,250,000.00"), 1250000);
  assert.equal(parseAmount("Rp 1.250.000,00"), 1250000);
  assert.equal(parseAmount("IDR 0.00"), null);
  assert.equal(parseBcaDate("1 Jan 2027 00:30:00").toISOString(), "2026-12-31T17:30:00.000Z");
  assert.equal(parseBcaDate("not a date"), null);
  assert.equal(titleCase("PT MAJU JAYA"), "PT Maju Jaya");
});
