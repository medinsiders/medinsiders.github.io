/**
 * Medinsider submissions backend (Google Apps Script, deployed as a web app).
 *  - doPost: the site's form sends a submission. It is saved as "Pending" in a Google Sheet, auto-checked for red flags, and emailed to the owner.
 *  - doGet:  returns ONLY rows whose Status is "Approved". Contact email and notes never leave the sheet.
 * Master control: open the sheet and set the Status column to Approved / Rejected. Nothing goes live until you do.
 * Research mentors (see the bottom of this file): Google sign-in, student verification, reviews and mentor applications.
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
function setup() {
  Logger.log(sheet_().getParent().getUrl());
  ["Users", "Reviews", "Mentors", "Applications"].forEach(tab_);
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === "cleanIds"))
    ScriptApp.newTrigger("cleanIds").timeBased().everyHours(1).create();
}

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
    if (d.apply) return json_(apply_(d));
    if (d.op) return json_(op_(d));
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

function doGet(e) {
  const k = e && e.parameter && e.parameter.kind;
  if (k === "version") return json_({ v: 2 });          // the site shows its own application form only when this answers
  if (k === "reviews") return json_(publicReviews_());
  if (k === "mentors") return json_(publicMentors_());
  const s = sheet_(), v = s.getDataRange().getValues().slice(1), tz = Session.getScriptTimeZone();
  const day = x => x instanceof Date ? Utilities.formatDate(x, tz, "yyyy-MM-dd") : String(x);
  return json_(v.filter(r => r[1] === "Approved").map(r =>
    ({ kind: r[2], name: r[3], org: r[4], what: r[5], deadline: day(r[6]), who: r[7], dates: r[8], benefits: r[9], fee: r[10], url: r[11] })));
}


/* ===================== Research mentors ===================== */
// Script property CLIENT_ID = the Google OAuth client ID that is also in data.js (GOOGLE_CLIENT_ID).
const TABS = {
  Users: ["Email", "Name", "Status", "College", "Year", "Method", "ID card (deleted after check)", "Received"],
  Reviews: ["Received", "Status", "Group", "Stars", "Review", "Show name", "Name", "College", "Year", "Email (private)"],
  Applications: ["Received", "Status", "Name", "Email", "College", "Year", "Role", "Why", "CV (private)"],
  Mentors: ["Received", "Status", "Group name", "What they offer", "Fee", "Website", "Person", "Role and institution", "LinkedIn", "Google Scholar", "PubMed", "Email (private)"]
};
const STATUS = { Applications: ["Pending", "Selected", "Rejected"], Users: ["Pending", "Verified", "Rejected"], Reviews: ["Pending", "Approved", "Rejected"], Mentors: ["Pending", "Approved", "Rejected"] };
const INSTITUTE = /\.(edu|ac\.in|edu\.in|ac\.uk|gov\.in|nic\.in|res\.in)$/i;

function tab_(name) {
  const ss = ss_();
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name); s.appendRow(TABS[name]); s.setFrozenRows(1); s.getRange("1:1").setFontWeight("bold");
    const col = TABS[name].indexOf("Status") + 1;
    s.getRange(2, col, 2000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS[name], true).build());
  }
  return s;
}
const rows_ = name => tab_(name).getDataRange().getValues().slice(1);
const now_ = () => Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");

// Checks the Google ID token with Google itself; returns {email, name} or null.
function who_(token) {
  const cid = PropertiesService.getScriptProperties().getProperty("CLIENT_ID") || "1064912452637-supd6rf0nq3ukojsvuc68k7bhpguf5ct.apps.googleusercontent.com";   // public identifier, not a secret
  if (!cid || !token) return null;
  const r = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  const t = JSON.parse(r.getContentText());
  if (t.aud !== cid || t.email_verified !== "true" || Number(t.exp) * 1000 < Date.now()) return null;
  return { email: String(t.email).toLowerCase(), name: clean_(t.name || t.email) };
}

function me_(u) {
  const r = rows_("Users").find(x => x[0] === u.email);
  return { ok: true, name: u.name, institutional: INSTITUTE.test(u.email), status: r ? r[2] : "None", college: r ? r[3] : "", year: r ? r[4] : "" };
}

function op_(d) {
  try {
    const u = who_(d.token);
    if (!u) return { ok: false, error: "signin" };
    if (d.op === "me") return me_(u);

    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      const c = CacheService.getScriptCache(), key = "u:" + u.email, n = Number(c.get(key) || 0);   // at most 10 actions an hour per person
      if (n >= 10) return { ok: false, error: "busy" };
      c.put(key, String(n + 1), 3600);
      const me = me_(u), owner = Session.getEffectiveUser().getEmail();

      if (d.op === "verify") {
        if (me.status === "Verified") return me;
        const college = clean_(d.college).slice(0, 120), year = clean_(d.year).slice(0, 20);
        if (!college || !year) return { ok: false, error: "missing" };
        const users = tab_("Users"), all = rows_("Users"), i = all.findIndex(x => x[0] === u.email);
        let status = "Pending", method = "ID card", file = "";
        if (me.institutional) { status = "Verified"; method = "Institute email"; }
        else {
          if (!/^image\/(jpeg|png|webp|heic)$/.test(d.idType) || !d.idData || d.idData.length > 4.2e6) return { ok: false, error: "id" };
          const folders = DriveApp.getFoldersByName("Medinsider ID cards (private)");
          const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder("Medinsider ID cards (private)");
          file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(d.idData), d.idType, u.email + " " + now_())).getUrl();
        }
        const row = [u.email, u.name, status, college, year, method, file, now_()];
        if (i >= 0) users.getRange(i + 2, 1, 1, row.length).setValues([row]); else users.appendRow(row);
        if (status === "Pending") MailApp.sendEmail(owner, "Medinsider: ID card to check", u.name + " (" + college + ", " + year + ")\n\nOpen the Users tab and set Status to Verified or Rejected:\n" + ss_().getUrl());
        return me_(u);
      }

      if (d.op === "review") {
        if (me.status !== "Verified") return { ok: false, error: "verify" };
        const stars = Number(d.stars), text = clean_(d.text).slice(0, 1500), group = clean_(d.group).slice(0, 40);
        if (!(stars >= 1 && stars <= 5 && Math.round(stars) === stars) || text.length < 30 || !group) return { ok: false, error: "missing" };
        if (rows_("Reviews").some(x => x[2] === group && x[9] === u.email && x[1] !== "Rejected")) return { ok: false, error: "dup" };
        tab_("Reviews").appendRow([now_(), "Pending", group, stars, text, d.showName ? "Yes" : "No", u.name, me.college, me.year, u.email]);
        MailApp.sendEmail(owner, "Medinsider: new review (" + stars + "★)", group + "\n\n" + text + "\n\nApprove in the Reviews tab:\n" + ss_().getUrl());
        return { ok: true };
      }

      if (d.op === "mentor") {
        const f = k => clean_(d[k]).slice(0, 500);
        const li = f("linkedin"), sc = f("scholar"), pm = f("pubmed"), site = f("site");
        if (!/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(li)) return { ok: false, error: "linkedin" };
        if (!sc && !pm) return { ok: false, error: "pubs" };
        if (sc && !/^https:\/\/scholar\.google\.[a-z.]+\//i.test(sc)) return { ok: false, error: "scholar" };
        if (pm && !/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\//i.test(pm)) return { ok: false, error: "pubmed" };
        if (!/^https?:\/\//i.test(site) || !["free", "semi", "paid"].includes(d.fee) || !f("name") || !f("person")) return { ok: false, error: "missing" };
        tab_("Mentors").appendRow([now_(), "Pending", f("name"), f("about"), d.fee, site, f("person"), f("role"), li, sc, pm, u.email]);
        MailApp.sendEmail(owner, "Medinsider: mentor group to check: " + f("name"), "LinkedIn: " + li + "\nScholar: " + sc + "\nPubMed: " + pm + "\n\nApprove in the Mentors tab:\n" + ss_().getUrl());
        return { ok: true };
      }
      return { ok: false, error: "op" };
    } finally { lock.releaseLock(); }
  } catch (err) { return { ok: false, error: "bad" }; }
}

// Public data: only Approved rows, never emails. Anonymous reviews show only college and year.
function publicReviews_() {
  const tz = Session.getScriptTimeZone();
  return rows_("Reviews").filter(r => r[1] === "Approved").map(r => ({
    group: String(r[2]), stars: Number(r[3]), text: String(r[4]),
    who: (r[5] === "Yes" ? r[6] + " · " : "") + "Verified student · " + r[7] + " · " + r[8],
    date: Utilities.formatDate(new Date(String(r[0]).replace(" ", "T")), tz, "yyyy-MM-dd") }));
}
function publicMentors_() {
  return rows_("Mentors").map((r, i) => [r, i]).filter(([r]) => r[1] === "Approved").map(([r, i]) => ({
    id: "m" + (i + 2), name: String(r[2]), about: String(r[3]), fee: String(r[4]), base: String(r[7]),
    links: [{ t: "Website", u: String(r[5]) }, { t: "Mentor's LinkedIn", u: String(r[8]) }] }));
}

// Runs every hour (setup creates the trigger): deletes the ID photo once a person is Verified or Rejected.
function cleanIds() {
  const s = tab_("Users"), v = s.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    const url = String(v[i][6]);
    if ((v[i][2] === "Verified" || v[i][2] === "Rejected") && url) {
      const id = (url.match(/[-\w]{25,}/) || [])[0];
      try { if (id) DriveApp.getFileById(id).setTrashed(true); } catch (err) {}
      s.getRange(i + 1, 7).setValue("");
    }
  }
}


/* ===================== Team applications (no sign-in) ===================== */
const ROLES = ["Tech lead", "Digital media lead", "Design lead", "Research opportunities lead", "Head, student research network",
  "Outreach and PR lead", "Speaker relations lead", "College ambassador"];
const CV_TYPES = { "application/pdf": 1, "application/msword": 1, "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 1 };

function apply_(d) {
  try {
    if (d.hp) return { ok: true };                                   // honeypot: bots fill this
    const f = (k, n) => clean_(d[k]).slice(0, n);
    const r = { name: f("name", 120), email: f("email", 160).toLowerCase(), college: f("college", 160), year: f("year", 30), role: f("role", 60), why: clean_(d.why).slice(0, 1500) };
    if (!r.name || !r.college || !r.year || r.why.length < 20) return { ok: false, error: "missing" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) return { ok: false, error: "email" };
    if (ROLES.indexOf(r.role) < 0) return { ok: false, error: "role" };
    if (!CV_TYPES[d.cvType] || !d.cvData || d.cvData.length > 4.2e6) return { ok: false, error: "cv" };   // about 3 MB

    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      const c = CacheService.getScriptCache(), n = Number(c.get("apply") || 0);                             // at most 60 applications an hour
      if (n >= 60) return { ok: false, error: "busy" };
      c.put("apply", String(n + 1), 3600);
      if (rows_("Applications").some(x => x[3] === r.email && x[6] === r.role)) return { ok: true };       // same person, same role: keep the first
      const folders = DriveApp.getFoldersByName("Medinsider applications (private)");
      const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder("Medinsider applications (private)");
      const ext = d.cvType === "application/pdf" ? ".pdf" : d.cvType === "application/msword" ? ".doc" : ".docx";
      const url = folder.createFile(Utilities.newBlob(Utilities.base64Decode(d.cvData), d.cvType, r.name.replace(/[^\w .-]/g, "") + " CV" + ext)).getUrl();
      const sh = tab_("Applications"), row = sh.getLastRow() + 1, cells = sh.getRange(row, 1, 1, 9);
      cells.setNumberFormat("@");                                                                          // plain text, so "=..." in a field is never run as a formula
      cells.setValues([[now_(), "Pending", r.name, r.email, r.college, r.year, r.role, r.why, url]]);
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "Medinsider: application for " + r.role,
        r.name + " · " + r.college + " · " + r.year + "\n\n" + r.why + "\n\nCV: " + url + "\n\nAll applications:\n" + ss_().getUrl());
      return { ok: true };
    } finally { lock.releaseLock(); }
  } catch (err) { return { ok: false, error: "bad" }; }
}
