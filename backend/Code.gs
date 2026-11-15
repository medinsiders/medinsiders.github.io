/**
 * Medinsider submissions backend (Google Apps Script, deployed as a web app).
 *  - doPost: the site's form sends a submission. It is saved as "Pending" in a Google Sheet, auto-checked for red flags, and emailed to the owner.
 *  - doGet:  returns ONLY rows whose Status is "Approved". Contact email and notes never leave the sheet.
 * Master control: open the sheet and set the Status column to Approved / Rejected. Nothing goes live until you do.
 */
const SHEET = "Submissions";
const HEAD = ["Received", "Status", "Kind", "Name", "Organiser", "What it is", "Apply by", "Eligibility",
  "Program dates", "Benefits", "Fee", "Website", "Contact (private)", "Auto-check flags", "Your notes"];
const MAXLEN = 700;

function ss_() {
  const p = PropertiesService.getScriptProperties();
  let id = p.getProperty("SS_ID");
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create("Medinsider submissions");
  p.setProperty("SS_ID", ss.getId());
  return ss;
}

function sheet_() {
  const ss = ss_();
  let s = ss.getSheetByName(SHEET);
  if (!s) {
    s = ss.getSheets()[0].setName(SHEET);
    s.appendRow(HEAD);
    s.setFrozenRows(1);
    s.getRange("1:1").setFontWeight("bold");
    s.getRange("G:G").setNumberFormat("@");
    s.getRange("B2:B2000").setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(["Pending", "Approved", "Rejected"], true).build());
  }
  return s;
}

// Run once from the editor: creates the sheet and logs its link.
function setup() { Logger.log(sheet_().getParent().getUrl()); }

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
const clean_ = v => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, MAXLEN);

function flags_(d) {
  const f = [];
  const m = String(d.url).match(/^https?:\/\/([^\/?#:]+)/i);       // Apps Script has no URL class
  const host = m ? m[1].replace(/^www\./i, "").toLowerCase() : "";
  if (!m) f.push("Website is not a valid link");
  if (!/^https:\/\//i.test(d.url)) f.push("Website is not https");
  if (/^(bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly|rb\.gy|wa\.me|chat\.whatsapp\.com|t\.me|instagram\.com|facebook\.com|linktr\.ee|forms\.gle|docs\.google\.com)$/.test(host))
    f.push("Link is a social, chat, shortener or form page, not an official website (" + host + ")");
  if (d.fee && !/^(none|nil|no|free|0|₹0|rs\.? ?0|no fee|not applicable|n\/?a)\b/i.test(d.fee)) f.push("Asks for a fee (" + d.fee + "): confirm with the organiser");
  const txt = [d.name, d.what, d.benefits, d.fee].join(" ");
  const bad = txt.match(/guarantee|assured|100 ?%|limited seats|pay now|hurry|scopus|instant|no exam|without exam|certificate within|direct publication/ig);
  if (bad) f.push("Pressure or guarantee wording: " + [...new Set(bad.map(x => x.toLowerCase()))].join(", "));
  if (/^\d{4}-\d\d-\d\d$/.test(d.deadline)) { if (new Date(d.deadline + "T23:59:59") < new Date()) f.push("Apply-by date has already passed"); }
  else f.push("Apply-by date is not a date");
  return f.length ? f.join(" | ") : "None found (still check the official site)";
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.hp) return json_({ ok: true });                       // honeypot: bots fill this
    const kind = d.kind === "conferences" ? "conferences" : d.kind === "internships" ? "internships" : null;
    const r = { kind, name: clean_(d.name), org: clean_(d.org), what: clean_(d.what), deadline: clean_(d.deadline), who: clean_(d.who),
      dates: clean_(d.dates), benefits: clean_(d.benefits), fee: clean_(d.fee), url: clean_(d.url), contact: clean_(d.contact) };
    if (!kind || ["name", "org", "what", "deadline", "who", "dates", "benefits", "fee", "url"].some(k => !r[k])) return json_({ ok: false, error: "missing" });
    if (!/^https?:\/\//i.test(r.url)) return json_({ ok: false, error: "url" });

    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    const c = CacheService.getScriptCache(), n = Number(c.get("n") || 0);     // at most 40 submissions an hour
    if (n >= 40) { lock.releaseLock(); return json_({ ok: false, error: "busy" }); }
    c.put("n", String(n + 1), 3600);
    const flags = flags_(r);
    const sh = sheet_(), row = sh.getLastRow() + 1, tz = Session.getScriptTimeZone();
    const cells = sh.getRange(row, 1, 1, HEAD.length);
    cells.setNumberFormat("@");                                       // plain text first, or Sheets turns "Jan 2027" into a date
    cells.setValues([[Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm"), "Pending", kind, r.name, r.org, r.what, r.deadline, r.who, r.dates, r.benefits, r.fee, r.url, r.contact, flags, ""]]);
    lock.releaseLock();

    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "New Medinsider submission: " + r.name,
      "Kind: " + kind + "\nName: " + r.name + "\nOrganiser: " + r.org + "\nWebsite: " + r.url + "\nFee: " + r.fee +
      "\n\nAuto-check: " + flags + "\n\nReview and approve here:\n" + sheet_().getParent().getUrl());
    return json_({ ok: true });
  } catch (err) { return json_({ ok: false, error: "bad" }); }
}

function doGet() {
  const s = sheet_(), v = s.getDataRange().getValues().slice(1), tz = Session.getScriptTimeZone();
  const day = x => x instanceof Date ? Utilities.formatDate(x, tz, "yyyy-MM-dd") : String(x);
  return json_(v.filter(r => r[1] === "Approved").map(r =>
    ({ kind: r[2], name: r[3], org: r[4], what: r[5], deadline: day(r[6]), who: r[7], dates: r[8], benefits: r[9], fee: r[10], url: r[11] })));
}
