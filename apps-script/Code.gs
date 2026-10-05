/**
 * Thanksgiving Food Reservation → Google Sheet
 *
 * Paste this into Extensions → Apps Script of the Google Sheet that should
 * collect reservations, then Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone). See README.md for step-by-step setup.
 */

const SHEET_NAME = 'Reservations';
const HEADERS = [
  'Submitted', 'First Name', 'Last Name', 'Adults', 'Children', 'Total People',
  'Phone', 'Email', 'Browser Language', 'Reservation ID', 'Last Updated',
];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Spam trap: real visitors never see the "website" field.
  if (p.website) return json_({ ok: true });

  const first = clean_(p.firstName, 80);
  const last = clean_(p.lastName, 80);
  const adults = count_(p.adults);
  const children = count_(p.children);
  const phone = clean_(p.phone, 30);
  const email = clean_(p.email, 120);
  const id = clean_(p.id, 64);

  if (!first || !last || adults === null || children === null || !phone || !id) {
    return json_({ ok: false, error: 'Missing or invalid fields' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = sheet_();
    const now = new Date();
    const idCol = HEADERS.indexOf('Reservation ID') + 1;

    // If this reservation was already sent (the person pressed Edit), update its row.
    let row = 0;
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const match = sheet.getRange(2, idCol, lastRow - 1, 1)
        .createTextFinder(id).matchEntireCell(true).findNext();
      if (match) row = match.getRow();
    }

    const values = [
      row ? sheet.getRange(row, 1).getValue() : now,
      first, last, adults, children, adults + children,
      phone, email, clean_(p.language, 10), id, now,
    ];

    if (row) {
      sheet.getRange(row, 1, 1, values.length).setValues([values]);
    } else {
      sheet.appendRow(values);
    }
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows this, which confirms the deployment works.
function doGet() {
  return json_({ ok: true, message: 'Reservation endpoint is running.' });
}

/** Run once from the editor (or let the first submission do it) to create the header row. */
function setup() {
  sheet_();
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd h:mm am/pm');
    sheet.getRange('K:K').setNumberFormat('yyyy-mm-dd h:mm am/pm');
    sheet.getRange('G:G').setNumberFormat('@'); // keep phone numbers as text
  }
  return sheet;
}

function clean_(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  // Stop spreadsheet formula injection (=, +, -, @ at the start of a cell).
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function count_(v) {
  const s = String(v == null ? '' : v).trim();
  if (!/^\d{1,2}$/.test(s)) return null;
  const n = Number(s);
  return n <= 50 ? n : null;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
