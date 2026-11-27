/**
 * DV V3.3 – SPIKE (kun test). Bundet til en TEST-Sheet med faner:
 *  Arrangementer (ÉN kilde til kalender, forside, bjælke, pop-up og frivilligopgaver): id,titel,dato,start,slut,sted,beskrivelse,ansvarlig_navn,ansvarlig_email,modtager_email,pladser,status,type,tilmelding,kraever_telefon,kraever_bemaerkning,popup,billede,skjul,testdata
 *  type: cafe|sejlads|udflugt|moede|arrangement|frivillig (frivilligopgaver er rækker med type=frivillig; pladser = antal hjælpere). popup=ja viser arrangementet i pop-up.
 *  Tilmeldinger:  id,event_id,tidspunkt,navn,email,tlf,antal,bemaerkning,status,mail_deltager,mail_ansvarlig,mail_fejl
 *  Admins:        email,rolle   (rolle = hoved | ansvarlig)
 *  Indstillinger: noegle,vaerdi  (afsender_email, afsender_navn, forening_navn) – ingen hemmeligheder
 *  Brevo API-nøglen ligger KUN i Script Properties som BREVO_API_KEY (aldrig i Sheet, kode eller GitHub).
 *  Log:           tid,admin,handling,event_id,detalje   (ingen personoplysninger)
 * Admin-login: engangskode på e-mail (ingen Google Cloud, ingen adgangskoder, ingen nøgler i koden).
 */
const TAB = { REP: 'Gentagelser', EV: 'Arrangementer', REG: 'Tilmeldinger', ADM: 'Admins', LOG: 'Log', CFG: 'Indstillinger' };
const RETENTION_DAYS = 30; // personoplysninger slettes så mange dage efter arrangementet
const SIGNUP_MAX_PER_EMAIL_HOUR = 3, SIGNUP_MAX_PER_MINUTE = 60;

/* ---------- Rene funktioner (testes lokalt) ---------- */
function validateSignup_(d, needTlf) {
  const e = [];
  const s = v => (v == null ? '' : String(v)).trim();
  const navn = s(d.navn), email = s(d.email), tlf = s(d.tlf), bem = s(d.bemaerkning);
  const antal = Number(d.antal);
  if (s(d.website)) return { honeypot: true, errors: ['spam'] };
  if (navn.length < 2 || navn.length > 100) e.push('navn');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 160) e.push('email');
  if ((needTlf || tlf) && !/^[+0-9 ()-]{8,20}$/.test(tlf)) e.push('tlf'); // telefon er valgfri, medmindre arrangementet kræver den
  if (!Number.isInteger(antal) || antal < 1 || antal > 10) e.push('antal');
  if (bem.length > 500) e.push('bemaerkning');
  return { errors: e, clean: { navn, email, tlf, antal, bemaerkning: bem } };
}
function capacity_(ev, regs, antal) {
  const st = String(ev.status || '').trim().toLowerCase() || 'aktiv'; // tom status = aktiv
  if (st !== 'aktiv') return { ok: false, reason: st === 'aflyst' ? 'aflyst' : 'fuldt' };
  const taken = regs.filter(r => r.status === 'registreret').reduce((a, r) => a + Number(r.antal || 0), 0);
  const cap = Number(ev.pladser);
  if (cap > 0 && taken + antal > cap) return { ok: false, reason: 'fuldt', free: Math.max(0, cap - taken) };
  return { ok: true, taken, free: cap > 0 ? cap - taken - antal : null };
}
function canSee_(admin, ev) {
  if (!admin) return false;
  if (admin.rolle === 'hoved') return true;
  return admin.rolle === 'ansvarlig' && String(ev.ansvarlig_email).toLowerCase() === admin.email;
}
function safe_(v) { const t = String(v == null ? '' : v); return /^[=+\-@\t\r]/.test(t) ? "'" + t : t; } // formelinjektion i Sheet
function csvCell_(v) { // beskytter mod formelinjektion i Excel
  let t = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
  return '"' + t.replace(/"/g, '""') + '"';
}

/* ---------- Sheet-hjælp ---------- */
function rows_(tab) {
  const sh = SpreadsheetApp.getActive().getSheetByName(tab);
  const v = sh.getDataRange().getValues(); const h = v.shift();
  return v.map((r, i) => { const o = { _row: i + 2 }; h.forEach((k, j) => o[k] = r[j] instanceof Date ? Utilities.formatDate(r[j], 'Europe/Copenhagen', r[j].getFullYear() < 1950 ? 'HH:mm' : 'yyyy-MM-dd') : r[j]); return o; });
}
function log_(admin, handling, eventId, detalje) { // væsentlige ændringer; aldrig personoplysninger
  try { const sh = SpreadsheetApp.getActive().getSheetByName(TAB.LOG); if (sh) sh.appendRow([new Date(), admin || '', handling, eventId || '', detalje || '']); } catch (x) {}
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- Brevo (alle automatiske mails) ---------- */
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
function cfg_(key) { try { const r = rows_(TAB.CFG).find(x => x.noegle === key); return r ? String(r.vaerdi || '').trim() : ''; } catch (x) { return ''; } }
// Returnerer { ok } eller { ok:false, fejl:'ikke_opsat' | 'HTTP 401' | 'undtagelse' }. Aldrig nøgle eller svartekst videre.
function brevoSend_(toEmail, toName, subject, text) {
  const key = PropertiesService.getScriptProperties().getProperty('BREVO_API_KEY');
  const sender = cfg_('afsender_email');
  if (!key || !sender || !toEmail) return { ok: false, fejl: 'ikke_opsat' };
  try {
    const res = UrlFetchApp.fetch(BREVO_URL, { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'api-key': key, accept: 'application/json' },
      payload: JSON.stringify({ sender: { email: sender, name: cfg_('afsender_navn') || 'Djurslands Veteraner' }, to: [{ email: toEmail, name: toName || undefined }], subject: subject, textContent: text }) });
    const code = res.getResponseCode();
    return code >= 200 && code < 300 ? { ok: true } : { ok: false, fejl: 'HTTP ' + code };
  } catch (x) { return { ok: false, fejl: 'undtagelse' }; }
}
function afmeldLink_(reg) { const base = cfg_('site_url'); return base && reg.id && reg.afmeld_token ? base.replace(/\/+$/, '') + '/#/afmeld?id=' + reg.id + '&t=' + reg.afmeld_token : ''; }
function mailDeltager_(ev, reg) {
  const link = afmeldLink_(reg);
  return brevoSend_(reg.email, reg.navn, 'Bekræftelse: ' + ev.titel,
    'Hej ' + reg.navn + '\n\nVi har registreret din tilmelding til ' + ev.titel + '.\nDato: ' + ev.dato + (ev.start ? ' kl. ' + ev.start : '') + '\nSted: ' + ev.sted + '\nAntal deltagere: ' + reg.antal + '\n\n' +
    (link ? 'Kan du alligevel ikke komme, så afmeld her (linket er personligt, del det ikke):\n' + link + '\n\n' : '') +
    'Har du spørgsmål, kontakt ' + (ev.ansvarlig_navn || 'foreningen') + '.\n\nVenlig hilsen\n' + (cfg_('forening_navn') || 'Djurslands Veteraner'));
}
function mailAfmeld_(ev, reg) {
  return brevoSend_(ev.modtager_email || ev.ansvarlig_email, ev.ansvarlig_navn, 'Afmelding: ' + ev.titel,
    'Afmelding fra ' + ev.titel + ' (' + ev.dato + ')\n\nNavn: ' + reg.navn + '\nAntal: ' + reg.antal + '\nPladserne er frigivet.');
}
function unsubscribe_(d) { // personligt link: id + hemmelig token. Intet sker ved blot at åbne linket (kræver bekræftelse på siden).
  const id = String(d.id || ''), tok = String(d.token || '');
  if (!id || tok.length < 20) return out_({ ok: false, error: 'ugyldigt_link' });
  const c = cache_(), k = 'unsub:' + Math.floor(Date.now() / 60000), n = Number(c.get(k) || 0);
  if (n >= SIGNUP_MAX_PER_MINUTE) return out_({ ok: false, error: 'for_mange' });
  c.put(k, String(n + 1), 120);
  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch (x) { return out_({ ok: false, error: 'optaget' }); }
  let reg, ev;
  try {
    reg = rows_(TAB.REG).find(r => r.id === id);
    if (!reg || !reg.afmeld_token || String(reg.afmeld_token) !== tok) return out_({ ok: false, error: 'ugyldigt_link' });
    if (reg.status === 'afmeldt') return out_({ ok: true, allerede: true });
    if (reg.status !== 'registreret') return out_({ ok: false, error: 'ugyldigt_link' });
    SpreadsheetApp.getActive().getSheetByName(TAB.REG).getRange(reg._row, 9).setValue('afmeldt');
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  ev = rows_(TAB.EV).find(x => x.id === reg.event_id);
  log_('deltager', 'afmeldt', reg.event_id, '');
  const m = ev ? mailStatus_(mailAfmeld_(ev, reg)) : ['FEJL', 'ukendt event'];
  if (m[1]) log_('system', 'mail_fejl', reg.event_id, 'afmelding ' + m[1]);
  return out_({ ok: true, titel: ev ? ev.titel : '' });
}
function mailAnsvarlig_(ev, reg) {
  return brevoSend_(ev.modtager_email || ev.ansvarlig_email, ev.ansvarlig_navn, 'Ny tilmelding: ' + ev.titel,
    'Ny tilmelding til ' + ev.titel + ' (' + ev.dato + ')\n\nNavn: ' + reg.navn + '\nAntal: ' + reg.antal + '\nTelefon: ' + reg.tlf + '\nE-mail: ' + reg.email + '\nBemærkning: ' + (reg.bemaerkning || '–'));
}
function mailStatus_(r) { return r.ok ? ['sendt', ''] : ['FEJL', r.fejl]; }

/* ---------- Admin-login: engangskode på e-mail (sendes via Brevo) ---------- */
const SESSION_SEC = 6 * 3600, CODE_SEC = 600, MAX_TRIES = 5, MAX_REQ_PER_HOUR = 5;
function cache_() { return CacheService.getScriptCache(); }
function rand_(n) { const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid() + Date.now()); let o = ''; for (let i = 0; i < n; i++) o += String((b[i] & 255) % 10); return o; }
function norm_(e) { return String(e || '').trim().toLowerCase(); }
function adminRow_(email) { const a = rows_(TAB.ADM).find(r => norm_(r.email) === email); return a ? { email, rolle: a.rolle } : null; }
function requestCode_(d) { // samme svar uanset om adressen er admin (ingen kontoopslag udefra)
  const email = norm_(d.email), c = cache_(), kk = 'req:' + email;
  const n = Number(c.get(kk) || 0);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && n < MAX_REQ_PER_HOUR && adminRow_(email)) {
    const code = rand_(8);
    c.put('code:' + email, JSON.stringify({ code, tries: 0, exp: Date.now() + CODE_SEC * 1000 }), CODE_SEC);
    c.put(kk, String(n + 1), 3600);
    const m = brevoSend_(email, '', 'Din login-kode til Djurslands Veteraner', 'Kode: ' + code + '\nGælder i 10 minutter. Har du ikke bedt om den, så ignorér mailen.');
    if (!m.ok) log_('system', 'login_mail_fejl', '', m.fejl);
  }
  return out_({ ok: true });
}
function verifyCode_(d) {
  const email = norm_(d.email), c = cache_(), raw = c.get('code:' + email);
  if (!raw) return out_({ ok: false, error: 'ikke_adgang' });
  const st = JSON.parse(raw);
  if (Date.now() > st.exp) { c.remove('code:' + email); return out_({ ok: false, error: 'ikke_adgang' }); } // fast udløb, forlænges ikke af forkerte forsøg
  if (st.tries >= MAX_TRIES) { c.remove('code:' + email); return out_({ ok: false, error: 'ikke_adgang' }); }
  if (String(d.code || '').trim() !== st.code) { st.tries++; c.put('code:' + email, JSON.stringify(st), CODE_SEC); if (st.tries === MAX_TRIES) log_(email, 'login_laast', '', ''); return out_({ ok: false, error: 'ikke_adgang' }); }
  c.remove('code:' + email);
  const a = adminRow_(email); if (!a) return out_({ ok: false, error: 'ikke_adgang' });
  log_(email, 'login', '', a.rolle);
  const tok = Utilities.getUuid() + Utilities.getUuid();
  c.put('sess:' + tok, JSON.stringify(a), SESSION_SEC);
  return out_({ ok: true, token: tok, rolle: a.rolle, udloeber_sek: SESSION_SEC });
}
function adminFromSession_(tok) {
  if (!tok || String(tok).length < 60) return null;
  const raw = cache_().get('sess:' + tok); if (!raw) return null;
  const s = JSON.parse(raw); return adminRow_(s.email); // slår op igen: fjernet admin mister adgang med det samme
}

/* ---------- Endpoints ---------- */
function doGet(e) {
  const a = (e.parameter || {}).action;
  if (a === 'events') { // KUN offentlige felter. Ingen e-mail, ingen navne. Antal tilmeldte er kun et tal.
    const taken = {}; rows_(TAB.REG).filter(r => r.status === 'registreret').forEach(r => { taken[r.event_id] = (taken[r.event_id] || 0) + Number(r.antal || 0); });
    const ja = v => String(v).toLowerCase() === 'ja' || v === true;
    return out_({ ok: true, events: rows_(TAB.EV).filter(r => !ja(r.skjul) && (!ja(r.testdata) || cfg_('vis_testdata').toLowerCase() === 'ja')).map(r => ({ id: r.id, titel: r.titel, dato: r.dato, start: r.start, slut: r.slut, sted: r.sted, beskrivelse: r.beskrivelse, ansvarlig_navn: r.ansvarlig_navn, pladser: Number(r.pladser) || 0, tilmeldte: taken[r.id] || 0, status: String(r.status || '').trim().toLowerCase() || 'aktiv', type: String(r.type || '').trim().toLowerCase(), tilmelding: ja(r.tilmelding), kraever_telefon: ja(r.kraever_telefon), kraever_bemaerkning: ja(r.kraever_bemaerkning), popup: ja(r.popup), billede: r.billede || '', testdata: ja(r.testdata) })) });
  }
  return out_({ ok: false, error: 'ukendt' });
}

function doPost(e) {
  let d; try { d = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false, error: 'ugyldig' }); }
  if (d.action === 'signup') return signup_(d);
  if (d.action === 'unsubscribe') return unsubscribe_(d);
  if (d.action === 'request_code') return requestCode_(d);
  if (d.action === 'verify_code') return verifyCode_(d);
  const admin = adminFromSession_(d.token);
  if (!admin) return out_({ ok: false, error: 'ikke_adgang' });
  const evs = rows_(TAB.EV).filter(ev => canSee_(admin, ev));
  if (d.action === 'admin_events') return out_({ ok: true, rolle: admin.rolle, events: evs.map(ev => ({ id: ev.id, titel: ev.titel, dato: ev.dato })) });
  const ev = evs.find(x => x.id === d.event_id);
  if (!ev) return out_({ ok: false, error: 'ikke_adgang' }); // samme svar som ukendt id
  const regs = rows_(TAB.REG).filter(r => r.event_id === ev.id && r.status === 'registreret');
  if (d.action === 'admin_list') {
    const taken = regs.reduce((a, r) => a + Number(r.antal), 0);
    return out_({ ok: true, total: taken, free: Number(ev.pladser) > 0 ? Number(ev.pladser) - taken : null, regs: regs.map(r => ({ id: r.id, navn: r.navn, email: r.email, tlf: r.tlf, antal: r.antal, bemaerkning: r.bemaerkning, mail_deltager: r.mail_deltager, mail_ansvarlig: r.mail_ansvarlig })) });
  }
  if (d.action === 'admin_remove') {
    const r = regs.find(x => x.id === d.reg_id); if (!r) return out_({ ok: false, error: 'ukendt' });
    SpreadsheetApp.getActive().getSheetByName(TAB.REG).getRange(r._row, 9).setValue('fjernet');
    log_(admin.email, 'fjern_tilmelding', ev.id, r.id);
    return out_({ ok: true });
  }
  if (d.action === 'admin_csv') {
    log_(admin.email, 'csv_eksport', ev.id, regs.length + ' rækker');
    const head = ['navn', 'email', 'tlf', 'antal', 'bemaerkning'];
    return out_({ ok: true, csv: '﻿' + [head.join(';')].concat(regs.map(r => head.map(k => csvCell_(r[k])).join(';'))).join('\r\n') });
  }
  return out_({ ok: false, error: 'ukendt' });
}

function signup_(d) {
  const pre = rows_(TAB.EV).find(x => x.id === d.event_id);
  const v = validateSignup_(d, !!pre && String(pre.kraever_telefon).toLowerCase() === 'ja');
  if (v.honeypot) return out_({ ok: false, error: 'afvist' });
  if (v.errors.length) return out_({ ok: false, error: 'validering', felter: v.errors });
  const c = cache_(), minK = 'sigmin:' + Math.floor(Date.now() / 60000), emK = 'sig:' + norm_(v.clean.email);
  const nm = Number(c.get(minK) || 0), ne = Number(c.get(emK) || 0);
  if (nm >= SIGNUP_MAX_PER_MINUTE || ne >= SIGNUP_MAX_PER_EMAIL_HOUR) return out_({ ok: false, error: 'for_mange' });
  c.put(minK, String(nm + 1), 120); c.put(emK, String(ne + 1), 3600);
  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch (x) { return out_({ ok: false, error: 'optaget' }); }
  let ev, row, id, token;
  try { // lås kun omkring kapacitetstjek + skrivning; mails sendes EFTER at låsen er sluppet
    ev = rows_(TAB.EV).find(x => x.id === d.event_id);
    const jaV = x => String(x).toLowerCase() === 'ja' || x === true;
    if (!ev || jaV(ev.skjul) || (String(ev.tilmelding || '').trim() !== '' && !jaV(ev.tilmelding)) || (ev.dato && String(ev.dato) < Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'yyyy-MM-dd'))) return out_({ ok: false, error: 'ukendt_event' });
    const cap = capacity_(ev, rows_(TAB.REG).filter(r => r.event_id === ev.id), v.clean.antal);
    if (!cap.ok) return out_({ ok: false, error: cap.reason, free: cap.free });
    id = Utilities.getUuid();
    const sh = SpreadsheetApp.getActive().getSheetByName(TAB.REG);
    token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    sh.appendRow([id, ev.id, new Date(), safe_(v.clean.navn), v.clean.email, safe_(v.clean.tlf), v.clean.antal, safe_(v.clean.bemaerkning), 'registreret', 'afventer', 'afventer', '', token]);
    SpreadsheetApp.flush(); // først nu er rækken skrevet
    row = sh.getLastRow();
  } finally { lock.releaseLock(); }
  const reg = Object.assign({ id, afmeld_token: token }, v.clean);
  const m1 = mailStatus_(mailDeltager_(ev, reg)), m2 = mailStatus_(mailAnsvarlig_(ev, v.clean));
  const fejl = [m1[1] && 'deltager ' + m1[1], m2[1] && 'ansvarlig ' + m2[1]].filter(Boolean).join('; ');
  SpreadsheetApp.getActive().getSheetByName(TAB.REG).getRange(row, 10, 1, 3).setValues([[m1[0], m2[0], fejl]]);
  if (fejl) log_('system', 'mail_fejl', ev.id, fejl);
  return out_({ ok: true, id, mail: fejl ? 'FEJL' : 'sendt' }); // tilmeldingen er gemt uanset mailresultat
}
function gensendFejledeMails() { // webmaster: forsøger igen for tilmeldinger hvor en mail fejlede eller hænger
  const evs = rows_(TAB.EV), sh = SpreadsheetApp.getActive().getSheetByName(TAB.REG); let n = 0, rest = 0;
  rows_(TAB.REG).forEach(r => {
    if (r.status !== 'registreret' || !r.navn) return;
    const bad = s => s === 'FEJL' || s === 'afventer';
    if (!bad(r.mail_deltager) && !bad(r.mail_ansvarlig)) return;
    const ev = evs.find(e => e.id === r.event_id); if (!ev) return;
    let a = r.mail_deltager, b = r.mail_ansvarlig, f = [];
    if (bad(a)) { const x = mailStatus_(mailDeltager_(ev, r)); a = x[0]; if (x[1]) f.push('deltager ' + x[1]); }
    if (bad(b)) { const x = mailStatus_(mailAnsvarlig_(ev, r)); b = x[0]; if (x[1]) f.push('ansvarlig ' + x[1]); }
    sh.getRange(r._row, 10, 1, 3).setValues([[a, b, f.join('; ')]]);
    if (a === 'sendt' && b === 'sendt') n++; else rest++;
  });
  log_('system', 'gensend_mails', '', n + ' ok, ' + rest + ' fejlede stadig');
  Logger.log('Gensendt OK: ' + n + ' · Stadig fejl: ' + rest);
}

/* ---------- Webmaster-funktioner (køres fra Apps Script-editoren) ---------- */
function opsaetning() { // ét klik: opretter faner + to TESTarrangementer
  const ss = SpreadsheetApp.getActive();
  const def = { [TAB.EV]: ['id','titel','dato','start','slut','sted','beskrivelse','ansvarlig_navn','ansvarlig_email','modtager_email','pladser','status','type','tilmelding','kraever_telefon','kraever_bemaerkning','popup','billede','skjul','testdata'],
    [TAB.REG]: ['id','event_id','tidspunkt','navn','email','tlf','antal','bemaerkning','status','mail_deltager','mail_ansvarlig','mail_fejl','afmeld_token'], [TAB.REP]: ['id','titel','type','sted','beskrivelse','ugedag','uge_i_maaneden','start','slut','ansvarlig_navn','ansvarlig_email','modtager_email','tilmelding','pladser','maaneder_frem','godkendt','afklares'], [TAB.ADM]: ['email','rolle'], [TAB.LOG]: ['tid','admin','handling','event_id','detalje'], [TAB.CFG]: ['noegle','vaerdi'] };
  const rep0 = def[TAB.REP]; // seed: ingen tider er godkendt endnu
  Object.keys(def).forEach(n => { let sh = ss.getSheetByName(n) || ss.insertSheet(n); if (sh.getLastRow() === 0) sh.appendRow(def[n]); });
  const rp = ss.getSheetByName(TAB.REP); // faste veterancaféer: INTET er godkendt endnu (tider/steder afklares først)
  if (rp.getLastRow() < 2) {
    rp.appendRow(['ebeltoft','Veterancafé Ebeltoft','cafe','','Veterancafé i samarbejde med Marineforeningen Ebeltoft.',1,1,'','','Foreningen','','','nej','',3,'nej','Modstridende oplysninger om tid (14.00-17.00 hos DV vs. fra 09.30 hos Marineforeningen) og sted (Strandvejen 30 vs. Marinestuen, Stockflethsvej 7)']);
    rp.appendRow(['kolind','Veterancafé Kolind','cafe','Stationsvej, 8560 Kolind','',1,1,'','','Foreningen','','','nej','',3,'nej','Tidspunkt ikke bekræftet']);
    rp.appendRow(['aalsrode','Veterancafé Ålsrode','cafe','Ålsrodevej 1, 8500 Grenaa','',1,1,'','','Foreningen','','','nej','',3,'nej','Tidspunkt ikke bekræftet']);
  }
  // Automatisk deltagerliste: vælg et arrangement i B1, så udfyldes listen af sig selv fra fanen Tilmeldinger (kun status 'registreret').
  try {
    let dl = ss.getSheetByName('Deltagerliste'); if (!dl) dl = ss.insertSheet('Deltagerliste');
    if (!dl.getRange('A1').getValue()) {
      dl.getRange('A1').setValue('Vælg arrangement (id) →');
      dl.getRange('B1').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(ss.getSheetByName(TAB.EV).getRange('A2:A1000'), true).build());
      dl.getRange('A3').setFormula('=IFERROR(QUERY(Tilmeldinger!A2:M,"select D,E,F,G,H,C where B=\'"&B1&"\' and I=\'registreret\' order by C",0),"Vælg et arrangement i B1")');
      dl.getRange('A2:F2').setValues([['Navn','E-mail','Telefon','Antal','Bemærkning','Tilmeldt']]);
      dl.getRange('A3').setNote('Listen er en formel. Rediger ikke her; ret i fanen Tilmeldinger.');
    }
  } catch (x) { Logger.log('Deltagerliste kunne ikke oprettes: ' + x); }
  const me = Session.getEffectiveUser().getEmail(), ev = ss.getSheetByName(TAB.EV);
  if (ev.getLastRow() < 2) { ev.appendRow(['test1','TEST – kapacitet 5','2027-01-15','18:00','20:00','Teststed','Kun test','Testansvarlig',me,me,5,'aktiv','arrangement','ja','','','','','','JA']);
    ev.appendRow(['test2','TEST – andet event','2027-01-16','18:00','20:00','Teststed','Kun test','Anden',me,me,5,'aktiv','arrangement','ja','','','','','','JA']); }
  const cf = ss.getSheetByName(TAB.CFG); if (cf.getLastRow() < 2) { cf.appendRow(['afsender_email','']); cf.appendRow(['afsender_navn','Djurslands Veteraner']); cf.appendRow(['forening_navn','Djurslands Veteraner']); cf.appendRow(['site_url','']); cf.appendRow(['vis_testdata','']); }
  const ad = ss.getSheetByName(TAB.ADM); if (ad.getLastRow() < 2) ad.appendRow([me, 'hoved']);
  Logger.log('Opsætning færdig. Hovedadmin: ' + me);
}
function testBrevo() { // sender en testmail til dig via Brevo; kræver BREVO_API_KEY (Script Properties) og afsender_email (fanen Indstillinger)
  const me = Session.getEffectiveUser().getEmail(), r = brevoSend_(me, 'Test', 'DV test via Brevo', 'Hvis du læser dette, virker Brevo-afsendelsen.');
  Logger.log(r.ok ? 'Brevo accepterede mailen – tjek indbakken (og spam).' : 'FEJL: ' + r.fejl + ' (ikke_opsat = nøgle eller afsender mangler; HTTP 401 = forkert nøgle; HTTP 400 = afsender ikke verificeret i Brevo)');
}
function testKonkurrence() { // 10 samtidige tilmeldinger á 1 person til test1 (pladser 5). Kræver udrullet webapp og Brevo-opsætning (sender 10 mails til dig selv).
  const url = ScriptApp.getService().getUrl(), me = Session.getEffectiveUser().getEmail(); // deltager-adresser = dig selv (+tag), så Brevo ikke sender til fremmede
  const reqs = []; for (let i = 0; i < 10; i++) reqs.push({ url, method: 'post', contentType: 'text/plain', muteHttpExceptions: true, followRedirects: true,
    payload: JSON.stringify({ action: 'signup', event_id: 'test1', navn: 'Test ' + i, email: me.replace('@', '+t' + i + '@'), tlf: '12345678', antal: 1, bemaerkning: 'TEST' }) });
  const res = UrlFetchApp.fetchAll(reqs).map(r => { try { return JSON.parse(r.getContentText()); } catch (x) { return { ok: false, error: 'svar?' }; } });
  const ok = res.filter(r => r.ok).length, fuldt = res.filter(r => r.error === 'fuldt').length;
  Logger.log('Gemt: ' + ok + ' (forventet 5) · Afvist fuldt: ' + fuldt + ' (forventet 5) · Andet: ' + (10 - ok - fuldt));
  Logger.log(ok === 5 ? 'BESTÅET' : 'FEJL – overbooking eller tabt tilmelding');
}

/* ---------- Persondata-oprydning ---------- */
function slettGamlePersondata() { // anonymiserer tilmeldinger til arrangementer ældre end RETENTION_DAYS. Kan køres manuelt eller via installerAutoRydning.
  const cutoff = Utilities.formatDate(new Date(Date.now() - RETENTION_DAYS * 86400000), 'Europe/Copenhagen', 'yyyy-MM-dd');
  const old = {}; rows_(TAB.EV).forEach(e => { if (e.dato && String(e.dato) < cutoff) old[e.id] = 1; });
  const sh = SpreadsheetApp.getActive().getSheetByName(TAB.REG); let n = 0;
  rows_(TAB.REG).forEach(r => { if (old[r.event_id] && r.status !== 'slettet') { sh.getRange(r._row, 4, 1, 5).setValues([['', '', '', r.antal, '']]); sh.getRange(r._row, 9).setValue('slettet'); n++; } });
  log_('system', 'slet_persondata', '', n + ' tilmeldinger');
  Logger.log('Anonymiseret: ' + n);
}
/* ---------- Faste arrangementer (gentagelser). Opretter KUN rækker i Arrangementer – samme ene datakilde. ---------- */
// Fane "Gentagelser": id,titel,type,sted,beskrivelse,ugedag(1=man..7=søn),uge_i_maaneden(1-4 eller 'sidste'),start,slut,ansvarlig_navn,ansvarlig_email,modtager_email,tilmelding,pladser,maaneder_frem,godkendt,afklares
// En regel bruges først, når godkendt = ja OG start er udfyldt. Står der noget i "afklares", oprettes intet.
function iso_(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
function naesteDatoer_(regel, fraIso, maanederFrem) { // ren funktion (testes lokalt)
  const wd = Number(regel.ugedag), uge = String(regel.uge_i_maaneden).toLowerCase(), out = [];
  if (!(wd >= 1 && wd <= 7)) return out;
  const f = String(fraIso).split('-').map(Number); let y = f[0], m = f[1] - 1;
  for (let k = 0; k <= Math.max(1, Number(maanederFrem) || 3); k++, m++) {
    if (m > 11) { m = 0; y++; }
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), dage = [];
    for (let d = 1; d <= dim; d++) { const w = new Date(Date.UTC(y, m, d)).getUTCDay() || 7; if (w === wd) dage.push(d); }
    const pick = uge === 'sidste' ? dage[dage.length - 1] : dage[Number(uge) - 1];
    if (pick && iso_(y, m, pick) >= fraIso) out.push(iso_(y, m, pick));
  }
  return out;
}
function genererGentagelser() { // kør manuelt eller via installerAutoGentagelse()
  const ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(TAB.EV), regler = rows_(TAB.REP);
  const idag = Utilities.formatDate(new Date(), 'Europe/Copenhagen', 'yyyy-MM-dd'), have = {}; rows_(TAB.EV).forEach(r => have[r.id] = 1);
  let nye = 0, sprunget = [];
  regler.forEach(r => {
    if (!r.id) return;
    if (String(r.godkendt).toLowerCase() !== 'ja' || !r.start || String(r.afklares || '').trim()) { sprunget.push(r.id); return; }
    naesteDatoer_(r, idag, r.maaneder_frem).forEach(dato => {
      const id = 'rep-' + r.id + '-' + dato; if (have[id]) return;
      sh.appendRow([id, r.titel, dato, r.start, r.slut, r.sted, r.beskrivelse, r.ansvarlig_navn, r.ansvarlig_email, r.modtager_email || r.ansvarlig_email, r.pladser || 0, 'aktiv', r.type || 'cafe', r.tilmelding || 'nej', '', '', '', '', '', '']);
      have[id] = 1; nye++;
    });
  });
  log_('system', 'gentagelser', '', 'nye=' + nye + ' sprunget=' + sprunget.join(','));
  return { nye, sprunget };
}
function installerAutoGentagelse() { ScriptApp.newTrigger('genererGentagelser').timeBased().everyDays(1).atHour(4).create(); }

function installerAutoRydning() { ScriptApp.newTrigger('slettGamlePersondata').timeBased().everyDays(1).atHour(3).create(); Logger.log('Daglig oprydning aktiveret'); }
