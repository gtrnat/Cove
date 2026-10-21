/**
 * Google Apps Script that each user pastes into their own Google account.
 * It reads myBCA receipts from Gmail, sends them to Cove, and logs results
 * to a Google Sheet. Parsing happens on the server, so parser fixes reach
 * everyone without re-pasting the script.
 *
 * Plain ES5-style JS on purpose; no template literals so it can live in a
 * TypeScript template string without escaping.
 */
export function buildAppsScript({ appUrl, token }: { appUrl: string; token: string }) {
  const url = `${appUrl.replace(/\/+$/, "")}/api/ingest/transactions`;
  return `/**
 * Cove · myBCA email sync
 *
 * 1. Paste this into a new project at https://script.google.com
 * 2. Select "setup" in the toolbar and press Run. Approve the permissions.
 * 3. Done. It syncs every 5 minutes. Run "sync" any time to sync now.
 *
 * Keep this script private: COVE_TOKEN works like a password for adding
 * transactions to your Cove account. Revoke it in Cove > Settings > Integrations.
 */
var COVE_URL = ${JSON.stringify(url)};
var COVE_TOKEN = ${JSON.stringify(token)};

var SEARCH = 'from:bca.co.id "through myBCA"';
var BACKFILL_DAYS = 30;          // how far back the first sync looks
var OVERLAP_SECONDS = 15 * 60;   // re-check a little before the last sync (Cove ignores duplicates)
var BATCH_SIZE = 25;

function setup() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("SHEET_ID")) {
    var ss = SpreadsheetApp.create("Cove · myBCA log");
    var sheet = ss.getSheets()[0];
    sheet.appendRow(["Logged at", "Email date", "Result", "Merchant", "Amount", "Reference", "Note", "Message ID"]);
    sheet.setFrozenRows(1);
    props.setProperty("SHEET_ID", ss.getId());
  }
  if (!props.getProperty("WATERMARK")) {
    props.setProperty("WATERMARK", String(Math.floor(Date.now() / 1000) - BACKFILL_DAYS * 86400));
  }
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "sync") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("sync").timeBased().everyMinutes(5).create();

  testConnection();
  sync();
  Logger.log("Setup complete. Log sheet: " + SpreadsheetApp.openById(props.getProperty("SHEET_ID")).getUrl());
}

function testConnection() {
  post_([]);
  Logger.log("Connected to Cove.");
}

function sync() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var props = PropertiesService.getScriptProperties();
    var watermark = Number(props.getProperty("WATERMARK") || 0);
    var after = Math.max(0, watermark - OVERLAP_SECONDS);

    var messages = [];
    for (var start = 0; start < 500; start += 100) {
      var threads = GmailApp.search(SEARCH + " after:" + after, start, 100);
      threads.forEach(function (thread) {
        thread.getMessages().forEach(function (m) {
          if (m.getDate().getTime() / 1000 >= after) messages.push(m);
        });
      });
      if (threads.length < 100) break;
    }
    messages.sort(function (a, b) { return a.getDate() - b.getDate(); });

    var newest = watermark;
    for (var i = 0; i < messages.length; i += BATCH_SIZE) {
      var chunk = messages.slice(i, i + BATCH_SIZE);
      var res = post_(chunk.map(function (m) {
        return {
          messageId: m.getId(),
          receivedAt: m.getDate().toISOString(),
          subject: m.getSubject(),
          body: m.getPlainBody().slice(0, 20000)
        };
      }));
      log_(chunk, res.results || []);
      chunk.forEach(function (m) { newest = Math.max(newest, Math.floor(m.getDate().getTime() / 1000)); });
      // Only advance after Cove accepted the batch, so failures are retried next run.
      props.setProperty("WATERMARK", String(newest));
    }
  } finally {
    lock.releaseLock();
  }
}

function post_(emails) {
  var res = UrlFetchApp.fetch(COVE_URL, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + COVE_TOKEN },
    payload: JSON.stringify({ emails: emails }),
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  if (code !== 200) throw new Error("Cove responded " + code + ": " + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText());
}

function log_(chunk, results) {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty("SHEET_ID");
  if (!sheetId) return;

  // Remember what was logged so the overlap window doesn't add repeat rows.
  var logged = JSON.parse(props.getProperty("LOGGED") || "[]");
  var byId = {};
  chunk.forEach(function (m) { byId[m.getId()] = m; });

  var rows = [];
  results.forEach(function (r) {
    if (r.status === "duplicate" || logged.indexOf(r.messageId) !== -1) return;
    var m = byId[r.messageId];
    rows.push([new Date(), m ? m.getDate() : "", r.status, r.merchant || "", r.amount || "", r.reference || "", r.reason || "", r.messageId]);
    logged.push(r.messageId);
  });
  if (!rows.length) return;

  var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  props.setProperty("LOGGED", JSON.stringify(logged.slice(-300)));
}
`;
}
