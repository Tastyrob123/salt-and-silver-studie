/* Studio · Salt & Silver. Das Werkzeug, mit dem die Seite gepflegt wird. Ohne Bibliothek. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ST = (n, stil = '') => `<span class="stempel" style="${stil}--m:url(/assets/logo/stempel-${n}.svg)" aria-hidden="true"></span>`;
const PF = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 11 11 3M4.5 3H11v6.5"/></svg>';
const SYM = {
  links: '<svg viewBox="0 0 14 14"><path d="m9 2-5 5 5 5"/></svg>', rechts: '<svg viewBox="0 0 14 14"><path d="m5 2 5 5-5 5"/></svg>',
  hoch: '<svg viewBox="0 0 14 14"><path d="m2.5 9 4.5-4.5L11.5 9"/></svg>', runter: '<svg viewBox="0 0 14 14"><path d="m2.5 5 4.5 4.5L11.5 5"/></svg>',
  zu: '<svg viewBox="0 0 14 14"><path d="m3 3 8 8M11 3l-8 8"/></svg>', auge: '<svg viewBox="0 0 16 14"><path d="M1 7s2.6-4.5 7-4.5S15 7 15 7s-2.6 4.5-7 4.5S1 7 1 7Z"/><circle cx="8" cy="7" r="1.9"/></svg>',
  augezu: '<svg viewBox="0 0 16 14"><path d="M1 7s2.6-4.5 7-4.5S15 7 15 7s-2.6 4.5-7 4.5S1 7 1 7Z"/><path d="m3 1 10 12"/></svg>',
  bild: '<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="m3 11 3.2-3 2.3 2 2-1.6L13 11"/></svg>',
  korb: '<svg viewBox="0 0 14 14"><path d="M2.5 4h9M5.5 4V2.5h3V4M3.5 4l.6 7.5h5.8L10.5 4"/></svg>',
  rechner: '<svg viewBox="0 0 16 14"><rect x="1.5" y="1.5" width="13" height="8.5" rx="1.4"/><path d="M5.5 12.5h5"/></svg>', handy: '<svg viewBox="0 0 14 16"><rect x="3.5" y="1.5" width="7" height="13" rx="1.6"/></svg>',
};
const NAV = [['uebersicht', 'Übersicht', 'sonne'], ['seiten', 'Seiten & Texte', 'palme'], ['karte', 'Speisekarte', 'taco'], ['haeuser', 'Häuser & Zeiten', 'pfahlbau'], ['bilder', 'Bilder', 'kaktus'], ['shop', 'Shop', 'herz'],
  null, ['stellen', 'Stellen', 'fliege'], ['fragen', 'Häufige Fragen', 'naegel'], ['lieferanten', 'Lieferanten', 'rube'], ['presse', 'Presse & Partner', 'wein'], ['hinweis', 'Hinweis für Gäste', 'chili'], ['menue', 'Menü & Seiten', 'skelett'], ['zahlen', 'Zahlen & Kurs', 'schildkroete'], ['google', 'Google & Co.', 'fledermaus'], ['sprachen', 'Sprachen', 'wein'], ['besuche', 'Besuche & Anfragen', 'wal'],
  null, ['eingang', 'Eingang', 'wal'], ['gaeste', 'Gäste im Chat', 'sonne'], ['aenderungen', 'Änderungen', 'feuer'], ['verlauf', 'Verlauf', 'kaktus2'], ['zugang', 'Zugang', 'schaedel']];
const ARTZ = { fakt: 'pfahlbau', text: 'palme', karte: 'taco', bild: 'kaktus', shop: 'herz', liste: 'rube', hinweis: 'chili', seite: 'skelett', sprache: 'wein' };
const SHOPG = { buecher: 'Bücher', wein: 'Wein & Port', kleidung: 'Kleidung', merchandise: 'Merchandise', gutscheine: 'Gutscheine' };
const sicht = $('#sicht');

// ---------------------------------------------------------------- Mitschrift für die Prüfung (studio/pruefung.html liest sie, auch wenn dieses Skript nicht mehr läuft)
const FEHLERLOG = 'sus_studio_fehler';
function merkFehler(text, wo, lex) {
  try {
    const l = JSON.parse(localStorage.getItem(FEHLERLOG) || '[]');
    l.push({ zeit: new Date().toISOString(), text: String(text).slice(0, 300), wo: String(wo || '').slice(0, 1500), lex: lex || '', ansicht: location.hash.slice(0, 80) });
    localStorage.setItem(FEHLERLOG, JSON.stringify(l.slice(-40)));
  } catch (e) { /* privates Fenster: dann eben ohne Mitschrift */ }
}
let hakte = 0;
function hakt() {
  if (Date.now() - hakte < 10000) return;
  hakte = Date.now();
  try { sag('Da hakt etwas. Die Prüfung zeigt, was los ist.', true, 'oberflaeche-fehler'); } catch (e) {}
}
addEventListener('error', ev => { merkFehler(ev.message || 'Skriptfehler', (ev.error && ev.error.stack) || `${ev.filename}:${ev.lineno}`, 'oberflaeche-fehler'); hakt(); });
addEventListener('unhandledrejection', ev => { const e = ev.reason || {}; merkFehler(e.message || String(e), e.stack || '', e.lex || 'oberflaeche-fehler'); hakt(); });
let Z = null, W = null, V = null, OFFEN = false, PROBE = false;

// ---------------------------------------------------------------- Verbindung
const fehlerMit = (text, lex) => Object.assign(new Error(text), { lex });
const LEX_STATUS = { 400: 'anfrage', 401: 'anmeldung', 403: 'anmeldung', 413: 'datei-gross', 421: 'host', 431: 'kekse-gross', 494: 'kekse-gross', 500: 'serverfehler', 502: 'server-aus', 503: 'server-aus', 504: 'langsam' };
let arbeitet = 0;
async function api(was, daten, roh) {
  const o = daten === undefined ? { cache: 'no-store' } : { method: 'POST', headers: roh ? { 'X-Studio': '1' } : { 'X-Studio': '1', 'Content-Type': 'application/json' }, body: roh ? daten : JSON.stringify(daten) };
  const post = daten !== undefined;
  if (post) document.body.classList.toggle('arbeitet', ++arbeitet > 0);  // während gespeichert wird, nimmt die Oberfläche keine zweite Aktion an (sonst rechnet sie mit einem veralteten Stand)
  let r;
  try {
    const ab = post && typeof AbortController === 'function' ? new AbortController() : null;  // eine Antwort, die nie kommt, sperrt sonst die Oberfläche
    if (ab) { o.signal = ab.signal; setTimeout(() => ab.abort(), 150000); }
    try { r = await fetch('/studio/api/' + was, o); } catch (e) {
      const zeit = e && e.name === 'AbortError';
      merkFehler(zeit ? 'Keine Antwort nach 150 Sekunden' : 'Keine Verbindung zum Studio', was, zeit ? 'langsam' : 'server-aus');
      throw fehlerMit(zeit ? 'Das Studio hat nicht geantwortet. Bitte neu laden und prüfen, ob die Änderung angekommen ist.' : 'Keine Verbindung zum Studio.', zeit ? 'langsam' : navigator.onLine === false ? 'offline' : 'server-aus');
    }
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && was !== 'status') { tor('an'); throw fehlerMit(j.fehler || 'Bitte anmelden.', 'anmeldung'); }
    if (!r.ok) {
      const lex = j.lex || LEX_STATUS[r.status] || (r.status >= 500 ? 'serverfehler' : 'unbekannt');
      if (r.status >= 500 || r.status === 400 || /^(stand-kaputt|bau-fehler|probe-voll|kekse-gross)$/.test(lex)) merkFehler(j.fehler || 'Antwort ' + r.status, was.split('?')[0] + ' → ' + r.status, lex);
      throw fehlerMit(j.fehler || (r.status === 494 || r.status === 431 ? 'Der Speicher der Probe in diesem Browser ist voll.' : r.status === 504 ? 'Das Studio hat zu lange gebraucht.' : 'Das hat nicht geklappt.'), lex);
    }
    return j;
  } finally {
    if (post) document.body.classList.toggle('arbeitet', --arbeitet > 0);
  }
}
async function aendern(a) { Z = await api('aendern', a); rand(); leiste(); return Z; }
function sag(text, fehler, lex) {
  $$('#meldung div').forEach(x => { if (x.dataset.t === text) x.remove(); });
  const d = document.createElement('div');
  d.dataset.t = text;
  d.textContent = text;
  if (fehler) d.className = 'f';
  if (fehler && lex) {  // jede Fehlermeldung führt zu ihrem Eintrag im Lexikon der Prüfung
    const a = document.createElement('a');
    a.href = '/studio/pruefung.html#lex-' + encodeURIComponent(lex);
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Was tun?';
    a.style.cssText = 'margin-left:10px;text-decoration:underline;text-underline-offset:3px;pointer-events:auto';
    d.appendChild(a);
  }
  $('#meldung').appendChild(d);
  setTimeout(() => d.remove(), fehler ? (lex ? 9000 : 5200) : 2600);
}
const mal = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;
function datum(z) {
  const d = new Date(z);
  return isNaN(d) ? '' : d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}
const bildadr = (k, g = 's') => `/assets/img/${k}-${g}.webp`;

// ---------------------------------------------------------------- Tor
function tor(art) {
  fensterZu();  // offene Fenster, Liste und Vergleich lägen sonst über der Anmeldung
  ladeZu();
  if (V) vglZu();
  $('#app').hidden = true;
  const t = $('#tor');
  t.hidden = false;
  const neu = art === 'neu';
  t.innerHTML = `<img class="tor__bild" src="/assets/img/hero-l.webp" alt="">
  <div class="tor__k">
    <div class="tor__st">${ST('sonne', 'width:100%;height:100%;')}</div>
    <h1>Salt & Silver <em>Studio.</em></h1>
    <p>${neu ? 'Lege ein Passwort fest. Damit kommst nur du an die Inhalte der Website.' : 'Hier pflegst du die Website: Karte, Zeiten, Texte und Bilder.'}</p>
    <form autocomplete="off">
      <label class="feld"><span>${neu ? 'Neues Passwort' : 'Passwort'}</span><input type="password" name="p" autocomplete="${neu ? 'new-password' : 'current-password'}" required minlength="${neu ? 10 : 1}" autofocus></label>
      ${neu ? '<label class="feld"><span>Noch einmal</span><input type="password" name="p2" autocomplete="new-password" required></label>' : ''}
      <div class="fehler" role="alert"></div>
      <button class="kn kn--breit" type="submit">${neu ? 'Passwort festlegen' : 'Öffnen'}</button>
    </form>
    ${neu ? '<p class="tor__f">Mindestens 10 Zeichen. Du kannst es später unter „Zugang“ ändern.</p>' : ''}
  </div>`;
  const f = $('form', t), fe = $('.fehler', t);
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    fe.textContent = '';
    if (neu && f.p.value !== f.p2.value) { fe.textContent = 'Die beiden Eingaben sind nicht gleich.'; return; }
    try {
      await api(neu ? 'einrichten' : 'anmelden', { passwort: f.p.value });
      t.hidden = true;
      t.innerHTML = '';
      await laden();
    } catch (e) { fe.textContent = e.message; }
  });
}

// ---------------------------------------------------------------- Rahmen
async function laden() {
  Z = await api('stand');
  $('#app').hidden = false;
  rand();
  leiste();
  zeige();
}
function rand() {
  const n = Z.aenderungen.length, teil = location.hash.split('/')[1] || 'uebersicht', an = teil === 'seite' ? 'seiten' : teil;
  $('#rand').innerHTML = `<a class="rand__marke" href="#/uebersicht"><img src="/assets/logo/wortmarke.svg" alt="Salt & Silver"><span>Studio</span></a>
  <nav aria-label="Bereiche">${NAV.map(p => p ? `<a href="#/${p[0]}" class="${an === p[0] ? 'an' : ''}">${ST(p[2])}${p[1]}${p[0] === 'aenderungen' && n ? `<b>${n}</b>` : ''}${p[0] === 'eingang' && Z.eingang_neu ? `<b>${Z.eingang_neu}</b>` : ''}</a>` : '<div class="rand__trenn"></div>').join('')}</nav>
  <div class="rand__fuss"><a href="/live/index.html" target="_blank" rel="noopener">Website ansehen ${PF}</a><a href="/studio/pruefung.html" target="_blank" rel="noopener">Prüfung ${PF}</a>${OFFEN || PROBE ? '' : '<button type="button" data-akt="abmelden">Abmelden</button>'}</div>`;
  const aktiv = $('#rand nav a.an');  // am Handy ist das Menü ein Streifen zum Wischen: den offenen Bereich ins Bild holen
  if (aktiv && innerWidth <= 860) aktiv.scrollIntoView({ block: 'nearest', inline: 'center' });
}
function kopf(titel, text, rechts = '') {
  return `<header class="kopfz"><div><h1>${titel}</h1>${text ? `<p>${text}</p>` : ''}</div><div class="kopfz__r">${rechts}</div></header>`;
}
// ---------------------------------------------------------------- Besuche & Anfragen: was Gäste auf der Website tun (Tasty Studios, 10.10.2026, Vorlage: die Hotels der Familie Maeder)
// Die Website meldet Ereignisse an /api/zahlen (online im Blob-Speicher, am Rechner in _dienste/zahlen.jsonl). Keine Kekse, keine Adressen, keine Namen.
// Beispielwerte für die Probe-Fassung (Robert 14.10.2026: «Dummy-Zahlen, damit die verstehen, was da passiert»): 30 Tage eines erfundenen,
// gewöhnlichen Monats, jedes Mal gleich (feste Folge). Am echten Studio kommen immer die echten Zahlen.
function beispielEreignisse() {
  let x = 20261014; const zz = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
  const wahl = L => { const g = L.reduce((a, b) => a + b[1], 0); let r = zz() * g; for (const [k, w] of L) { if ((r -= w) < 0) return k; } return L[0][0]; };
  const SEITEN = [['index.html', 30], ['karte.html', 17], ['restaurants.html', 13], ['hamburg.html', 8], ['crudo.html', 7], ['am-meer.html', 7], ['shop.html', 6], ['kontakt.html', 4], ['ueber.html', 3], ['jobs.html', 2], ['presse.html', 1], ['en/index.html', 2]];
  const LAND = [['DE', 86], ['CH', 3], ['AT', 3], ['NL', 2], ['DK', 2], ['GB', 1.5], ['US', 1], ['FR', 1], ['ES', .5]];
  const HAUS = [['Salt & Silver Restaurant', 48], ['Bistro Crudo', 32], ['Salt & Silver am Meer', 20]];
  const ev = [], heute = new Date(); heute.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const tag = new Date(heute.getTime() - i * 864e5), we = tag.getDay() === 5 || tag.getDay() === 6 ? 1.45 : tag.getDay() === 0 ? 1.15 : 1;
    const zeit = () => new Date(tag.getTime() + (9 + zz() * 14) * 36e5).toISOString();
    const n = Math.round((118 + zz() * 46) * we);
    for (let j = 0; j < n; j++) ev.push({ t: 'seite', s: wahl(SEITEN), l: wahl(LAND), zeit: zeit() });
    const b = Math.round(n * (0.06 + zz() * 0.02));
    for (let j = 0; j < b; j++) { ev.push({ t: 'buchen', s: 'restaurants.html', zeit: zeit() }); if (zz() < 0.78) ev.push({ t: 'tisch', p: wahl(HAUS), zeit: zeit() }); }
    if (zz() < 0.3) ev.push({ t: 'formular', f: 'gruppe', p: wahl(HAUS), zeit: zeit() });
  }
  return ev;
}
const SEITENNAME = { 'index.html': 'Startseite', 'karte.html': 'Karte', 'restaurants.html': 'Restaurants', 'hamburg.html': 'Hamburg', 'crudo.html': 'Crudo', 'am-meer.html': 'Am Meer', 'shop.html': 'Shop', 'kontakt.html': 'Kontakt & Fragen', 'ueber.html': 'Über uns', 'jobs.html': 'Jobs', 'presse.html': 'Presse & Partner', 'lieferanten.html': 'Lieferanten', 'newsletter.html': 'Newsletter', 'en/index.html': 'Startseite (Englisch)' };
async function besucheS() {
  const titel = 'Besuche <em>& Anfragen.</em>';
  sicht.innerHTML = `<div class="in">${kopf(titel, 'Was Gäste auf der Website tun: Besuche, Klicks auf «Reservieren», Tische nach Haus, Gruppenanfragen und Shop der letzten 30 Tage.')}<div class="leerbild"><b>Einen Moment.</b><p>Die Zahlen werden geladen.</p></div></div>`;
  let ev;
  if (PROBE) ev = beispielEreignisse();
  else try { const r = await fetch('/api/zahlen', { cache: 'no-store' }); if (!r.ok) throw new Error(r.status); ev = (await r.json()).ereignisse || []; }
  catch (e) { sicht.querySelector('.in').innerHTML = kopf(titel, '') + `<div class="leerbild"><b>Gerade nicht erreichbar.</b><p>Die Zahlen liegen im Speicher der Online-Fassung der Website.</p></div>`; return; }
  const n = t => ev.filter(e => e.t === t).length;
  const zaehle = (L, f) => { const m = {}; L.forEach(e => { const k = f(e); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const FORM = { gruppe: 'Anfrage ab zehn Personen' };
  const hausname = p => String(p || '').replace(/\bSalt\s+Silver\b/, 'Salt & Silver');   // die Zählung speichert ohne «&» (aus «Salt & Silver» wurde «Salt  Silver»)
  let land = k => k; try { const dn = new Intl.DisplayNames(['de-DE'], { type: 'region' }); land = k => { try { return dn.of(k); } catch (e) { return k; } }; } catch (e) {}
  const liste = (t, L, name, leer) => { const max = L.length ? L[0][1] : 1; return `<section class="zrang"><h3>${t}</h3>${L.length ? L.slice(0, 8).map(([k, v]) => `<div class="zrang__z"><span>${h(name ? name(k) : k)}</span><i style="--w:${Math.max(4, Math.round(v / max * 100))}%"></i><b>${v}</b></div>`).join('') : `<p class="zrang__leer">${leer}</p>`}</section>`; };
  const tage = []; for (let i = 13; i >= 0; i--) tage.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const proTag = tage.map(t => ev.filter(e => e.t === 'seite' && String(e.zeit).slice(0, 10) === t).length), maxT = Math.max(1, ...proTag);
  sicht.querySelector('.in').innerHTML = kopf(titel, PROBE ? '<b>Beispielwerte:</b> So sieht ein gewöhnlicher Monat aus. Im echten Studio stehen hier eure eigenen Zahlen der letzten 30 Tage, gezählt ohne Kekse und ohne Adressen.' : 'Die letzten 30 Tage. Gezählt wird ohne Kekse und ohne Adressen, Prüfläufe zählen nicht mit.') +
    `<section class="zkacheln"><div><b>${n('seite').toLocaleString('de-DE')}</b><span>Seitenaufrufe</span></div><div><b>${n('buchen').toLocaleString('de-DE')}</b><span>Klicks auf «Reservieren»</span></div><div><b>${n('tisch').toLocaleString('de-DE')}</b><span>Weiter zu OpenTable</span></div><div><b>${n('formular').toLocaleString('de-DE')}</b><span>Anfragen ab zehn Personen</span></div></section>
    <section class="zrang"><h3>Seitenaufrufe, die letzten 14 Tage</h3><div class="ztage">${proTag.map((v, i) => `<div title="${v}"><i style="--h:${Math.max(2, Math.round(v / maxT * 100))}%"></i><span>${new Date(tage[i]).getDate()}.</span></div>`).join('')}</div></section>
    <div class="zrang-raster">
    ${liste('Tische nach Haus', zaehle(ev.filter(e => e.t === 'tisch'), e => hausname(e.p)), null, 'Noch niemand weiter zu OpenTable.')}
    ${liste('Anfragen nach Haus', zaehle(ev.filter(e => e.t === 'formular'), e => hausname(e.p) || FORM[e.f] || e.f), null, 'Noch keine Anfrage über die Website.')}
    ${liste('Länder', zaehle(ev.filter(e => e.t === 'seite'), e => e.l), land, 'Noch kein Land erkannt.')}
    ${liste('Meistbesuchte Seiten', zaehle(ev.filter(e => e.t === 'seite'), e => e.s), k => SEITENNAME[k] || k, 'Noch keine Besuche.')}
    </div>`;
}
const SICHTEN = { besuche: besucheS, uebersicht, seiten, seite, karte, haeuser, bilder, shop, aenderungen: aenderungenS, verlauf, zugang, sprachen: sprachenS, stellen: () => listenAnsicht('stellen'), fragen: () => listenAnsicht('fragen'), lieferanten: () => listenAnsicht('lieferanten'),
  presse: () => listenAnsicht('presse'), zahlen: () => listenAnsicht('zahlen'), hinweis: hinweisS, menue: menueS, google: googleS, eingang: eingangS, gaeste: gaesteS };
let hier = location.hash;
function zeige(halte) {
  if (!Z) return;
  const [, name = 'uebersicht', arg] = location.hash.split('/');
  W = null;
  offen = null;
  hier = location.hash;
  if (halte !== true) sicht.scrollTop = 0;
  let roh = arg;
  try { roh = arg ? decodeURIComponent(arg) : undefined; } catch (e) { roh = undefined; }
  try { (SICHTEN[name] || uebersicht)(roh); } catch (e) {
    merkFehler(e.message, e.stack, 'oberflaeche-fehler');
    sicht.innerHTML = `<div class="in">${kopf('Hier <em>hakt es.</em>', 'Diese Ansicht ließ sich nicht aufbauen. Deine gespeicherten Inhalte sind davon nicht betroffen.')}<p class="hinweis">${Z.fehler ? h(Z.fehler) + ' ' : ''}Die Prüfung zeigt, woran es liegt, und hat für die meisten Fälle einen Knopf zur Reparatur.</p><p style="margin-top:18px"><a class="kn" href="/studio/pruefung.html">Prüfung öffnen</a> <a class="kn kn--linie" href="#/uebersicht">Zur Übersicht</a></p></div>`;
  }
  const nav = NAV.find(p => p && p[0] === (name === 'seite' ? 'seiten' : name));
  document.title = (nav ? nav[1] + ' · ' : '') + 'Studio · Salt & Silver';
  rand();
}
addEventListener('hashchange', () => {
  if (offen && offen() && location.hash !== hier) {
    const ziel = location.hash;
    history.replaceState(null, '', hier || '#/uebersicht');
    frage('Noch nicht <em>gespeichert.</em>', 'Du hast Angaben geändert und noch nicht auf „Speichern“ gedrückt. Wenn du weitergehst, gehen sie verloren.', 'Ohne Speichern weiter', async () => { offen = null; location.hash = ziel; });
    return;
  }
  if (!Z) return;  // der Stand lädt noch
  zeige();
  leiste();
});

// ---------------------------------------------------------------- Entwurfsleiste, Liste, Quittung
const HAKEN = '<svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7"/></svg>';
let letzteZahl = null, BLITZ = null, offen = null;
function vor(z) {
  const m = Math.round((Date.now() - new Date(z)) / 60000);
  return isNaN(m) ? '' : m < 1 ? 'gerade eben' : m < 60 ? `vor ${m} Min.` : m < 1440 ? `vor ${Math.round(m / 60)} Std.` : datum(z);
}
const nachZeit = () => [...Z.aenderungen].sort((a, b) => (b.zeit || '').localeCompare(a.zeit || ''));
const nachZeitE = l => [...l].sort((a, b) => (b.zeit || '').localeCompare(a.zeit || ''));
function leiste() {
  const el = $('#leiste'), n = Z.aenderungen.length, neueste = nachZeit()[0], zuletzt = Z.verlauf.find(v => !v.anfang);
  el.classList.toggle('offen', n > 0);
  el.innerHTML = n ? `<button class="leiste__l" type="button" data-akt="lade" aria-label="Liste der Änderungen zeigen"><i class="leiste__z">${n}</i><span><b>${n === 1 ? 'Änderung' : 'Änderungen'} im Entwurf</b><small>Zuletzt: ${h(neueste.satz)}${neueste.zeit ? ' · ' + vor(neueste.zeit) : ''}</small></span></button>
    <div class="leiste__r"><button class="kn kn--klein kn--linie" type="button" data-akt="lade">Liste zeigen</button><a class="kn kn--klein kn--linie" href="/entwurf/${W ? encodeURIComponent(W.datei) : 'index.html'}" target="_blank" rel="noopener">Entwurf ansehen ${PF}</a><button class="kn kn--hell" type="button" data-akt="raus">Veröffentlichen</button></div>`
    : `<div class="leiste__l"><i class="leiste__z ok">${HAKEN}</i><span><b>Alles veröffentlicht</b><small>${zuletzt ? 'Stand vom ' + datum(zuletzt.zeit) : 'Die Website zeigt den neuesten Stand.'}</small></span></div>
    <div class="leiste__r"><a class="kn kn--klein kn--linie" href="/live/index.html" target="_blank" rel="noopener">Website ansehen ${PF}</a></div>`;
  if (letzteZahl !== null && letzteZahl !== n && n) $('.leiste__z', el).classList.add('hupf');
  letzteZahl = n;
  if (!$('#lade').hidden) lade();
}
function kurzdiff(c) {
  if (c.art === 'bild') return `<span class="mini"><img src="${h(c.vorher)}" alt=""><i>→</i><img src="${h(c.nachher)}" alt=""></span>`;
  if (c.art === 'karte' || c.art === 'liste' || c.art === 'sprache') return c.punkte.slice(0, 4).map(p => `<span class="zl"><b>${h(p.name)}</b> ${h(p.text)}</span>`).join('') + (c.punkte.length > 4 ? `<span class="zl">und ${c.punkte.length - 4} weitere</span>` : '');
  if (c.art === 'shop') return c.teile.slice(0, 4).map(t => `<span class="zl">${h(t.feld)}: ${t.vorher ? `<s>${h(t.vorher)}</s> → ` : ''}<b>${h(t.nachher)}</b></span>`).join('');
  return `<span class="zl"><s>${h(c.vorher) || 'leer'}</s> → <b>${h(c.nachher) || 'leer'}</b></span>`;
}
function lade() {
  const l = $('#lade'), cs = nachZeit();
  l.hidden = false;
  l.innerHTML = `<div class="lade__k" role="dialog" aria-label="Dein Entwurf"><header><div><h2>Dein <em>Entwurf.</em></h2><p>${cs.length ? 'Gespeichert, aber noch nicht auf der Website. Erst „Veröffentlichen“ macht es für Gäste sichtbar.' : 'Nichts offen. Alles steht auf der Website.'}</p></div>
      <button class="rund" type="button" data-akt="ladezu" aria-label="Schließen">${SYM.zu}</button></header>
    <ol class="lade__l">${cs.map(c => `<li data-id="${h(c.id)}"><span class="lade__z">${ST(ARTZ[c.art])}</span><div><b>${h(c.titel)}</b><small>${h(c.ort || '')}${c.zeit ? ' · ' + vor(c.zeit) : ''}</small><p>${kurzdiff(c)}</p>
      <div class="lade__a">${c.stellen.length ? '<button class="link" type="button" data-akt="sehen">Auf der Seite ansehen</button>' : ''}<button class="link" type="button" data-akt="weg">Zurücknehmen</button></div></div></li>`).join('')}</ol>
    ${cs.length ? `<footer><button class="link" type="button" data-akt="alles">Alles zurücknehmen</button><button class="kn kn--hell" type="button" data-akt="raus">Veröffentlichen</button></footer>` : ''}</div>`;
}
function ladeZu() { const l = $('#lade'); l.hidden = true; l.innerHTML = ''; }
async function aktAenderung(akt, id, seite) {
  const c = Z.aenderungen.find(x => x.id === id), n = Z.aenderungen.length;
  try {
    if (akt === 'sehen' && c) { ladeZu(); vergleich(c, seite); }
    else if (akt === 'weg' && c) { await aendern({ art: 'verwerfen', id: c.id }); sag('Zurückgenommen: ' + c.titel); neuZeichnen(); }
    else if (akt === 'alles') frage('Alles <em>zurücknehmen?</em>', `${mal(n, 'Änderung geht', 'Änderungen gehen')} verloren. Die Website bleibt, wie sie ist.`, 'Alles zurücknehmen', async () => { await aendern({ art: 'verwerfen', id: 'alles' }); sag('Der Entwurf ist leer.'); neuZeichnen(); });
    else if (akt === 'raus') { ladeZu(); veroeffentlichen(); }
  } catch (e) { sag(e.message, true, e.lex); }
}
function quittung(titel, text, o = {}) {
  const m = $('#meldung');
  $$('.quitt', m).forEach(x => x.remove());
  const d = document.createElement('div'), c = o.id && Z.aenderungen.find(x => x.id === o.id);
  d.className = 'quitt';
  d.setAttribute('role', 'status');
  d.innerHTML = `<i>${HAKEN}</i><div><b>${h(titel)}</b>${text ? `<span>${h(text)}</span>` : ''}<small>Im Entwurf gespeichert. Auf der Website erst nach dem Veröffentlichen.</small>
    <div class="quitt__a">${c && c.stellen.length ? '<button type="button" data-q="sehen">Vorher/Nachher ansehen</button>' : ''}${o.zurueck ? '<button type="button" data-q="zurueck">Rückgängig</button>' : ''}</div></div>
    <button class="quitt__zu" type="button" data-q="zu" aria-label="Schließen">${SYM.zu}</button>`;
  d.addEventListener('click', async ev => {
    const b = ev.target.closest('[data-q]');
    if (!b) return;
    d.remove();
    if (b.dataset.q === 'sehen') { const x = Z.aenderungen.find(y => y.id === o.id); if (x) vergleich(x, o.seite); }
    if (b.dataset.q === 'zurueck') { try { await aendern(o.zurueck); sag('Rückgängig gemacht.'); neuZeichnen(); } catch (e) { sag(e.message, true, e.lex); } }
  });
  m.appendChild(d);
  setTimeout(() => d.remove(), 10000);
}
async function tun(a, q) {
  try { await aendern(a); if (q) quittung(q.titel, q.text, q); return true; } catch (e) { sag(e.message, true, e.lex); return false; }
}
function neuZeichnen() {
  if (W) return neuLaden({});
  const y = sicht.scrollTop;
  zeige(true);
  sicht.scrollTop = y;
}
const chipsH = (name, opt, wert) => `<div class="chips" data-chips="${name}">${opt.map(([v, t]) => `<button type="button" data-v="${h(v)}" class="${String(v) === String(wert) ? 'an' : ''}">${h(t)}</button>`).join('')}</div>`;
const schalter = (id, an, text) => `<label class="schalter"><input type="checkbox" id="${id}"${an ? ' checked' : ''}><i></i><span>${text}</span></label>`;
document.addEventListener('click', ev => {
  const c = ev.target.closest('.chips button');
  if (!c) return;
  $$('button', c.parentNode).forEach(x => x.classList.toggle('an', x === c));
  c.parentNode.dispatchEvent(new CustomEvent('wahl', { bubbles: true, detail: { name: c.parentNode.dataset.chips, wert: c.dataset.v } }));
});

// ---------------------------------------------------------------- Übersicht
function uebersicht() {
  const n = Z.aenderungen.length, st = new Date().getHours(), cs = nachZeit();
  const tuer = (akt, z, titel, text) => `<button class="tuer" type="button" data-los="${akt}">${ST(z)}<b>${titel}</b><span>${text}</span><i>${PF}</i></button>`;
  sicht.innerHTML = `<div class="in">${kopf(st < 11 ? 'Guten <em>Morgen.</em>' : st < 18 ? 'Guten <em>Tag.</em>' : 'Guten <em>Abend.</em>', 'Such dir aus, was du tun möchtest. Alles wird zuerst im Entwurf gespeichert. Unten siehst du jederzeit, was offen ist, und stellst es mit einem Knopf auf die Website.')}
  ${Z.fehler ? `<p class="hinweis" style="margin-bottom:14px"><b>Der Entwurf lässt sich gerade nicht bauen.</b> ${h(Z.fehler)}</p>` : ''}
  <h2 class="zw" style="margin-top:0">Was möchtest du tun?</h2>
  <div class="raster r-3">
    ${tuer('gericht', 'taco', 'Gericht hinzufügen', 'Neues Gericht, Drink oder Wein auf die Karte setzen.')}
    ${tuer('karte', 'chili', 'Preis oder Gericht ändern', 'Karte öffnen, Zeile wählen, bearbeiten.')}
    ${tuer('haeuser', 'pfahlbau', 'Öffnungszeiten ändern', 'Einmal ändern, auf jeder Seite richtig.')}
    ${tuer('produkt', 'herz', 'Produkt anlegen', 'Neues Produkt mit Preis, Text und Fotos in den Shop stellen.')}
    ${tuer('seiten', 'palme', 'Text oder Überschrift ändern', 'Seite öffnen, auf den Text klicken, schreiben.')}
    ${tuer('bilder', 'kaktus', 'Bild tauschen', 'Ein Foto ersetzen, überall wo es zu sehen ist.')}
    ${tuer('stellen', 'fliege', 'Stelle ausschreiben', 'Stellenanzeige anlegen, Bewerbungen kommen in den Eingang.')}
    ${tuer('hinweis', 'chili', 'Hinweis für Gäste', 'Betriebsferien oder Feiertage oben auf jeder Seite.')}
    ${tuer('sprachen', 'wein', 'Übersetzen', `Englisch für geänderte Texte.${Z.sprachen_offen_zahl ? ` <b>${mal(Z.sprachen_offen_zahl, 'Stück wartet', 'Stücke warten')}.</b>` : ''}`)}
    ${tuer('menue', 'skelett', 'Seite anlegen', 'Eigene Seite mit Foto, Text und Abschnitten, auf Wunsch im Menü.')}
    ${tuer('gaeste', 'sonne', 'Was Gäste im Chat fragen', 'Fragen der Woche lesen, Lücken auf der Website schließen, Anfragen beantworten lassen.')}
  </div>
  ${Z.eingang_neu ? `<a class="lage" href="#/eingang" style="margin-top:28px;display:flex"><div><h2>${Z.eingang_neu === 1 ? 'Ein neuer Eintrag <em>im Eingang.</em>' : `${Z.eingang_neu} neue Einträge <em>im Eingang.</em>`}</h2><p>${h(nachZeitE(Z.eingang).filter(x => !x.gelesen).slice(0, 3).map(x => (Z.formulare[x.formular] || x.formular) + (x.felder.name ? ' von ' + x.felder.name : '')).join(' · '))}</p></div><span class="kn kn--hell">Zum Eingang</span></a>` : ''}
  ${n ? `<h2 class="zw">Im Entwurf<span>${String(n).padStart(2, '0')}</span></h2><section class="blatt offenes">${cs.slice(0, 4).map(c => `<div class="offenes__z" data-id="${h(c.id)}"><span class="lade__z">${ST(ARTZ[c.art])}</span><div><b>${h(c.satz)}</b><small>${h(c.ort || '')}${c.zeit ? ' · ' + vor(c.zeit) : ''}</small></div>
      ${c.stellen.length ? '<button class="kn kn--klein kn--linie" type="button" data-akt="sehen">Ansehen</button>' : ''}</div>`).join('')}
      <div class="offenes__f"><button class="link" type="button" data-akt="lade">${n > 4 ? `Alle ${n} zeigen` : 'Liste öffnen'}</button><button class="kn kn--klein" type="button" data-akt="raus">Veröffentlichen</button></div></section>` : ''}
  <h2 class="zw">Die Häuser</h2>
  <div class="raster r-3">${Object.entries(Z.haeuser).map(([k, name]) => `<a class="hk" href="#/haeuser"><span class="hk__b"><img src="${bildadr(Z.hausbild[k])}" alt="" loading="lazy"></span>
    <span class="hk__t"><b>${h(name)}</b><span>${h([(Z.felder[k + '.zeit1'] || {}).wert, (Z.felder[k + '.zeit2'] || {}).wert].filter(Boolean).join(', '))}</span><i>Zeiten ändern</i></span></a>`).join('')}</div></div>`;
  sicht.querySelector('.in').addEventListener('click', ev => {
    const t = ev.target.closest('[data-los]'), s = ev.target.closest('[data-akt="sehen"]');
    if (s) return aktAenderung('sehen', s.closest('[data-id]').dataset.id);
    if (!t) return;
    const los = t.dataset.los;
    if (los === 'gericht') gerichtFenster({ haus: 'hh' });
    else if (los === 'produkt') { location.hash = '#/shop'; setTimeout(() => produktFenster(), 60); }
    else location.hash = '#/' + los;
  });
}

// ---------------------------------------------------------------- Sprachen: Englisch für geänderte Texte
function sprachenS(filter) {
  const alle = Z.sprachen_offen || [], seiten = [...new Set(alle.flatMap(o => o.seiten.map(s => s.datei)))];
  const liste = alle.filter(o => !filter || o.seiten.some(s => s.datei === filter));
  const namen = Object.fromEntries(Z.seiten.map(s => [s.datei, s.name]));
  sicht.innerHTML = `<div class="in">${kopf('Spra<em>chen.</em>', `Die Website gibt es auf Deutsch und Englisch. Was du auf Deutsch änderst oder neu anlegst, steht auf der englischen Seite zuerst auf Deutsch. Hier trägst du die Übersetzung ein. ${Z.sprachen_offen_zahl ? `<b>${mal(Z.sprachen_offen_zahl, 'Stück wartet', 'Stücke warten')}.</b>` : 'Gerade ist alles übersetzt.'}`,
      `<a class="kn kn--linie" href="/entwurf/en/index.html" target="_blank" rel="noopener">Englisch ansehen</a>`)}
    ${seiten.length > 1 ? `<div class="wahl" role="group" aria-label="Seite"><button type="button" data-f="" aria-pressed="${filter ? 'false' : 'true'}">Alle</button>${seiten.map(d => `<button type="button" data-f="${h(d)}" aria-pressed="${filter === d ? 'true' : 'false'}">${h(namen[d] || d)}</button>`).join('')}</div>` : ''}
    ${liste.length ? `<section class="blatt" style="padding:4px 0">${liste.map((o, i) => `<div class="wort" data-i="${i}" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px 24px;padding:16px 20px;border-bottom:1px solid rgba(0,0,0,.08)"><div class="wort__de"><span class="mono" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.6">Deutsch</span><p style="margin:6px 0 4px">${h(o.de)}</p><small style="opacity:.6">${o.seiten.map(s => h(s.name)).join(', ')}</small></div>
        <label class="feld"><span>Englisch <i class="marke">fehlt</i></span><textarea data-sp="en" rows="2">${h(o.en || '')}</textarea></label></div>`).join('')}
      <div class="gruppe__f" style="display:flex;align-items:center;gap:14px;padding:14px 20px"><span class="leise" style="font-size:13.5px">${liste.length} von ${Z.sprachen_offen_zahl}${Z.sprachen_offen_zahl > 600 ? ' (die ersten 600)' : ''}</span><button class="kn" type="button" data-akt="woerter-ok" style="margin-left:auto">Übersetzungen speichern</button></div></section>`
    : `<div class="leerbild">${ST('wein')}<b>Alles übersetzt.</b><p>Sobald du auf Deutsch etwas änderst, steht es hier zum Übersetzen bereit.</p></div>`}</div>`;
  const wurzel = sicht.querySelector('.in');
  offen = () => $$('.wort textarea', wurzel).some(t => t.value.trim() !== (liste[+t.closest('.wort').dataset.i].en || ''));
  wurzel.addEventListener('click', async ev => {
    const f = ev.target.closest('[data-f]'), b = ev.target.closest('[data-akt="woerter-ok"]');
    if (f) { offen = null; location.hash = '#/sprachen' + (f.dataset.f ? '/' + encodeURIComponent(f.dataset.f) : ''); return; }
    if (!b) return;
    const paare = {};
    $$('.wort', wurzel).forEach(w => { const o = liste[+w.dataset.i], t = $('textarea', w); if (t.value.trim() !== (o.en || '')) paare[o.de] = t.value.trim(); });
    const n = Object.keys(paare).length;
    if (!n) { sag('Nichts geändert, nichts gespeichert.'); return; }
    b.disabled = true;
    const ok = await tun({ art: 'woerter', sprache: 'en', paare });
    b.disabled = false;
    if (ok) { quittung(mal(n, 'Übersetzung', 'Übersetzungen') + ' gespeichert', '', { id: 'w:en' }); offen = null; neuZeichnen(); }
  });
}

// ---------------------------------------------------------------- Seiten
function seiten() {
  const gruppen = [...new Set(Z.seiten.map(s => s.gruppe))];
  sicht.innerHTML = `<div class="in">${kopf('Seiten <em>& Texte.</em>', 'Such dir eine Seite aus. Sie öffnet sich so, wie Gäste sie sehen. Ein Klick auf einen Text oder ein Bild, und du kannst es ändern.')}
  ${gruppen.map(g => `<h2 class="zw">${g}<span>${String(Z.seiten.filter(s => s.gruppe === g).length).padStart(2, '0')}</span></h2><div class="raster r-4">${Z.seiten.filter(s => s.gruppe === g).map(s =>
    `<a class="sk" href="#/seite/${encodeURIComponent(s.datei)}"><span class="sk__b">${s.bild ? `<img src="${bildadr(s.bild)}" alt="" loading="lazy">` : ''}</span><span class="sk__t"><b>${h(s.name)}</b><span>${mal(s.texte, 'Text', 'Texte')} · ${mal(s.bilder, 'Bild', 'Bilder')}</span></span></a>`).join('')}</div>`).join('')}</div>`;
}

// ---------------------------------------------------------------- Seite bearbeiten
const RSTIL = `.vorhang{display:none!important}
.studio-hov,.studio-an{position:absolute;z-index:2147483000;pointer-events:none;border-radius:5px;display:none;box-sizing:border-box}
.studio-hov{outline:calc(1.5px*var(--studio-k,1)) dashed #ff3132;outline-offset:calc(4px*var(--studio-k,1))}
.studio-hov::before{content:attr(data-w);position:absolute;left:-4px;bottom:calc(100% + 9px*var(--studio-k,1));background:#ff3132;color:#fff;font:500 10px/1 'DM Mono',ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;padding:6px 8px;border-radius:5px;white-space:nowrap;transform:scale(var(--studio-k,1));transform-origin:0 100%}
.studio-hov[data-w=""]::before{display:none}
.studio-an{outline:calc(2px*var(--studio-k,1)) solid #ff3132;outline-offset:calc(4px*var(--studio-k,1));background:rgba(255,49,50,.07)}
.studio-werk [data-e]{cursor:text}.studio-werk img[data-b]{cursor:pointer;pointer-events:auto!important}`;
function richte(d, werk) {
  if (!d.getElementById('studio-stil')) {
    const s = d.createElement('style');
    s.id = 'studio-stil';
    s.textContent = RSTIL;
    d.head.appendChild(s);
  }
  if (werk) d.documentElement.classList.add('studio-werk');
  const k = c => { const b = d.createElement('div'); b.className = c; d.body.appendChild(b); return b; };
  return { hov: k('studio-hov'), an: k('studio-an') };
}
function rahme(box, el, wort) {
  if (!box) return;
  const r = el && el.isConnected ? el.getBoundingClientRect() : null;
  if (!r || (!r.width && !r.height)) { box.style.display = 'none'; return false; }
  const d = el.ownerDocument, w = d.defaultView, wirt = el.closest('dialog') || d.body;
  if (box.parentNode !== wirt) wirt.appendChild(box);
  let x = r.left + w.scrollX, y = r.top + w.scrollY;
  if (wirt !== d.body) { const wr = wirt.getBoundingClientRect(); x = r.left - wr.left + wirt.scrollLeft - wirt.clientLeft; y = r.top - wr.top + wirt.scrollTop - wirt.clientTop; }
  Object.assign(box.style, { display: 'block', left: x + 'px', top: y + 'px', width: r.width + 'px', height: r.height + 'px' });
  box.dataset.w = wort || '';
  return true;
}
function passe(fr, wirt, soll) {
  const tu = () => {
    if (wirt.classList.contains('handy')) { fr.style.cssText = ''; try { fr.contentDocument.documentElement.style.setProperty('--studio-k', '1'); } catch (e) {} return; }
    const w = wirt.clientWidth, hoch = wirt.clientHeight;
    if (!w) return;
    const k = Math.min(1, w / soll);
    fr.style.cssText = `position:absolute;left:0;top:0;width:${k < 1 ? soll : w}px;height:${hoch / k}px;transform-origin:0 0;transform:${k < 1 ? `scale(${k})` : 'none'}`;
    try { fr.contentDocument.documentElement.style.setProperty('--studio-k', (1 / k).toFixed(3)); } catch (e) {}
  };
  fr.addEventListener('load', tu);
  new ResizeObserver(tu).observe(wirt);
  tu();
  return tu;
}
function zeig(el) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (p.classList.contains('tabfeld') && p.hidden) {
      [...p.parentElement.children].forEach(c => { if (c.classList.contains('tabfeld')) c.hidden = c !== p; });
      $$('[aria-controls]', p.ownerDocument).forEach(t => t.setAttribute('aria-selected', t.getAttribute('aria-controls') === p.id ? 'true' : 'false'));
    } else if (p.hidden) p.hidden = false;
    if (p.classList.contains('gang') && !p.classList.contains('an')) {
      [...p.parentElement.children].forEach(c => { if (c.classList.contains('gang')) c.classList.toggle('an', c === p); });
      const g = p.closest('.gruppe');
      if (g) $$('[data-gang]', g).forEach(b => b.classList.toggle('an', b.getAttribute('data-gang') === p.id));
    }
    if (p.tagName === 'DIALOG' && !p.open) { try { p.showModal(); } catch (e) { p.setAttribute('open', ''); } }
    if (p.tagName === 'DETAILS') p.open = true;
  }
}
function ziel(d, x, y) {
  const els = d.elementsFromPoint(x, y).filter(e => !/^studio-/.test(e.className));
  if (!els.length) return null;
  let t = els[0].closest('[data-e]') || els.slice(0, 5).find(e => e.matches('[data-e]'));
  const b = els.find(e => e.matches('img[data-b]'));
  if (!t && b) {
    const karte = b.closest('.gk');
    const name = karte && karte.querySelector('[data-q^="k:"]');
    if (name) t = name; else return { art: 'bild', el: b, wort: 'Bild tauschen' };
  }
  if (!t) return null;
  const q = (t.dataset.q || '').split(' ').filter(Boolean), rein = t.hasAttribute('data-rein');
  if (rein && q[0].startsWith('k:')) return { art: 'gericht', el: t, q, wort: 'Auf der Karte ändern' };
  if (rein && q[0].startsWith('l:')) return { art: 'liste', el: t, q, wort: 'Eintrag bearbeiten' };
  if (rein && q[0].startsWith('seite:')) return { art: 'eigene', el: t, q, wort: 'Seite bearbeiten' };
  if (rein && q[0].startsWith('hinweis.')) return { art: 'hinweis', el: t, q, wort: 'Hinweis bearbeiten' };
  if (rein) return { art: 'angabe', el: t, q, wort: 'Angabe ändern' };
  return { art: 'text', el: t, q, wort: 'Text ändern' };
}
function seite(datei) {
  const s = Z.seiten.find(x => x.datei === datei) || Z.seiten[0];
  const gruppen = [...new Set(Z.seiten.map(x => x.gruppe))];
  sicht.innerHTML = `<div class="werk">
    <div class="werk__leiste">
      <a class="rund" href="#/seiten" title="Zurück zu den Seiten" aria-label="Zurück zu den Seiten">${SYM.links}</a>
      <select id="w-seite" aria-label="Seite">${gruppen.map(g => `<optgroup label="${g}">${Z.seiten.filter(x => x.gruppe === g).map(x => `<option value="${h(x.datei)}"${x.datei === s.datei ? ' selected' : ''}>${h(x.name)}</option>`).join('')}</optgroup>`).join('')}</select>
      <button class="rund an" type="button" data-akt="geraet" data-g="rechner" title="Wie am Rechner" aria-label="Wie am Rechner">${SYM.rechner}</button>
      <button class="rund" type="button" data-akt="geraet" data-g="handy" title="Wie am Handy" aria-label="Wie am Handy">${SYM.handy}</button>
      <span class="werk__hin">Klick in der Seite auf einen Text oder ein Bild. Rechts änderst du es und bestätigst mit „Übernehmen“.</span>
    </div>
    <div class="werk__buehne" id="w-buehne"><iframe id="w-rahmen" title="${h(s.name)}" src="/entwurf/${encodeURIComponent(s.datei)}?nomotion"></iframe></div>
    <aside class="pruef" id="w-pruef" aria-live="polite"></aside>
  </div>`;
  W = { datei: s.datei, fr: $('#w-rahmen'), sel: null, y: 0, wieder: null };
  W.passe = passe(W.fr, $('#w-buehne'), 1200);
  W.fr.addEventListener('load', werkBereit);
  $('#w-seite').addEventListener('change', ev => { location.hash = '#/seite/' + encodeURIComponent(ev.target.value); });
  pruefLeer();
}
function werkBereit() {
  if (!W) return;
  const d = W.fr.contentDocument;
  if (!d || !d.body) return;
  const w = d.defaultView;
  Object.assign(W, richte(d, true), { sel: null });
  d.addEventListener('mousemove', ev => { const t = ziel(d, ev.clientX, ev.clientY); rahme(W.hov, t && (!W.sel || t.el !== W.sel.el) ? t.el : null, t && t.wort); }, true);
  d.documentElement.addEventListener('mouseleave', () => W && rahme(W.hov, null));
  d.addEventListener('click', ev => {
    if (ev.target.closest && ev.target.closest('a[href]')) ev.preventDefault();
    const t = ziel(d, ev.clientX, ev.clientY);
    if (t) waehle(t);
  }, true);
  d.addEventListener('submit', ev => ev.preventDefault(), true);
  const nach = () => { if (W && W.sel) rahme(W.an, W.sel.el); };
  w.addEventListener('scroll', nach, { passive: true, capture: true });
  w.addEventListener('resize', nach);
  if (W.wieder) {
    const m = W.wieder, el = m.q ? d.querySelector(`[data-q="${m.q}"]`) : m.b ? d.querySelector(`img[data-b="${m.b}"][data-bn="${m.n}"]`) : d.querySelector(`[data-e="${m.e}"][data-en="${m.n}"]`);
    W.wieder = null;
    if (el) {
      zeig(el);
      el.scrollIntoView({ block: 'center', inline: 'center' });
      setTimeout(() => { if (W && el.isConnected) waehle(el.matches('img') ? { art: 'bild', el } : zielVon(el)); }, 150);
      return;
    }
    w.scrollTo(0, W.y);
  }
  pruefLeer();
}
function zielVon(el) {
  const q = (el.dataset.q || '').split(' ').filter(Boolean), rein = el.hasAttribute('data-rein');
  return { art: rein && q[0].startsWith('k:') ? 'gericht' : rein && q[0].startsWith('l:') ? 'liste' : rein && q[0].startsWith('seite:') ? 'eigene' : rein && q[0].startsWith('hinweis.') ? 'hinweis' : rein ? 'angabe' : 'text', el, q };
}
function neuLaden(merk) {
  if (!W) return;
  const w = W.fr.contentWindow;
  W.y = w.scrollY;
  W.wieder = merk || {};
  w.location.reload();
}
function pruefLeer() {
  if (!W) return;
  W.sel = null;
  rahme(W.an, null);
  const hier = Z.aenderungen.filter(c => c.stellen.some(x => x.seite === W.datei));
  $('#w-pruef').innerHTML = `<div class="pruef__leer">${ST('palme')}<b>Klick in die Seite.</b><p>Alles, was rot umrandet wird, kannst du ändern.</p>
    <ul><li><b>Text</b>Überschriften, Absätze, Knöpfe</li><li><b>Bild</b>Foto tauschen</li><li><b>Angabe</b>Öffnungszeiten, Adressen, Preise</li></ul></div>
    ${hier.length ? `<div class="pruef__offen"><h3>Auf dieser Seite im Entwurf</h3>${hier.slice(0, 6).map(c => `<button type="button" data-id="${h(c.id)}"><b>${h(c.satz)}</b><small>Vorher/Nachher ansehen</small></button>`).join('')}</div>` : ''}`;
  $$('.pruef__offen button').forEach(b => b.addEventListener('click', () => aktAenderung('sehen', b.dataset.id, W.datei)));
}
function waehle(t) {
  if (W.sel && W.sel.orig !== undefined && W.sel.el.isConnected && !W.sel.fertig) {
    const box = $('#w-schreib');
    if (box && rein(box.innerHTML) !== rein(W.sel.orig)) sag('Nicht übernommen: Der Text ist wieder wie vorher. Zum Behalten vor dem Weiterklicken „Übernehmen“ drücken.', true);  // sonst verschwindet Getipptes still
    spiegel(W.sel, W.sel.orig);
  }
  W.sel = t;
  rahme(W.hov, null);
  rahme(W.an, t.el);
  ({ text: pruefText, angabe: pruefAngabe, gericht: pruefGericht, bild: pruefBild, liste: t => { const [, key, i] = t.q[0].split(':'); pruefLeer(); listeFenster(key, +i); }, eigene: t => { pruefLeer(); seiteFenster(t.q[0].split(':')[1]); }, hinweis: () => { location.hash = '#/hinweis'; } })[t.art](t);
}
const woSteht = (n, s) => n > 1 ? `Steht an <b>${n} Stellen</b>${s > 1 ? ` auf <b>${s} Seiten</b>` : ''}.` : '';
function spiegel(t, html) {
  const d = t.el.ownerDocument, alle = t.ueberall ? $$(`[data-e="${t.el.dataset.e}"]:not([data-rein])`, d) : [t.el];
  alle.forEach(e => { e.innerHTML = html; });
  $$(`[data-spiegel] [data-e="${t.el.dataset.e}"][data-en="${t.el.dataset.en}"]`, d).forEach(e => { e.innerHTML = html; });  // unsichtbare Kopien (Schatten des Starttitels) folgen sofort mit
  rahme(W.an, t.el);
}
function rein(html) {
  return html.replace(/<div[^>]*>|<p[^>]*>/gi, '<br>').replace(/<\/(div|p)>/gi, '').replace(/\r?\n/g, '<br>').replace(/^(<br>)+/, '').replace(/&nbsp;/g, ' ');  // Enter schreibt im Feld einen Zeilenwechsel, auf der Seite wird daraus ein Umbruch
}
function pruefText(t) {
  const el = t.el, hs = el.dataset.e, n = +el.dataset.en, lauf = el.hasAttribute('data-lauf'), m = Z.mehrfach[hs];
  const tag = el.closest('h1,h2,h3,h4,.d1,.d2,.d3') ? 'Überschrift' : el.closest('a,button') ? 'Knopf oder Link' : 'Text';
  const link = el.closest('a[href]'), intern = link && /^[\w\-]+\.html/.test(link.getAttribute('href') || '') ? link.getAttribute('href').split('#')[0] : null;
  t.orig = el.innerHTML;
  t.ueberall = !!m;
  const angaben = t.q.filter(q => !q.startsWith('k:')).map(q => Z.felder[q]).filter(Boolean);
  $('#w-pruef').innerHTML = `<h2>${tag}</h2>
    <div class="schreib" id="w-schreib" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" aria-label="${tag}"></div>
    ${m ? `<div><div class="wahl2" role="group" aria-label="Wo ändern"><button type="button" class="an" data-wo="1">Überall</button><button type="button" data-wo="0">Nur an dieser Stelle</button></div>
      <p class="hinweis" style="margin-top:10px" id="w-wo">${woSteht(m[0], m[1])} Du änderst alle auf einmal.</p></div>` : ''}
    ${angaben.length ? `<p class="hinweis">In diesem Satz steht eine Angabe, die an vielen Stellen gleich ist: <b>${angaben.map(a => h(a.label)).join(', ')}</b>. Ändere sie besser unter „Häuser & Zeiten“. Schreibst du den Satz hier um, folgt er ihr nicht mehr von selbst.</p>` : ''}
    <div class="pruef__kn"><button class="kn kn--breit" type="button" id="w-ok">Übernehmen</button>
      <button class="link" type="button" id="w-ab" style="justify-self:center">Abbrechen</button>
      ${el.hasAttribute('data-neu') ? '<button class="link" type="button" id="w-ur" style="justify-self:center">Ursprünglichen Text zurückholen</button>' : ''}
      ${intern && Z.seiten.some(s => s.datei === intern) ? `<a class="link" href="#/seite/${encodeURIComponent(intern)}" style="justify-self:center">Zur verlinkten Seite wechseln</a>` : ''}</div>`;
  const box = $('#w-schreib');
  box.innerHTML = t.orig.replace(/\s*\n\s*/g, ' ');  // Zeilenwechsel im Quelltext der Seite sind keine Umbrüche
  const anfang = rein(box.innerHTML);
  box.addEventListener('input', () => spiegel(t, rein(box.innerHTML)));
  box.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') { ev.preventDefault(); if (!lauf && !ev.metaKey && !ev.ctrlKey) document.execCommand('insertLineBreak'); else if (ev.metaKey || ev.ctrlKey) $('#w-ok').click(); }
  });
  box.addEventListener('paste', ev => { ev.preventDefault(); document.execCommand('insertText', false, (ev.clipboardData || window.clipboardData).getData('text/plain')); });
  $$('.wahl2 button').forEach(b => b.addEventListener('click', () => {
    spiegel(t, t.orig);
    t.ueberall = b.dataset.wo === '1';
    $$('.wahl2 button').forEach(x => x.classList.toggle('an', x === b));
    $('#w-wo').innerHTML = t.ueberall ? `${woSteht(m[0], m[1])} Du änderst alle auf einmal.` : 'Nur diese eine Stelle ändert sich. Alle anderen bleiben, wie sie sind.';
    spiegel(t, rein(box.innerHTML));
  }));
  $('#w-ab').addEventListener('click', () => { spiegel(t, t.orig); pruefLeer(); });
  const ur = $('#w-ur');
  if (ur) ur.addEventListener('click', async () => {
    try { await aendern({ art: 'text-weg', h: hs, seite: W.datei, n }); t.fertig = true; sag('Der ursprüngliche Text steht wieder im Entwurf. Auf die Website kommt er mit „Veröffentlichen“.'); neuLaden({ e: hs, n }); } catch (e) { sag(e.message, true, e.lex); }
  });
  $('#w-ok').addEventListener('click', async () => {
    const neu = rein(box.innerHTML);
    if (neu === t.orig || neu === anfang) { spiegel(t, t.orig); pruefLeer(); return; }
    try {
      await aendern({ art: 'text', h: hs, seite: W.datei, n, neu, ueberall: t.ueberall, lauf });
      t.fertig = true;
      el.setAttribute('data-neu', '');
      pruefLeer();
      quittung('Text gespeichert', box.textContent.trim().slice(0, 90), { id: t.ueberall ? `t:${hs}||` : `t:${hs}|${W.datei}|${n}`, seite: W.datei });
    } catch (e) { sag(e.message, true, e.lex); }
  });
  box.focus();
  const sel = getSelection(), r = document.createRange();
  r.selectNodeContents(box);
  r.collapse(false);
  sel.removeAllRanges();
  sel.addRange(r);
}
function pruefAngabe(t) {
  const felder = t.q.map(q => [q, Z.felder[q]]).filter(x => x[1]);
  if (!felder.length) return pruefLeer();
  const f0 = felder[0][1], haus = Z.haeuser[f0.haus];
  $('#w-pruef').innerHTML = `<h2>${haus ? h(haus) : 'Angabe'}</h2>
    ${felder.map(([q, f]) => `<label class="feld"><span>${h(f.label)}</span><input data-p="${q}" value="${h(f.wert)}"></label>`).join('')}
    <p class="hinweis">${woSteht(f0.stellen, f0.seiten) || 'Diese Angabe gilt für die ganze Website.'} Du änderst sie hier für alle auf einmal.</p>
    <div class="pruef__kn"><button class="kn kn--breit" type="button" id="w-ok">Übernehmen</button><button class="link" type="button" id="w-ab" style="justify-self:center">Abbrechen</button>
    <a class="link" href="#/haeuser" style="justify-self:center">Alle Angaben der Häuser</a></div>`;
  const ins = $$('#w-pruef input');
  ins.forEach(i => i.addEventListener('keydown', ev => { if (ev.key === 'Enter') $('#w-ok').click(); }));
  $('#w-ab').addEventListener('click', pruefLeer);
  $('#w-ok').addEventListener('click', async () => {
    try {
      const werte = {}, alte = {};
      ins.forEach(i => { if (i.value.trim() !== Z.felder[i.dataset.p].wert) { werte[i.dataset.p] = i.value; alte[i.dataset.p] = Z.felder[i.dataset.p].wert; } });
      const ps = Object.keys(werte);
      if (!ps.length) return pruefLeer();
      await aendern({ art: 'fakten', werte });
      quittung(mal(ps.length, 'Angabe', 'Angaben') + ' gespeichert', `${haus || 'Ganze Website'} · ${ps.map(p => Z.felder[p].label).join(', ')}`, { id: 'f:' + ps[0], seite: W.datei, zurueck: { art: 'fakten', werte: alte } });
      neuLaden({ e: t.el.dataset.e, n: t.el.dataset.en });
    } catch (e) { sag(e.message, true, e.lex); }
  });
  ins[0].focus();
  ins[0].select();
}
function pruefGericht(t) {
  const [, gruppe, idx] = t.q[0].split(':'), g = Z.karte[gruppe], i = +idx, x = g && g.liste[i];
  if (!x) return pruefLeer();
  let b = x.b;
  const bildteil = () => g.bild ? `<div class="feld"><span>Foto</span>${b ? `<div class="bildvor"><img src="${bildadr(b)}" alt=""></div>` : ''}
      <div style="display:flex;gap:14px;align-items:center;margin-top:4px"><button class="kn kn--klein kn--linie" type="button" id="w-gb">${b ? 'Anderes Foto' : 'Foto wählen'}</button>${b ? '<button class="link" type="button" id="w-go">Ohne Foto</button>' : ''}</div></div>` : '';
  $('#w-pruef').innerHTML = `<h2>${h(g.titel)}</h2><p class="leise" style="margin-top:-10px">${h(Z.haeuser[g.haus])}</p>
    <label class="feld"><span>Name</span><input id="w-n" value="${h(x.n)}"></label>
    <label class="feld"><span>Beschreibung</span><textarea id="w-z" rows="3">${h(x.z)}</textarea></label>
    <label class="feld"><span>Preis</span><input id="w-p" value="${h(x.p)}" placeholder="z. B. 14 oder 6 / Stk"></label>
    <div id="w-bt">${bildteil()}</div>
    <p class="hinweis">Das Gericht ändert sich auf der Karten-Seite und auf der Seite des Hauses.</p>
    <div class="pruef__kn"><button class="kn kn--breit" type="button" id="w-ok">Übernehmen</button><button class="link" type="button" id="w-ab" style="justify-self:center">Abbrechen</button>
    <a class="link" href="#/karte/${g.haus}" style="justify-self:center">Ganze Karte öffnen</a></div>`;
  const bt = $('#w-bt');
  bt.addEventListener('click', async ev => {
    if (ev.target.id === 'w-go') { b = null; bt.innerHTML = bildteil(); }
    if (ev.target.id === 'w-gb') { const r = await hochladen(''); if (r) { b = r.key; bt.innerHTML = bildteil(); } }
  });
  $('#w-ab').addEventListener('click', pruefLeer);
  $('#w-ok').addEventListener('click', async () => {
    const liste = g.liste.map(y => ({ ...y }));
    const ur = x.u || (g.stand.some(y => y.n === x.n) ? x.n : null), nn = $('#w-n').value.trim();
    liste[i] = { ...liste[i], n: nn, z: $('#w-z').value, p: $('#w-p').value, b, u: ur && ur !== nn ? ur : null };
    const alt = g.liste.map(y => ({ ...y }));
    if (await tun({ art: 'karte', gruppe, liste }, { titel: 'Gericht gespeichert', text: `${liste[i].n} · ${g.titel}`, id: 'k:' + gruppe, seite: W.datei, zurueck: { art: 'karte', gruppe, liste: alt } })) neuLaden({ q: t.q[0] });
  });
}
function pruefBild(t, neu) {
  const key = t.el.dataset.b, b = Z.bilder.find(x => x.key === key) || { seiten: [] };
  const sende = async (wert, titel) => { if (await tun({ art: 'bild', key, neu: wert }, { titel, text: mal(b.seiten.length, 'Seite', 'Seiten') + ' betroffen', id: 'b:' + key, seite: W.datei, zurueck: { art: 'bild', key, neu: b.neu || null } })) neuLaden({ b: key, n: t.el.dataset.bn }); };
  if (neu) {
    $('#w-pruef').innerHTML = `<h2>Neues Bild</h2><div class="bildvor"><img src="${bildadr(neu.key, 'l')}" alt=""></div>
      <p class="hinweis">Es ersetzt das bisherige Bild${b.seiten.length > 1 ? ` auf <b>${b.seiten.length} Seiten</b>` : ''}.${neu.hinweis ? ' ' + h(neu.hinweis) : ''}</p>
      <div class="pruef__kn"><button class="kn kn--breit" type="button" id="w-ok">Bild übernehmen</button><button class="link" type="button" id="w-ab" style="justify-self:center">Abbrechen</button></div>`;
    $('#w-ok').addEventListener('click', () => sende(neu.key, 'Bild getauscht'));
    $('#w-ab').addEventListener('click', () => pruefBild(t));
    return;
  }
  $('#w-pruef').innerHTML = `<h2>Bild</h2><div class="bildvor"><img src="${h(t.el.currentSrc || t.el.src)}" alt=""></div>
    <p class="hinweis">${b.seiten.length > 1 ? `Dieses Bild ist auf <b>${b.seiten.length} Seiten</b> zu sehen: ${b.seiten.slice(0, 6).map(s => h(s.name)).join(', ')}${b.seiten.length > 6 ? ' …' : ''}. Ein neues Bild ersetzt es überall.` : 'Dieses Bild ist nur auf dieser Seite zu sehen.'}
    ${b.sonder ? ` Als ${b.sonder} wird das neue Foto automatisch abgedunkelt, damit die Schrift darauf lesbar bleibt.` : ''}</p>
    <div class="ablage" id="w-ablage" tabindex="0" role="button"><b>Neues Bild wählen</b><span>oder hierher ziehen · JPG, PNG, WebP</span></div>
    ${b.neu ? '<button class="link" type="button" id="w-alt" style="justify-self:center;align-self:center">Ursprüngliches Bild zurückholen</button>' : ''}`;
  ablage($('#w-ablage'), key, r => pruefBild(t, r));
  const alt = $('#w-alt');
  if (alt) alt.addEventListener('click', () => sende(null, 'Ursprüngliches Bild zurückgeholt'));
}

// ---------------------------------------------------------------- Hochladen
function waehleDatei() {
  return new Promise(ok => {
    const i = $('#datei');
    i.value = '';
    i.accept = 'image/jpeg,image/png,image/webp';  // falls zuvor eine PDF-Wahl abgebrochen wurde
    i.onchange = () => ok(i.files[0] || null);
    i.oncancel = () => ok(null);
    i.click();
  });
}
async function ladeHoch(datei, fuer) {
  if (!datei) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(datei.type)) { sag('Bitte ein JPG, PNG oder WebP wählen.', true); return null; }
  sag('Das Bild wird vorbereitet …');
  try {
    const r = await api('hochladen?fuer=' + encodeURIComponent(fuer || ''), datei, true);
    if (r.hinweis) sag(r.hinweis, true);
    return r;
  } catch (e) { sag(e.message, true, e.lex); return null; }
}
async function hochladen(fuer) { return ladeHoch(await waehleDatei(), fuer); }
function ablage(el, fuer, dann) {
  const los = async d => { const r = await ladeHoch(d, fuer); if (r) dann(r); };
  el.addEventListener('click', async () => los(await waehleDatei()));
  el.addEventListener('keydown', async ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); los(await waehleDatei()); } });
  el.addEventListener('dragover', ev => { ev.preventDefault(); el.classList.add('drauf'); });
  el.addEventListener('dragleave', () => el.classList.remove('drauf'));
  el.addEventListener('drop', ev => { ev.preventDefault(); el.classList.remove('drauf'); los(ev.dataTransfer.files[0]); });
}

// ---------------------------------------------------------------- Karte
function preisT(p) {
  p = String(p || '').replace(/\./g, ',');
  if (!p) return '';
  if (/^[\d, /]+$/.test(p)) return p + ' €';
  const m = p.match(/^([\d,]+)\s*\/\s*(.+)$/);
  return m ? `${m[1]} € / ${m[2]}` : p;
}
// Wohin ein zurückgeholter Eintrag gehört: hinter seinen nächsten früheren Nachbarn, der noch in der Liste steht (sonst an den Anfang).
function platzNach(stand, y, liste, nameJetzt, nameStand) {
  for (let k = stand.indexOf(y) - 1; k >= 0; k--) {
    const j = liste.findIndex(x => nameJetzt(x) === nameStand(stand[k]) || nameStand(x) === nameStand(stand[k]));
    if (j >= 0) return j + 1;
  }
  return 0;
}
function abgleich(g) {
  const a = g.stand, b = g.liste, na = a.map(x => x.n), nb = b.map(x => (x.u && na.includes(x.u) ? x.u : x.n));  // x.u: unter diesem Namen ist das Gericht veröffentlicht
  const status = b.map((x, i) => {
    const y = a[na.indexOf(nb[i])];
    if (!y) return 'neu';
    return (y.n !== x.n || y.z !== x.z || y.p !== x.p || (y.b || null) !== (x.b || null) || y.aus !== x.aus) ? 'anders' : '';
  });
  return { status, weg: a.filter(y => !nb.includes(y.n)) };
}
function karte(haus) {
  haus = Z.haeuser[haus] ? haus : 'hh';
  const zeile = (x, i, g, st, letzte) => `<div class="gz${x.aus ? ' aus' : ''}${BLITZ === x.n ? ' blitz' : ''}" data-i="${i}">
      ${g.bild ? `<button class="gz__b" type="button" data-akt="edit" tabindex="-1" aria-hidden="true">${x.b ? `<img src="${bildadr(x.b)}" alt="" loading="lazy">` : SYM.bild}</button>` : ''}
      <button class="gz__t" type="button" data-akt="edit" title="Bearbeiten"><b>${h(x.n)}</b>${x.z ? `<span>${h(x.z)}</span>` : ''}</button>
      <span class="gz__s">${x.aus ? '<i class="marke grau">Ausgeblendet</i>' : ''}${st === 'neu' ? '<i class="marke rot">Neu im Entwurf</i>' : st === 'anders' ? '<i class="marke rot">Geändert</i>' : ''}</span>
      <span class="gz__p">${h(preisT(x.p))}</span>
      <div class="gz__r"><button class="rund" type="button" data-akt="hoch" title="Nach oben" aria-label="Nach oben"${i === 0 ? ' disabled' : ''}>${SYM.hoch}</button><button class="rund" type="button" data-akt="runter" title="Nach unten" aria-label="Nach unten"${letzte ? ' disabled' : ''}>${SYM.runter}</button>
        <button class="rund" type="button" data-akt="aus" title="${x.aus ? 'Wieder zeigen' : 'Vorübergehend ausblenden'}" aria-label="${x.aus ? 'Wieder zeigen' : 'Ausblenden'}">${x.aus ? SYM.augezu : SYM.auge}</button>
        <button class="rund" type="button" data-akt="weg" title="Von der Karte nehmen" aria-label="Von der Karte nehmen">${SYM.korb}</button>
        <button class="kn kn--klein kn--linie" type="button" data-akt="edit">Bearbeiten</button></div></div>`;
  const gruppe = ([key, g]) => {
    const ab = abgleich(g), wort = g.bild ? 'Gericht' : 'Zeile';
    return `<section class="blatt gruppe" data-g="${key}"><div class="gruppe__k"><h3>${h(g.titel)}<span>${String(g.liste.filter(x => !x.aus).length).padStart(2, '0')}</span></h3>${g.geaendert ? '<i class="marke rot">Im Entwurf geändert</i>' : ''}
        <button class="kn kn--klein" type="button" data-akt="neu">${wort} hinzufügen</button></div>
      <div class="zeilen">${g.liste.map((x, i) => zeile(x, i, g, ab.status[i], i === g.liste.length - 1)).join('')}${ab.weg.map(y => `<div class="gz weg"><span class="gz__t"><b>${h(y.n)}</b></span><span class="gz__s"><i class="marke grau">Entfernt, noch nicht veröffentlicht</i></span><span class="gz__p"></span>
        <div class="gz__r"><button class="kn kn--klein kn--linie" type="button" data-akt="hol" data-n="${h(y.n)}">Zurückholen</button></div></div>`).join('')}
        ${g.liste.length || ab.weg.length ? '' : `<p class="gz leer">Noch nichts in dieser Gruppe.</p>`}</div>
      ${g.geaendert ? '<div class="gruppe__f"><button class="link" type="button" data-akt="std">Alle Änderungen in dieser Gruppe zurücknehmen</button></div>' : ''}</section>`;
  };
  const alle = Object.entries(Z.karte).filter(([, g]) => g.haus === haus);
  sicht.innerHTML = `<div class="in">${kopf('Speise<em>karte.</em>', 'Wähle ein Haus. Mit „Bearbeiten“ öffnest du ein Gericht, mit „Gericht hinzufügen“ legst du ein neues an. Jede Änderung wird bestätigt und steht danach auf der Karten-Seite und auf der Seite des Hauses. Die Karte als PDF wird getrennt gepflegt.',
      `<a class="kn kn--linie" href="/entwurf/karte.html" target="_blank" rel="noopener">Karte im Entwurf ansehen</a><button class="kn" type="button" data-akt="neu-oben">Gericht hinzufügen</button>`)}
    <div class="hauswahl">${Object.entries(Z.haeuser).map(([k, n]) => `<a class="hw${k === haus ? ' an' : ''}" href="#/karte/${k}"><img src="${bildadr(Z.hausbild[k])}" alt=""><span><b>${h(n)}</b><span>${mal(Object.values(Z.karte).filter(g => g.haus === k && g.bild).reduce((a, g) => a + g.liste.length, 0), 'Gericht', 'Gerichte')}</span></span></a>`).join('')}</div>
    ${['Drinks', 'Essen', 'Wein & mehr'].map(r => { const gs = alle.filter(([, g]) => g.reihe === r); return gs.length ? `<h2 class="reiheT">${r}</h2>${gs.map(gruppe).join('')}` : ''; }).join('')}
    <h2 class="reiheT">Gruppen & PDF</h2>${gruppenBlatt(haus)}
    <section class="blatt"><div class="gruppe__k" style="padding:0"><h3>Karte als PDF</h3></div><p class="gruppe__hin" style="padding:8px 0 0">Hinter dem Knopf „Karte als PDF“ auf der Seite des Hauses. Lade die neue Karte hoch, der Knopf zeigt danach auf die neue Datei.</p>
      <div class="sichern offen" style="position:static;margin:14px 0 0"><i></i><span>${h(Z.felder[haus + '.pdf'] ? Z.felder[haus + '.pdf'].wert : '')}</span><button class="kn kn--klein" type="button" data-akt="pdf">Neue PDF hochladen</button></div></section></div>`;
  const blitz = $('.gz.blitz', sicht);
  BLITZ = null;
  if (blitz) blitz.scrollIntoView({ block: 'center' });
  sicht.querySelector('.in').addEventListener('click', ev => {
    const b = ev.target.closest('[data-akt]');
    if (!b) return;
    const akt = b.dataset.akt;
    if (akt === 'neu-oben') return gerichtFenster({ haus });
    if (akt === 'pdf') return pdfHoch(haus + '.pdf');
    if (gruppenKlick(ev, haus)) return;
    const sec = b.closest('.gruppe');
    if (!sec || !sec.dataset.g) return;
    if (!sec) return;
    const key = sec.dataset.g, g = Z.karte[key], z = b.closest('.gz'), i = z && z.dataset.i !== undefined ? +z.dataset.i : -1, alt = g.liste.map(x => ({ ...x })), l = alt.map(x => ({ ...x }));
    const sende = async (liste, titel, text) => { if (await tun({ art: 'karte', gruppe: key, liste }, { titel, text, id: 'k:' + key, zurueck: { art: 'karte', gruppe: key, liste: alt } })) neuZeichnen(); };
    if (akt === 'neu') return gerichtFenster({ haus, gruppe: key });
    if (akt === 'edit') return gerichtFenster({ haus, gruppe: key, i });
    if (akt === 'std') return frage('Änderungen <em>zurücknehmen?</em>', `„${h(g.titel)}“ steht danach wieder so da wie auf der Website.`, 'Zurücknehmen', async () => { await aendern({ art: 'verwerfen', id: 'k:' + key }); sag('Zurückgenommen: ' + g.titel); neuZeichnen(); });
    if (akt === 'hol') { const y = g.stand.find(x => x.n === b.dataset.n); l.splice(platzNach(g.stand, y, l, x => x.u || x.n, x => x.n), 0, { ...y }); BLITZ = y.n; return sende(l, 'Wieder auf der Karte', y.n); }
    if (akt === 'hoch' && i > 0) { [l[i - 1], l[i]] = [l[i], l[i - 1]]; BLITZ = l[i - 1].n; return sende(l, 'Reihenfolge gespeichert', `${l[i - 1].n} steht jetzt weiter oben`); }
    if (akt === 'runter' && i < l.length - 1) { [l[i + 1], l[i]] = [l[i], l[i + 1]]; BLITZ = l[i + 1].n; return sende(l, 'Reihenfolge gespeichert', `${l[i + 1].n} steht jetzt weiter unten`); }
    if (akt === 'aus') { l[i].aus = !l[i].aus; BLITZ = l[i].n; return sende(l, l[i].aus ? 'Ausgeblendet' : 'Wieder sichtbar', l[i].aus ? `${l[i].n} steht vorerst nicht auf der Karte` : l[i].n); }
    if (akt === 'weg') return frage('Von der Karte <em>nehmen?</em>', `„${h(alt[i].n)}“ verschwindet aus ${h(g.titel)}. Bis zum Veröffentlichen kannst du es mit einem Klick zurückholen.`, 'Von der Karte nehmen', async () => { l.splice(i, 1); await sende(l, 'Von der Karte genommen', alt[i].n); });
  });
}
function gerichtFenster({ haus, gruppe, i }) {
  const neu = i === undefined, st = neu ? { n: '', z: '', p: '', b: null, aus: false } : { ...Z.karte[gruppe].liste[i] };
  const gruppenVon = k => Object.entries(Z.karte).filter(([, g]) => g.haus === k);
  const erste = k => (gruppenVon(k).find(([, g]) => g.reihe === 'Essen') || gruppenVon(k)[0])[0];
  let hausW = haus || 'hh', grW = gruppe || erste(hausW), pos = 'ende';
  const m = String(st.p).match(/^([\d.,]+)\s*(?:\/\s*(Stk|100 g))?$/);
  let einheit = !st.p ? '' : m ? (m[2] || '') : 'frei';
  fenster(`<h2>${neu ? 'Neues <em>Gericht.</em>' : 'Gericht <em>bearbeiten.</em>'}</h2>
    <div class="form2"><div class="form2__l">
      ${neu ? `<div class="feld"><span>Haus</span>${chipsH('haus', Object.entries(Z.haeuser), hausW)}</div><div class="feld"><span>Gruppe</span><div id="g-gruppen"></div></div>`
    : `<p class="form2__ort">${h(Z.haeuser[hausW])} · ${h(Z.karte[grW].titel)}</p>`}
      <label class="feld"><span>Name</span><input id="g-n" maxlength="140" value="${h(st.n)}" placeholder="z. B. Gegrillter Spitzkohl"></label>
      <label class="feld"><span>Beschreibung</span><textarea id="g-z" rows="2" maxlength="300" placeholder="Zutaten, mit Komma getrennt">${h(st.z)}</textarea></label>
      <div class="feld"><span>Preis in Euro</span><div class="preisz"><input id="g-p" value="${h(String(m ? m[1] : st.p).replace('.', ','))}" placeholder="z. B. 14">${chipsH('einheit', [['', 'pro Portion'], ['Stk', 'pro Stück'], ['100 g', 'pro 100 g'], ['frei', 'eigene Angabe']], einheit)}</div><small id="g-ph"></small></div>
      <div class="feld" id="g-foto"></div>
      ${neu ? `<div class="feld"><span>Platz in der Gruppe</span>${chipsH('pos', [['ende', 'Am Ende'], ['anfang', 'Ganz oben']], pos)}</div>` : ''}
      ${schalter('g-an', !st.aus, 'Auf der Karte zeigen')}
    </div><div class="form2__r"><span class="mono leise">So steht es auf der Karte</span><div id="g-vor"></div></div></div>
    <div class="fehler" id="g-f" role="alert"></div>
    <div class="fenster__kn"><button class="kn kn--linie" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="g-ok">${neu ? 'Auf die Karte setzen' : 'Speichern'}</button></div>`, true);
  const f = $('#fenster');
  const preis = () => { const z = $('#g-p').value.trim().replace(/(\d),(\d)/g, '$1.$2'); return !z ? '' : einheit === 'Stk' || einheit === '100 g' ? `${z} / ${einheit}` : z; };
  const mal2 = () => {
    const g = Z.karte[grW], n = $('#g-n').value.trim() || 'Name des Gerichts', z = $('#g-z').value.trim(), aus = !$('#g-an').checked;
    if (neu) $('#g-gruppen').innerHTML = chipsH('gruppe', gruppenVon(hausW).map(([k, x]) => [k, x.titel]), grW);
    $('#g-ph').textContent = einheit === 'frei' ? 'Schreib es so, wie es dastehen soll, z. B. 13 / 24 / 45 für 3, 6 oder 12 Stück.' : 'Ohne Preis bleibt das Feld leer.';
    $('#g-foto').innerHTML = g.bild ? `<span>Foto</span><div class="fotowahl">${st.b ? `<img src="${bildadr(st.b)}" alt="">` : `<div class="fotowahl__leer">${ST('sonne')}</div>`}
      <div><button class="kn kn--klein kn--linie" type="button" data-akt="foto">${st.b ? 'Anderes Foto' : 'Foto wählen'}</button>${st.b ? '<button class="link" type="button" data-akt="ohnefoto">Ohne Foto</button>' : '<small>Ohne Foto steht eine Zeichnung der Marke auf der Karte.</small>'}</div></div>` : '';
    $('#g-vor').innerHTML = g.bild ? `<div class="vk${aus ? ' aus' : ''}"><div class="vk__b">${st.b ? `<img src="${bildadr(st.b)}" alt="">` : ST('sonne')}</div><div class="vk__n">${h(n)}</div><p>${h(z)}</p><b>${h(preisT(preis()))}</b></div>`
      : `<div class="vw${aus ? ' aus' : ''}"><div><b>${h(n)}</b><small>${h(z)}</small></div><i>${h(preisT(preis()))}</i></div>`;
    $('#g-vor').insertAdjacentHTML('beforeend', `<p class="vor__h">${aus ? 'Ausgeblendet: steht vorerst nicht auf der Karte.' : `${h(Z.haeuser[hausW])} · ${h(g.titel)}`}</p>`);
  };
  mal2();
  f.oninput = () => { mal2(); $('#g-f').textContent = ''; };
  f.bei = ev => {
    const { name, wert } = ev.detail;
    if (name === 'haus') { hausW = wert; grW = erste(hausW); }
    if (name === 'gruppe') grW = wert;
    if (name === 'einheit') einheit = wert;
    if (name === 'pos') pos = wert;
    mal2();
  };
  f.onclick = async ev => {
    const b = ev.target.closest('[data-akt]');
    if (b && b.dataset.akt === 'foto') { const r = await hochladen(''); if (r) { st.b = r.key; mal2(); } }
    if (b && b.dataset.akt === 'ohnefoto') { st.b = null; mal2(); }
  };
  $('#g-ok').addEventListener('click', async ev => {
    const g = Z.karte[grW], n = $('#g-n').value.trim(), alt = g.liste.map(x => ({ ...x })), liste = alt.map(x => ({ ...x }));
    if (!n) { $('#g-f').textContent = 'Bitte einen Namen eintragen.'; $('#g-n').focus(); return; }
    if (alt.some((x, j) => x.n.toLowerCase() === n.toLowerCase() && (neu || j !== i))) { $('#g-f').textContent = `„${n}“ steht schon in ${g.titel}. Bitte einen anderen Namen wählen.`; return; }
    const eintrag = { n, z: $('#g-z').value.trim(), p: preis(), b: g.bild ? st.b : null, aus: !$('#g-an').checked };
    const ur = st.u || (!neu && g.stand.some(x => x.n === st.n) ? st.n : null);
    if (ur && ur !== n) eintrag.u = ur;
    if (neu) { if (pos === 'anfang') liste.unshift(eintrag); else liste.push(eintrag); } else liste[i] = eintrag;
    if (!neu && ['n', 'z', 'p', 'b', 'aus'].every(k => (eintrag[k] || '') === (alt[i][k] || ''))) { fensterZu(); sag('Nichts geändert, nichts gespeichert.'); return; }
    ev.target.disabled = true;
    const ok = await tun({ art: 'karte', gruppe: grW, liste }, { titel: neu ? 'Gericht hinzugefügt' : 'Gericht gespeichert', text: `${n} · ${g.titel}, ${Z.haeuser[hausW]}`, id: 'k:' + grW, zurueck: { art: 'karte', gruppe: grW, liste: alt } });
    ev.target.disabled = false;
    if (!ok) return;
    fensterZu();
    BLITZ = n;
    if (W) neuLaden({}); else if (location.hash !== '#/karte/' + hausW) location.hash = '#/karte/' + hausW; else neuZeichnen();
  });
  $('#g-n').focus();
}

// ---------------------------------------------------------------- Häuser & Zeiten
function haeuser() {
  const feld = (p, f) => `<label class="feld" data-p="${p}"><span>${h(f.label)}${f.wert !== f.stand ? '<i class="marke rot">Im Entwurf geändert</i>' : ''}</span><input value="${h(f.wert)}"${f.art === 'link' ? ' inputmode="url"' : ''}>
      <small>${f.stellen ? `steht an ${mal(f.stellen, 'Stelle', 'Stellen')} auf ${mal(f.seiten, 'Seite', 'Seiten')}` : (f.art === 'link' ? 'hinter den Knöpfen der Seite' : '')}${f.wert !== f.stand ? ` · <button class="link" type="button" data-sehen="f:${p}">vorher/nachher ansehen</button>` : ''}${p.endsWith('.pdf') ? ` · <button class="link" type="button" data-pdf="${p}">neue PDF hochladen</button>` : ''}</small></label>`;
  const teil = (k, art, titel) => { const fs = Object.entries(Z.felder).filter(([, f]) => f.haus === k && f.art === art); return fs.length ? `<h4>${titel}</h4>${fs.map(([p, f]) => feld(p, f)).join('')}` : ''; };
  const fuss = '<div class="sichern"><i></i><span></span><button class="link" type="button" data-akt="verwerfen">Verwerfen</button><button class="kn kn--klein" type="button" data-akt="sichern">Speichern</button></div>';
  sicht.innerHTML = `<div class="in">${kopf('Häuser <em>& Zeiten.</em>', 'Jede Angabe gibt es nur einmal. Trag sie ein und drück unten am Haus auf „Speichern“. Danach stimmt sie auf jeder Seite: Startseite, Restaurants, Fuß der Seite, Tisch-Auswahl. Die Antworten unter „Häufige Fragen“ sind eigene Texte, die pflegst du dort.')}
    <div class="raster r-3">${Object.entries(Z.haeuser).map(([k, name]) => `<section class="blatt haus" data-karte="${k}"><div class="haus__b"><img src="${bildadr(Z.hausbild[k])}" alt=""><b>${h(name)}</b></div>
      <div class="haus__t"><div class="sosteht"><span>So steht es auf der Seite</span><div></div></div>${teil(k, 'zeit', 'Öffnungszeiten')}${teil(k, 'adresse', 'Adresse')}${teil(k, 'haus', 'Vor Ort')}${teil(k, 'link', 'Links')}</div>${fuss}</section>`).join('')}</div>
    <h2 class="zw">Kontakt & Netz</h2>
    <section class="blatt haus" data-karte="alle"><div class="haus__t"><div class="raster r-3">${Object.entries(Z.felder).filter(([p]) => /^(kontakt|netz|alle)\./.test(p)).map(([p, f]) => feld(p, f)).join('')}</div></div>${fuss}</section></div>`;
  const wurzel = sicht.querySelector('.in');
  const pruefe = karte => {
    const anders = $$('.feld', karte).filter(l => { const d = $('input', l).value.trim() !== Z.felder[l.dataset.p].wert; l.classList.toggle('offen', d); return d; });
    const s = $('.sichern', karte), imEntwurf = $$('.feld', karte).filter(l => Z.felder[l.dataset.p].wert !== Z.felder[l.dataset.p].stand).length;
    s.classList.toggle('offen', !!anders.length);
    s.classList.toggle('entwurf', !anders.length && !!imEntwurf);
    $$('button', s).forEach(b => { b.disabled = !anders.length; });
    $('span', s).textContent = anders.length ? mal(anders.length, 'Angabe', 'Angaben') + ' noch nicht gespeichert' : imEntwurf ? `Gespeichert, ${imEntwurf} im Entwurf` : 'Nichts geändert';
    const k = karte.dataset.karte, so = $('.sosteht div', karte);
    if (so) { const w = p => { const i = $(`[data-p="${k}.${p}"] input`, karte); return i ? i.value.trim() : ''; }; so.textContent = [[w('zeit1'), w('zeit2')].filter(Boolean).join(', '), w('saison'), w('kueche') ? 'Küche ' + [w('kueche'), w('kueche2')].filter(Boolean).join(', ') : ''].filter(Boolean).join(' · '); }
    return anders;
  };
  $$('.haus', wurzel).forEach(pruefe);
  offen = () => !!$('.feld.offen', sicht);
  wurzel.addEventListener('input', ev => { const k = ev.target.closest('.haus'); if (k) pruefe(k); });
  wurzel.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches('.feld input')) { ev.preventDefault(); const k = ev.target.closest('.haus'); if (pruefe(k).length) $('[data-akt="sichern"]', k).click(); } });
  wurzel.addEventListener('click', async ev => {
    const s = ev.target.closest('[data-sehen]'), pd = ev.target.closest('[data-pdf]'), b = ev.target.closest('[data-akt]'), karte = b && b.closest('.haus');
    if (s) { ev.preventDefault(); const c = Z.aenderungen.find(x => x.id === s.dataset.sehen); if (c) vergleich(c); return; }
    if (pd) { ev.preventDefault(); pdfHoch(pd.dataset.pdf); return; }
    if (!karte) return;
    if (b.dataset.akt === 'verwerfen') { $$('.feld', karte).forEach(l => { $('input', l).value = Z.felder[l.dataset.p].wert; }); pruefe(karte); return; }
    if (b.dataset.akt === 'sichern') {
      const anders = pruefe(karte), werte = {}, alte = {};
      anders.forEach(l => { werte[l.dataset.p] = $('input', l).value; alte[l.dataset.p] = Z.felder[l.dataset.p].wert; });
      const namen = anders.map(l => Z.felder[l.dataset.p].label), k = karte.dataset.karte, erste = Object.keys(werte)[0];
      b.disabled = true;
      const ok = await tun({ art: 'fakten', werte }, { titel: mal(anders.length, 'Angabe', 'Angaben') + ' gespeichert', text: `${Z.haeuser[k] || 'Kontakt & Netz'} · ${namen.slice(0, 3).join(', ')}${namen.length > 3 ? ' …' : ''}`, id: 'f:' + erste, zurueck: { art: 'fakten', werte: alte } });
      b.disabled = false;
      if (ok) { offen = null; neuZeichnen(); }
    }
  });
}

// ---------------------------------------------------------------- Bilder
function bilder(filter) {
  const wahl = [['', 'Alle']].concat(Z.seiten.filter(s => s.gruppe !== 'Rechtliches' && s.gruppe !== 'Shop').map(s => [s.datei, s.name]), [['shop.html', 'Shop']]);
  const liste = Z.bilder.filter(b => !filter || b.seiten.some(s => s.datei === filter));
  sicht.innerHTML = `<div class="in">${kopf('Bil<em>der.</em>', 'Jedes Foto der Website. Klick auf ein Bild, wähle ein neues und bestätige. Es ändert sich dann überall, wo es zu sehen ist.')}
    <div class="filter">${wahl.map(([d, n]) => `<button type="button" data-f="${h(d)}" class="${(filter || '') === d ? 'an' : ''}">${h(n)}</button>`).join('')}</div>
    <div class="mauer">${liste.map(b => `<button class="bk" type="button" data-key="${h(b.key)}"><img src="${bildadr(b.neu || b.key)}" alt="" loading="lazy">${b.neu ? '<i>Getauscht</i>' : ''}<span>${mal(b.seiten.length, 'Seite', 'Seiten')}</span><em>Tauschen</em></button>`).join('')}</div></div>`;
  sicht.querySelector('.in').addEventListener('click', ev => {
    const f = ev.target.closest('[data-f]'), k = ev.target.closest('[data-key]');
    if (f) location.hash = '#/bilder' + (f.dataset.f ? '/' + encodeURIComponent(f.dataset.f) : '');
    if (k) bildFenster(k.dataset.key);
  });
}
function bildFenster(key, neu) {
  const b = Z.bilder.find(x => x.key === key);
  if (!b) return;
  const jetzt = b.neu || b.key;
  fenster(`<h2>Bild <em>tauschen.</em></h2>
    ${neu ? `<div class="vn vn--bild"><div class="alt"><span>Bisher</span><img src="${bildadr(jetzt, 'l')}" alt=""></div><svg viewBox="0 0 22 22"><path d="M3 11h15M13 6l5 5-5 5"/></svg><div class="neu"><span>Neu</span><img src="${bildadr(neu.key, 'l')}" alt=""></div></div>
      <p>Das neue Bild ersetzt das bisherige auf ${b.seiten.length > 1 ? `<b>${b.seiten.length} Seiten</b>: ${b.seiten.slice(0, 6).map(s => h(s.name)).join(', ')}${b.seiten.length > 6 ? ' …' : ''}` : `der Seite <b>${h(b.seiten[0].name)}</b>`}.${neu.hinweis ? ' ' + h(neu.hinweis) : ''}</p>
      <div class="fenster__kn"><button class="kn kn--linie" type="button" data-zu>Abbrechen</button><button class="kn kn--linie" type="button" id="f-anders">Anderes Bild</button><button class="kn" type="button" id="f-ok">Bild übernehmen</button></div>`
    : `<div class="bz"><div class="bz__b"><img src="${bildadr(jetzt, 'l')}" alt=""></div>
      <div><p style="margin:0"><b>Zu sehen auf</b></p><ul>${b.seiten.slice(0, 8).map(s => `<li>${h(s.name)}${s.zahl > 1 ? ` (${s.zahl} ×)` : ''}</li>`).join('')}${b.seiten.length > 8 ? `<li>und ${b.seiten.length - 8} weiteren Seiten</li>` : ''}</ul>
        ${b.sonder ? `<p class="hinweis" style="margin-top:14px">Dieses Foto ist ein ${b.sonder}. Ein neues Bild wird automatisch abgedunkelt, damit die Schrift darauf lesbar bleibt. Am besten ein Querformat mit mindestens 2400 Pixeln Breite.</p>` : ''}
        <div class="ablage" id="f-ablage" tabindex="0" role="button" style="margin-top:16px"><b>Neues Bild wählen</b><span>oder hierher ziehen · JPG, PNG, WebP</span></div>
        ${b.neu ? '<p style="margin-top:14px;text-align:center"><button class="link" type="button" id="f-alt">Ursprüngliches Bild zurückholen</button></p>' : ''}</div></div>`}`, true);
  const sende = async (wert, titel) => {
    if (await tun({ art: 'bild', key, neu: wert }, { titel, text: mal(b.seiten.length, 'Seite', 'Seiten') + ' betroffen', id: 'b:' + key, zurueck: { art: 'bild', key, neu: b.neu || null } })) { fensterZu(); neuZeichnen(); }
  };
  if (neu) {
    $('#f-ok').addEventListener('click', () => sende(neu.key, 'Bild getauscht'));
    $('#f-anders').addEventListener('click', async () => { const r = await hochladen(key); if (r) bildFenster(key, r); });
  } else {
    ablage($('#f-ablage'), key, r => bildFenster(key, r));
    const alt = $('#f-alt');
    if (alt) alt.addEventListener('click', () => sende(null, 'Ursprüngliches Bild zurückgeholt'));
  }
}

// ---------------------------------------------------------------- Shop
function shop() {
  const pk = p => `<article class="pk${p.versteckt ? ' aus' : ''}${BLITZ === p.id ? ' blitz' : ''}" data-id="${h(p.id)}"><button class="pk__b" type="button" data-akt="edit" tabindex="-1" aria-hidden="true">${p.b[0] ? `<img src="${bildadr(p.b[0])}" alt="" loading="lazy">` : ''}
      <span class="pk__m">${p.status === 'neu' ? '<i class="marke rot">Neu im Entwurf</i>' : p.status === 'anders' ? '<i class="marke rot">Geändert</i>' : ''}${p.versteckt ? '<i class="marke grau">Ausgeblendet</i>' : ''}${p.aus ? '<i class="marke grau">Ausverkauft</i>' : ''}${p.marke && !p.aus ? `<i class="marke hell">${h(p.marke)}</i>` : ''}</span></button>
      <div class="pk__t"><b>${h(p.n)}</b><span>${h(p.preistext)}</span></div>
      <div class="pk__a"><button class="kn kn--klein kn--linie" type="button" data-akt="edit">Bearbeiten</button><button class="rund" type="button" data-akt="versteck" title="${p.versteckt ? 'Wieder im Shop zeigen' : 'Im Shop ausblenden'}" aria-label="${p.versteckt ? 'Wieder zeigen' : 'Ausblenden'}">${p.versteckt ? SYM.augezu : SYM.auge}</button></div></article>`;
  sicht.innerHTML = `<div class="in">${kopf('Sh<em>op.</em>', 'Alle Produkte des Shops. Mit „Bearbeiten“ änderst du Name, Preis, Texte und Fotos. Mit „Neues Produkt“ legst du eines an, es bekommt automatisch seine eigene Seite.',
      `<a class="kn kn--linie" href="/entwurf/shop.html" target="_blank" rel="noopener">Shop im Entwurf ansehen</a><button class="kn" type="button" data-akt="neu">Neues Produkt</button>`)}
    ${Object.entries(Z.shopgruppen).map(([g, name]) => { const ps = Object.values(Z.shop).filter(p => p.g === g); return `<h2 class="zw">${h(name)}<span>${String(ps.length).padStart(2, '0')}</span></h2>
      <div class="raster r-4">${ps.map(pk).join('')}${g === 'gutscheine' ? '' : `<button class="pk pk--neu" type="button" data-akt="neu" data-g="${g}"><i>+</i><b>Neues Produkt</b><span>in ${h(name)}</span></button>`}</div>`; }).join('')}${regelnBlatt()}</div>`;
  const blitz = $('.pk.blitz', sicht);
  BLITZ = null;
  if (blitz) blitz.scrollIntoView({ block: 'center' });
  sicht.querySelector('.in').addEventListener('click', async ev => {
    if (await regelnKlick(ev)) return;
    const b = ev.target.closest('[data-akt]');
    if (!b) return;
    const k = b.closest('.pk[data-id]'), p = k && Z.shop[k.dataset.id];
    if (b.dataset.akt === 'neu') return produktFenster(null, b.dataset.g);
    if (b.dataset.akt === 'edit' && p) return produktFenster(p.id);
    if (b.dataset.akt === 'versteck' && p) {
      BLITZ = p.id;
      if (await tun({ art: 'shop', id: p.id, felder: { versteckt: !p.versteckt } }, { titel: p.versteckt ? 'Wieder im Shop' : 'Im Shop ausgeblendet', text: p.n, id: 's:' + p.id, zurueck: { art: 'shop', id: p.id, felder: { versteckt: p.versteckt } } })) neuZeichnen();
    }
  });
}
function produktFenster(id, gVor) {
  const neu = !id, p0 = neu ? null : Z.shop[id];
  const st = neu ? { g: gVor || 'merchandise', n: '', kurz: '', marke: '', lang: [], det: [], b: [], aus: false, alk: false, versteckt: false, v: [], vn: 'Größe', p: '', typ: 'ware' } : JSON.parse(JSON.stringify(p0));
  const gut = st.typ === 'gutschein', FEST = ['', 'Neu', 'Limitiert', 'Bestseller'];
  let art = st.v && st.v.length ? 'mehr' : 'ein', markeW = FEST.includes(st.marke || '') ? (st.marke || '') : 'eigen';
  const zahlT = x => (x === '' || x === undefined || x === null) ? '' : String(x).replace('.', ',');
  const felderVon = p => ({ g: p.g, n: p.n, kurz: p.kurz, marke: p.marke || '', lang: p.lang, det: p.det, b: p.b, aus: !!p.aus, alk: !!p.alk, versteckt: !!p.versteckt, ...(p.typ === 'gutschein' ? {} : p.v && p.v.length ? { v: p.v, vn: p.vn } : { p: p.p, v: [] }) });
  fenster(`<h2>${neu ? 'Neues <em>Produkt.</em>' : 'Produkt <em>bearbeiten.</em>'}</h2>
    <div class="form2"><div class="form2__l">
      <div class="feld"><span>Gruppe</span>${chipsH('g', Object.entries(Z.shopgruppen).filter(([k]) => gut ? k === 'gutscheine' : k !== 'gutscheine'), st.g)}</div>
      <label class="feld"><span>Name</span><input id="p-n" maxlength="140" value="${h(st.n)}" placeholder="z. B. Kochbuch Salt & Silver am Meer"></label>
      <div class="feld"><span>Preis in Euro</span><div id="p-preis"></div></div>
      <div class="feld"><span>Etikett auf dem Foto</span>${chipsH('marke', [['', 'Keins'], ['Neu', 'Neu'], ['Limitiert', 'Limitiert'], ['Bestseller', 'Bestseller'], ['eigen', 'Eigenes']], markeW)}<input id="p-marke" maxlength="30" value="${h(markeW === 'eigen' ? st.marke : '')}" placeholder="Eigenes Etikett"${markeW === 'eigen' ? '' : ' hidden'}></div>
      <label class="feld"><span>Kurztext</span><textarea id="p-kurz" rows="2" maxlength="600" placeholder="Ein, zwei Sätze. Steht oben auf der Produktseite.">${h(st.kurz)}</textarea></label>
      <label class="feld"><span>Beschreibung</span><textarea id="p-lang" rows="5" placeholder="Ausführlicher Text. Eine Leerzeile beginnt einen neuen Absatz.">${h(st.lang.join('\n\n'))}</textarea></label>
      <label class="feld"><span>Details</span><textarea id="p-det" rows="3" placeholder="Eine Zeile je Punkt, z. B. Gewicht 1,5 kg">${h(st.det.join('\n'))}</textarea></label>
      <div class="feld"><span>Fotos</span><div id="p-fotos"></div><small>Das erste Foto ist das Hauptbild im Shop.</small></div>
      <div class="schalterreihe">${schalter('p-sicht', !st.versteckt, 'Im Shop zeigen')}${gut ? '' : schalter('p-aus', st.aus, 'Ausverkauft (bleibt sichtbar, lässt sich nicht bestellen)') + schalter('p-alk', st.alk, 'Enthält Alkohol (Abgabe ab 18)')}</div>
    </div><div class="form2__r"><span class="mono leise">So steht es im Shop</span><div id="p-vor"></div></div></div>
    <div class="fehler" id="p-f" role="alert"></div>
    <div class="fenster__kn">${!neu && p0.eigen ? '<button class="link" type="button" id="p-weg" style="margin-right:auto">Produkt löschen</button>' : ''}<button class="kn kn--linie" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="p-ok">${neu ? 'Produkt anlegen' : 'Speichern'}</button></div>`, true);
  const f = $('#fenster');
  const lies = () => {
    st.n = $('#p-n').value.trim(); st.kurz = $('#p-kurz').value.trim();
    st.lang = $('#p-lang').value.split(/\n\s*\n/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
    st.det = $('#p-det').value.split('\n').map(x => x.trim()).filter(Boolean);
    st.marke = markeW === 'eigen' ? $('#p-marke').value.trim() : markeW;
    st.versteckt = !$('#p-sicht').checked;
    if (!gut) { st.aus = $('#p-aus').checked; st.alk = $('#p-alk').checked; }
    if (!gut && art === 'ein' && $('#p-p')) st.p = $('#p-p').value.trim();
    if (!gut && art === 'mehr' && $('#p-vn')) { st.vn = $('#p-vn').value.trim(); st.v = $$('.vz', f).map(z => [$('.vl', z).value.trim(), $('.vp', z).value.trim()]); }
  };
  const preisH = () => {
    $('#p-preis').innerHTML = gut ? '<small>Den Betrag wählt der Gast beim Bestellen selbst.</small>' : chipsH('part', [['ein', 'Ein Preis'], ['mehr', 'Mehrere Größen oder Varianten']], art) + (art === 'ein'
      ? `<input id="p-p" inputmode="decimal" value="${h(zahlT(st.p))}" placeholder="z. B. 25">`
      : `<input id="p-vn" maxlength="30" value="${h(st.vn || 'Größe')}" placeholder="Wie heißt die Auswahl? z. B. Größe"><div id="p-vl">${(st.v.length ? st.v : [['', '']]).map(([l, pr]) => `<div class="vz"><input class="vl" maxlength="30" value="${h(l)}" placeholder="z. B. M"><input class="vp" inputmode="decimal" value="${h(zahlT(pr))}" placeholder="Preis"><button class="rund" type="button" data-akt="vweg" aria-label="Zeile entfernen">${SYM.zu}</button></div>`).join('')}</div><button class="link" type="button" data-akt="vneu">Weitere Zeile</button>`);
  };
  const fotosH = () => {
    $('#p-fotos').innerHTML = `<div class="fotos">${st.b.map((k, i) => `<div class="foto"><img src="${bildadr(k)}" alt="">${i === 0 ? '<i>Hauptbild</i>' : `<button class="foto__v" type="button" data-akt="fvor" data-i="${i}">Als Hauptbild</button>`}<button class="foto__x" type="button" data-akt="fweg" data-i="${i}" aria-label="Foto entfernen">${SYM.zu}</button></div>`).join('')}
      ${st.b.length < 10 ? `<button class="foto foto--neu" type="button" data-akt="fneu"><b>+</b><span>Foto hinzufügen</span></button>` : ''}</div>`;
  };
  const preisText = () => gut ? 'Betrag frei wählbar' : art === 'mehr' ? (() => { const ps = st.v.map(x => parseFloat(String(x[1]).replace(',', '.'))).filter(x => x > 0).sort((a, b) => a - b); return ps.length ? (ps[0] === ps[ps.length - 1] ? '' : 'ab ') + ps[0].toFixed(2).replace('.', ',') + ' €' : ''; })()
    : (() => { const x = parseFloat(String(st.p).replace(',', '.')); return x > 0 ? x.toFixed(2).replace('.', ',') + ' €' : ''; })();
  const vorH = () => {
    $('#p-vor').innerHTML = `<div class="vp2${st.versteckt ? ' aus' : ''}"><div class="vp2__b">${st.b[0] ? `<img src="${bildadr(st.b[0])}" alt="">` : ST('herz')}${st.marke || st.aus ? `<i class="marke hell">${h(st.aus ? 'Ausverkauft' : st.marke)}</i>` : ''}</div><b>${h(st.n || 'Name des Produkts')}</b><span>${h(preisText())}</span></div>
      <p class="vor__h">${st.versteckt ? 'Ausgeblendet: steht nicht im Shop.' : h(Z.shopgruppen[st.g]) + (neu ? ' · bekommt eine eigene Seite' : '')}</p>${st.kurz ? `<p class="vor__k">${h(st.kurz)}</p>` : ''}`;
  };
  preisH(); fotosH(); vorH();
  f.oninput = () => { lies(); vorH(); $('#p-f').textContent = ''; };
  f.bei = ev => {
    const { name, wert } = ev.detail;
    lies();
    if (name === 'g') st.g = wert;
    if (name === 'part') { art = wert; if (art === 'mehr' && !st.v.length) st.v = [['', zahlT(st.p)]]; preisH(); }
    if (name === 'marke') { markeW = wert; $('#p-marke').hidden = wert !== 'eigen'; if (wert === 'eigen') $('#p-marke').focus(); st.marke = wert === 'eigen' ? $('#p-marke').value.trim() : wert; }
    vorH();
  };
  f.onclick = async ev => {
    const b = ev.target.closest('[data-akt]');
    if (!b) return;
    const akt = b.dataset.akt, i = +b.dataset.i;
    lies();
    if (akt === 'vneu') { st.v.push(['', '']); preisH(); $$('.vl', f).pop().focus(); }
    else if (akt === 'vweg') { st.v.splice($$('.vz', f).indexOf(b.closest('.vz')), 1); preisH(); }
    else if (akt === 'fneu') { const r = await hochladen(''); if (r) { st.b.push(r.key); fotosH(); $('#p-f').textContent = ''; } }
    else if (akt === 'fweg') { st.b.splice(i, 1); fotosH(); }
    else if (akt === 'fvor') { st.b.unshift(st.b.splice(i, 1)[0]); fotosH(); }
    else return;
    vorH();
  };
  const weg = $('#p-weg');
  if (weg) weg.addEventListener('click', () => frage('Produkt <em>löschen?</em>', `„${h(p0.n)}“ und seine Seite verschwinden aus dem Shop.`, 'Löschen', async () => { if (await tun({ art: 'shop-weg', id }, { titel: 'Produkt gelöscht', text: p0.n })) neuZeichnen(); }));
  $('#p-ok').addEventListener('click', async ev => {
    lies();
    const fe = $('#p-f');
    fe.textContent = '';
    if (!st.n) { fe.textContent = 'Bitte einen Namen eintragen.'; $('#p-n').focus(); return; }
    if (!st.b.length) { fe.textContent = 'Bitte mindestens ein Foto hinzufügen.'; return; }
    if (!gut && art === 'ein' && !(parseFloat(String(st.p).replace(',', '.')) > 0)) { fe.textContent = 'Bitte einen Preis eintragen, zum Beispiel 25 oder 25,50.'; $('#p-p').focus(); return; }
    const v = st.v.filter(x => x[0] || x[1]);
    if (!gut && art === 'mehr' && (!v.length || v.some(x => !x[0] || !(parseFloat(String(x[1]).replace(',', '.')) > 0)))) { fe.textContent = 'Jede Zeile braucht eine Bezeichnung und einen Preis.'; return; }
    const felder = { g: st.g, n: st.n, kurz: st.kurz, marke: st.marke, lang: st.lang, det: st.det, b: st.b, versteckt: st.versteckt, ...(gut ? {} : { aus: st.aus, alk: st.alk, ...(art === 'ein' ? { p: st.p, v: [] } : { v, vn: st.vn || 'Größe' }) }) };
    ev.target.disabled = true;
    try {
      if (neu) {
        const davor = new Set(Object.keys(Z.shop));
        await aendern({ art: 'shop-neu', felder });
        const nid = Object.keys(Z.shop).find(k => !davor.has(k));
        BLITZ = nid;
        quittung('Produkt angelegt', `${st.n} · ${Z.shopgruppen[st.g]}`, { id: 's:' + nid, zurueck: { art: 'shop-weg', id: nid } });
      } else {
        await aendern({ art: 'shop', id, felder });
        BLITZ = id;
        quittung('Produkt gespeichert', st.n, { id: 's:' + id, zurueck: { art: 'shop', id, felder: felderVon(p0) } });
      }
      fensterZu();
      if (location.hash.startsWith('#/shop')) neuZeichnen(); else location.hash = '#/shop';
    } catch (e) { fe.textContent = e.message; }
    ev.target.disabled = false;
  });
  if (neu) $('#p-n').focus();
}

// ---------------------------------------------------------------- Änderungen
function aenderungenS() {
  const cs = nachZeit(), n = cs.length;
  const pfeil = '<svg viewBox="0 0 22 22"><path d="M3 11h15M13 6l5 5-5 5"/></svg>';
  const kern = c => {
    if (c.art === 'bild') return `<div class="vn"><div class="alt"><span>Vorher</span><img src="${h(c.vorher)}" alt=""></div>${pfeil}<div class="neu"><span>Nachher</span><img src="${h(c.nachher)}" alt=""></div></div>`;
    if (c.art === 'karte' || c.art === 'liste' || c.art === 'sprache') return `<ul class="punkte">${c.punkte.map(p => `<li class="${p.was}"><i>${{ neu: 'Neu', weg: 'Entfernt', anders: 'Geändert', reihe: 'Sortiert' }[p.was]}</i><div><b>${h(p.name)}</b> <span>${h(p.text)}</span></div></li>`).join('')}</ul>`;
    if (c.art === 'shop') return c.teile.map(t => `<div class="vn"><div class="alt"><span>${h(t.feld)} vorher</span>${h(t.vorher) || '–'}</div>${pfeil}<div class="neu"><span>${h(t.feld)} nachher</span>${h(t.nachher)}</div></div>`).join('');
    return `<div class="vn"><div class="alt"><span>Vorher</span>${h(c.vorher) || '–'}</div>${pfeil}<div class="neu"><span>Nachher</span>${h(c.nachher) || '–'}</div></div>`;
  };
  const karteC = c => `<article class="aend" data-id="${h(c.id)}"><div class="aend__z">${ST(ARTZ[c.art])}</div>
    <div><h3>${h(c.titel)}<small>${h(c.ort || '')}${c.zeit ? ' · gespeichert ' + vor(c.zeit) : ''}</small></h3>${kern(c)}
      ${c.verwaist ? '<p class="hinweis" style="margin-top:14px">Diese Stelle gibt es auf der Seite nicht mehr. Die Änderung hat deshalb keine Wirkung.</p>' : ''}
      ${c.seiten.length ? `<div class="wo"><span>${c.anzahl > 1 ? mal(c.anzahl, 'Stelle', 'Stellen') + ' auf' : 'Steht auf'}</span>${c.seiten.slice(0, 9).map(s => `<button type="button" data-akt="sehen" data-seite="${h(s.datei)}">${h(s.name)}${s.zahl > 1 ? `<b>${s.zahl}</b>` : ''}</button>`).join('')}${c.seiten.length > 9 ? `<span>und ${c.seiten.length - 9} weiteren</span>` : ''}</div>` : ''}</div>
    <div class="aend__r">${c.stellen.length ? '<button class="kn kn--klein" type="button" data-akt="sehen">Vorher/Nachher ansehen</button>' : ''}<button class="link" type="button" data-akt="weg">Zurücknehmen</button></div></article>`;
  sicht.innerHTML = `<div class="in">${kopf('Ände<em>rungen.</em>', n ? 'Das ist im Entwurf gespeichert. Schau dir jede Stelle vorher und nachher an. Erst mit „Veröffentlichen“ sehen es deine Gäste.' : '',
      n ? `<button class="kn kn--linie" type="button" data-akt="alles">Alles zurücknehmen</button><button class="kn" type="button" data-akt="raus">${mal(n, 'Änderung', 'Änderungen')} veröffentlichen</button>` : '')}
    ${n ? cs.map(karteC).join('') : `<div class="leerbild">${ST('sonne')}<b>Nichts offen.</b><p>Alles, was du geändert hast, steht auf der Website.</p><a class="kn" href="#/uebersicht">Zur Übersicht</a></div>`}</div>`;
  sicht.querySelector('.in').addEventListener('click', ev => {
    const b = ev.target.closest('[data-akt]');
    if (!b || !['sehen', 'weg'].includes(b.dataset.akt)) return;
    ev.stopPropagation();
    aktAenderung(b.dataset.akt, b.closest('.aend').dataset.id, b.dataset.seite);
  });
}
function veroeffentlichen() {
  const cs = nachZeit(), n = cs.length;
  if (!n) return;
  fenster(`<h2>Auf die Website <em>stellen?</em></h2><p>${mal(n, 'Änderung wird', 'Änderungen werden')} sofort für alle sichtbar. Jeden früheren Stand kannst du im Verlauf zurückholen.</p>
    <ul class="quittliste">${cs.map(c => `<li>${ST(ARTZ[c.art])}<span>${h(c.satz)}</span></li>`).join('')}</ul>
    <label class="feld" style="margin-top:18px"><span>Notiz für den Verlauf (freiwillig)</span><input id="f-notiz" maxlength="200" placeholder="z. B. Herbstkarte"></label>
    <div class="fenster__kn"><button class="kn kn--linie" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="f-ok">Jetzt veröffentlichen</button></div>`);
  $('#f-ok').addEventListener('click', async ev => {
    ev.target.disabled = true;
    ev.target.textContent = 'Wird veröffentlicht …';
    try {
      Z = await api('veroeffentlichen', { notiz: $('#f-notiz').value });
      rand();
      leiste();
      fenster(`<div class="erfolg"><i>${HAKEN}</i><h2>Veröffent<em>licht.</em></h2><p>Die Website zeigt jetzt den neuen Stand. Das ist live:</p></div>
        <ul class="quittliste ok">${cs.map(c => `<li><i>${HAKEN}</i><span>${h(c.satz)}</span></li>`).join('')}</ul>
        <div class="fenster__kn"><a class="kn kn--linie" href="/live/index.html" target="_blank" rel="noopener">Website ansehen</a><button class="kn" type="button" data-zu>Fertig</button></div>`);
      if (W) neuLaden({}); else zeige(true);
    } catch (e) { sag(e.message, true, e.lex); ev.target.disabled = false; ev.target.textContent = 'Jetzt veröffentlichen'; }
  });
}

// ---------------------------------------------------------------- Listen (Stellen, Fragen, Lieferanten, Logos, Zahlen, Kurs)
const LISTEN = {
  stellen: { titel: 'Stel<em>len.</em>', text: 'Offene Stellen auf der Seite „Jobs“. Bewerbungen kommen über das Formular unten auf der Seite in den Eingang.', keys: ['stellen', 'bieten'], seite: 'jobs.html', wort: 'Stelle' },
  fragen: { titel: 'Häufige <em>Fragen.</em>', text: 'Fragen und Antworten auf der Seite „Kontakt & Fragen“. Eine Leerzeile in der Antwort beginnt einen neuen Absatz, Mail-Adressen werden von selbst anklickbar.', keys: ['fragen'], seite: 'kontakt.html', wort: 'Frage' },
  lieferanten: { titel: 'Liefe<em>ranten.</em>', text: 'Die Galerie auf der Seite „Lieferanten“. Jeder Betrieb hat ein Foto, einen Text und einen Link.', keys: ['lieferanten'], seite: 'lieferanten.html', wort: 'Betrieb' },
  presse: { titel: 'Presse <em>& Partner.</em>', text: 'Die Logos auf der Presse-Seite und im Laufband der Startseite. Ein neues Logo lädst du als Bild hoch, es wird automatisch einfarbig wie die anderen.', keys: ['medien', 'partner'], seite: 'presse.html', wort: 'Logo' },
  zahlen: { titel: 'Zahlen <em>& Kurs.</em>', text: 'Die großen Zahlen auf der Startseite und auf „Über uns“ und die Länder auf dem Kursblatt der Karten-Seite.', keys: ['zahlen.start', 'zahlen.ueber', 'ziele'], seite: 'index.html', wort: 'Eintrag' },
};
const WORTE = { stellen: 'Stelle', bieten: 'Punkt', fragen: 'Frage', lieferanten: 'Betrieb', medien: 'Logo', partner: 'Logo', 'zahlen.start': 'Zahl', 'zahlen.ueber': 'Zahl', ziele: 'Land' };
const feldWert = (x, f) => f[2] === 'liste' ? (x[f[0]] || []).join(', ') : f[2] === 'logo' ? ((Z.logos[x[f[0]]] || {}).name || x[f[0]] || '') : String(x[f[0]] ?? '');
const listeName = (x, g) => { const f = g.felder.find(f => f[2] === 'text' && x[f[0]]) || g.felder.find(f => f[2] === 'logo' && x[f[0]]); return f ? feldWert(x, f) : feldWert(x, g.felder[0]); };
function listeStatus(g) {
  const norm = l => JSON.stringify(l.map(x => Object.fromEntries(g.felder.map(f => [f[0], f[2] === 'liste' ? (x[f[0]] || []) : (x[f[0]] ?? '')]))));
  const a = g.stand, b = g.liste, na = a.map(x => listeName(x, g)), nb = b.map(x => listeName(x, g)), gleich = a.length === b.length;
  return { status: b.map((x, i) => { const j = na.includes(nb[i]) ? na.indexOf(nb[i]) : (gleich && !nb.includes(na[i]) ? i : -1); return j < 0 ? 'neu' : (norm([a[j]]) !== norm([x]) ? 'anders' : ''); }), weg: a.filter((y, i) => !nb.includes(na[i]) && !(gleich && !na.includes(nb[i]))) };
}
function listeBlatt(key) {
  const g = Z.listen[key];
  if (!g) return '';
  const st = listeStatus(g), bildF = g.felder.find(f => f[2] === 'bild' || f[2] === 'logo'), zweit = g.felder.filter(f => f[2] !== 'bild' && f[2] !== 'logo' && f[2] !== 'liste').slice(1, 3);
  const zeile = (x, i) => `<div class="gz${BLITZ === key + ':' + i ? ' blitz' : ''}" data-i="${i}">
      ${bildF ? `<button class="gz__b${bildF[2] === 'logo' ? ' gz__b--logo' : ''}" type="button" data-akt="edit" tabindex="-1" aria-hidden="true">${x[bildF[0]] ? (bildF[2] === 'logo' ? `<span class="firma" style="--m:url(/assets/logo/firma-${h(x[bildF[0]])}.png)"></span>` : `<img src="${bildadr(x[bildF[0]])}" alt="" loading="lazy">`) : SYM.bild}</button>` : ''}
      <button class="gz__t" type="button" data-akt="edit" title="Bearbeiten"><b>${h(listeName(x, g)) || '<i>ohne Namen</i>'}</b>${zweit.map(f => feldWert(x, f)).filter(Boolean).length ? `<span>${h(zweit.map(f => feldWert(x, f)).filter(Boolean).join(' · '))}</span>` : ''}</button>
      <span class="gz__s">${st.status[i] === 'neu' ? '<i class="marke rot">Neu im Entwurf</i>' : st.status[i] === 'anders' ? '<i class="marke rot">Geändert</i>' : ''}</span><span class="gz__p"></span>
      <div class="gz__r"><button class="rund" type="button" data-akt="hoch" aria-label="Nach oben"${i === 0 ? ' disabled' : ''}>${SYM.hoch}</button><button class="rund" type="button" data-akt="runter" aria-label="Nach unten"${i === g.liste.length - 1 ? ' disabled' : ''}>${SYM.runter}</button>
        <button class="rund" type="button" data-akt="weg" title="Entfernen" aria-label="Entfernen">${SYM.korb}</button><button class="kn kn--klein kn--linie" type="button" data-akt="edit">Bearbeiten</button></div></div>`;
  return `<section class="blatt gruppe" data-l="${h(key)}"><div class="gruppe__k"><h3>${h(g.label)}<span>${String(g.liste.length).padStart(2, '0')}</span></h3>${g.eigen ? '<i class="marke rot">Im Entwurf geändert</i>' : ''}<button class="kn kn--klein" type="button" data-akt="neu">${WORTE[key] || 'Eintrag'} hinzufügen</button></div>
    ${g.hinweis ? `<p class="gruppe__hin">${h(g.hinweis)}</p>` : ''}
    <div class="zeilen">${g.liste.map(zeile).join('')}${st.weg.map(y => `<div class="gz weg"><span class="gz__t"><b>${h(listeName(y, g))}</b></span><span class="gz__s"><i class="marke grau">Entfernt, noch nicht veröffentlicht</i></span><span class="gz__p"></span><div class="gz__r"><button class="kn kn--klein kn--linie" type="button" data-akt="hol" data-n="${h(listeName(y, g))}">Zurückholen</button></div></div>`).join('')}
      ${g.liste.length || st.weg.length ? '' : '<p class="gz leer">Noch nichts in dieser Liste.</p>'}</div>
    ${g.eigen ? '<div class="gruppe__f"><button class="link" type="button" data-akt="std">Alle Änderungen in dieser Liste zurücknehmen</button></div>' : ''}</section>`;
}
function listenKlick(ev) {
  const b = ev.target.closest('[data-akt]'), sec = b && b.closest('[data-l]');
  if (!sec) return false;
  const key = sec.dataset.l, g = Z.listen[key], z = b.closest('.gz'), i = z && z.dataset.i !== undefined ? +z.dataset.i : -1, akt = b.dataset.akt;
  const alt = g.liste.map(x => ({ ...x })), l = alt.map(x => ({ ...x }));
  const sende = async (liste, titel, text) => { if (await tun({ art: 'liste', key, liste }, { titel, text, id: 'l:' + key, zurueck: { art: 'liste', key, liste: alt } })) neuZeichnen(); };
  if (akt === 'neu') listeFenster(key);
  else if (akt === 'edit') listeFenster(key, i);
  else if (akt === 'std') frage('Änderungen <em>zurücknehmen?</em>', `„${h(g.label)}“ steht danach wieder so da wie auf der Website.`, 'Zurücknehmen', async () => { await aendern({ art: 'verwerfen', id: 'l:' + key }); sag('Zurückgenommen: ' + g.label); neuZeichnen(); });
  else if (akt === 'hol') { const y = g.stand.find(x => listeName(x, g) === b.dataset.n), pos = platzNach(g.stand, y, l, x => listeName(x, g), x => listeName(x, g)); l.splice(pos, 0, { ...y }); BLITZ = key + ':' + pos; sende(l, 'Wieder da', listeName(y, g)); }
  else if (akt === 'hoch' && i > 0) { [l[i - 1], l[i]] = [l[i], l[i - 1]]; BLITZ = key + ':' + (i - 1); sende(l, 'Reihenfolge gespeichert', listeName(l[i - 1], g)); }
  else if (akt === 'runter' && i < l.length - 1) { [l[i + 1], l[i]] = [l[i], l[i + 1]]; BLITZ = key + ':' + (i + 1); sende(l, 'Reihenfolge gespeichert', listeName(l[i + 1], g)); }
  else if (akt === 'weg') frage('Eintrag <em>entfernen?</em>', `„${h(listeName(alt[i], g))}“ verschwindet aus „${h(g.label)}“. Bis zum Veröffentlichen kannst du es zurückholen.`, 'Entfernen', async () => { l.splice(i, 1); await sende(l, 'Entfernt', listeName(alt[i], g)); });
  else return false;
  return true;
}
function listenAnsicht(name) {
  const a = LISTEN[name];
  sicht.innerHTML = `<div class="in">${kopf(a.titel, a.text, `<a class="kn kn--linie" href="/entwurf/${a.seite}" target="_blank" rel="noopener">Seite im Entwurf ansehen</a>`)}${a.keys.map(listeBlatt).join('')}</div>`;
  const blitz = $('.gz.blitz', sicht);
  BLITZ = null;
  if (blitz) blitz.scrollIntoView({ block: 'center' });
  sicht.querySelector('.in').addEventListener('click', listenKlick);
}
function feldH(f, wert, id) {
  const [k, label, art] = f;
  if (art === 'lang') return `<label class="feld"><span>${h(label)}</span><textarea id="${id}" rows="5">${h(wert ?? '')}</textarea></label>`;
  if (art === 'liste') return `<label class="feld"><span>${h(label)}</span><textarea id="${id}" rows="4" placeholder="Ein Punkt je Zeile">${h((wert || []).join('\n'))}</textarea></label>`;
  if (art === 'zahl') return `<label class="feld"><span>${h(label)}</span><input id="${id}" inputmode="decimal" value="${h(String(wert ?? '').replace('.', ','))}"></label>`;
  if (art === 'link') return `<label class="feld"><span>${h(label)}</span><input id="${id}" inputmode="url" value="${h(wert ?? '')}" placeholder="https://…"></label>`;
  if (art === 'bild') return `<div class="feld" data-bildfeld="${k}"><span>${h(label)}</span><div class="fotowahl">${wert ? `<img src="${bildadr(wert)}" alt="">` : `<div class="fotowahl__leer">${ST('sonne')}</div>`}<div><button class="kn kn--klein kn--linie" type="button" data-akt="foto">${wert ? 'Anderes Foto' : 'Foto wählen'}</button>${wert ? '<button class="link" type="button" data-akt="ohnefoto">Ohne Foto</button>' : ''}</div></div></div>`;
  if (art === 'logo') return `<div class="feld" data-logofeld="${k}"><span>${h(label)}</span><div class="fotowahl">${wert ? `<span class="logovor"><span class="firma" style="--m:url(/assets/logo/firma-${h(wert)}.png)"></span></span>` : `<div class="fotowahl__leer">${ST('sonne')}</div>`}<div><button class="kn kn--klein kn--linie" type="button" data-akt="logo">${wert ? 'Anderes Logo hochladen' : 'Logo hochladen'}</button><button class="link" type="button" data-akt="logowahl">Vorhandenes Logo wählen</button></div></div></div>`;
  return `<label class="feld"><span>${h(label)}</span><input id="${id}" maxlength="400" value="${h(wert ?? '')}"></label>`;
}
function listeFenster(key, i, vorlage) {
  const g = Z.listen[key], neu = i === undefined, st = neu ? { ...(vorlage || {}) } : { ...g.liste[i] };
  const wort = WORTE[key] || 'Eintrag';
  fenster(`<h2>${neu ? `${h(wort)} <em>hinzufügen.</em>` : `${h(wort)} <em>bearbeiten.</em>`}</h2><p class="form2__ort" style="margin-top:6px">${h(g.label)}</p>
    <div class="form1">${g.felder.map((f, n) => feldH(f, st[f[0]], 'lf-' + n)).join('')}</div>
    <div class="fehler" id="lf-f" role="alert"></div>
    <div class="fenster__kn"><button class="kn kn--linie" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="lf-ok">${neu ? 'Hinzufügen' : 'Speichern'}</button></div>`, true);
  const f = $('#fenster');
  const lies = () => { g.felder.forEach((fd, n) => { const el = $('#lf-' + n); if (!el) return; st[fd[0]] = fd[2] === 'liste' ? el.value.split('\n').map(x => x.trim()).filter(Boolean) : el.value; }); };
  const neuMal = () => { lies(); const bf = g.felder.find(x => x[2] === 'bild'), lf = g.felder.find(x => x[2] === 'logo'); if (bf) $(`[data-bildfeld="${bf[0]}"]`).outerHTML = feldH(bf, st[bf[0]], ''); if (lf) $(`[data-logofeld="${lf[0]}"]`).outerHTML = feldH(lf, st[lf[0]], ''); };
  f.onclick = async ev => {
    const b = ev.target.closest('[data-akt]');
    if (!b) return;
    const bf = g.felder.find(x => x[2] === 'bild'), lf = g.felder.find(x => x[2] === 'logo');
    if (b.dataset.akt === 'foto') { const r = await hochladen(''); if (r) { lies(); st[bf[0]] = r.key; neuMal(); } }
    if (b.dataset.akt === 'ohnefoto') { lies(); st[bf[0]] = ''; neuMal(); }
    if (b.dataset.akt === 'logo') { const d = await waehleDatei(); if (!d) return; lies(); const r = await ladeLogo(d, st.name || ''); if (r) { st[lf[0]] = r.key; if (!st.name) st.name = r.name; neuMal(); const nf = g.felder.findIndex(x => x[0] === 'name'); if (nf >= 0 && $('#lf-' + nf) && !$('#lf-' + nf).value) $('#lf-' + nf).value = r.name; } }
    if (b.dataset.akt === 'logowahl') { lies(); logoWahl(k => { st[lf[0]] = k; neuMal(); $('#lf-f').textContent = ''; const nf = g.felder.findIndex(x => x[0] === 'name'); if (nf >= 0 && $('#lf-' + nf) && !$('#lf-' + nf).value && Z.logos[k]) $('#lf-' + nf).value = Z.logos[k].name; }); }
  };
  $('#lf-ok').addEventListener('click', async ev => {
    lies();
    const fe = $('#lf-f');
    fe.textContent = '';
    if (!listeName(st, g)) { fe.textContent = 'Bitte mindestens das erste Feld ausfüllen.'; return; }
    const alt = g.liste.map(x => ({ ...x })), liste = alt.map(x => ({ ...x }));
    if (neu) liste.push(st); else liste[i] = st;
    ev.target.disabled = true;
    const ok = await tun({ art: 'liste', key, liste }, { titel: neu ? `${wort} hinzugefügt` : `${wort} gespeichert`, text: `${listeName(st, g)} · ${g.label}`, id: 'l:' + key, zurueck: { art: 'liste', key, liste: alt } });
    ev.target.disabled = false;
    if (!ok) return;
    fensterZu();
    BLITZ = key + ':' + (neu ? liste.length - 1 : i);
    const ziel = Object.entries(LISTEN).find(([, a]) => a.keys.includes(key));
    if (W) neuLaden({}); else if (ziel && location.hash !== '#/' + ziel[0]) location.hash = '#/' + ziel[0]; else neuZeichnen();
  });
  const erstes = $('#lf-0');
  if (erstes) erstes.focus();
}
async function ladeLogo(datei, name) {
  if (!/^image\/(jpeg|png|webp)$/.test(datei.type)) { sag('Bitte ein PNG, JPG oder WebP wählen.', true); return null; }
  sag('Das Logo wird vorbereitet …');
  try {
    const r = await api('hochladen?art=logo&name=' + encodeURIComponent(name || datei.name.replace(/\.[^.]+$/, '')), datei, true);
    Z.logos[r.key] = { name: r.name, b: r.b, neu: true };
    return r;
  } catch (e) { sag(e.message, true, e.lex); return null; }
}
function logoWahl(dann) {
  // Die Auswahl legt sich über das Formular, statt es zu ersetzen: Eingaben und Knöpfe des Formulars bleiben, wie sie sind.
  const k = $('#fenster .fenster__k'), rest = [...k.children].filter(c => !c.matches('.zu'));
  const w = document.createElement('div');
  w.innerHTML = `<h2>Logo <em>wählen.</em></h2><div class="logowand">${Object.entries(Z.logos).map(([key, l]) => `<button type="button" data-k="${h(key)}" title="${h(l.name)}"><span class="firma" style="--m:url(/assets/logo/firma-${h(key)}.png)"></span><small>${h(l.name)}</small></button>`).join('')}</div>
    <div class="fenster__kn"><button class="kn kn--linie" type="button" id="lw-zu">Zurück</button></div>`;
  const war = rest.map(c => c.hidden);
  rest.forEach(c => { c.hidden = true; });
  k.appendChild(w);
  k.scrollTop = 0;
  const zurueck = () => { w.remove(); rest.forEach((c, i) => { c.hidden = war[i]; }); };
  $('#lw-zu', w).addEventListener('click', zurueck);
  $$('.logowand button', w).forEach(b => b.addEventListener('click', () => { zurueck(); dann(b.dataset.k); }));
}

// ---------------------------------------------------------------- Hinweis für Gäste
function hinweisS() {
  const hw = Z.hinweis, aktiv = hw.an && hw.text;
  sicht.innerHTML = `<div class="in">${kopf('Hinweis für <em>Gäste.</em>', 'Ein Streifen ganz oben auf jeder Seite: Betriebsferien, Feiertage, geschlossene Gesellschaft. Du kannst ihn zeitlich begrenzen, dann verschwindet er von selbst.')}
    <section class="blatt" style="max-width:760px"><div class="form1">
      ${schalter('hw-an', hw.an, 'Hinweis zeigen')}
      <label class="feld"><span>Text</span><textarea id="hw-text" rows="2" maxlength="300" placeholder="z. B. Betriebsferien vom 20. bis 28. Oktober. Ab dem 29. sind wir wieder für euch da.">${h(hw.text)}</textarea></label>
      <div class="raster r-2"><label class="feld"><span>Zeigen ab (freiwillig)</span><input id="hw-von" type="date" value="${h(hw.von)}"></label><label class="feld"><span>Zeigen bis (freiwillig)</span><input id="hw-bis" type="date" value="${h(hw.bis)}"></label></div>
      <div class="raster r-2"><label class="feld"><span>Link (freiwillig)</span><select id="hw-link"><option value="">Kein Link</option>${Z.seiten.map(s => `<option value="${h(s.datei)}"${hw.link === s.datei ? ' selected' : ''}>${h(s.name)}</option>`).join('')}</select></label><label class="feld"><span>Beschriftung des Links</span><input id="hw-lt" maxlength="60" value="${h(hw.linktext)}" placeholder="Mehr"></label></div>
      <div class="feld"><span>So sieht es aus</span><div class="hwvor${aktiv ? '' : ' aus'}" id="hw-vor"></div></div>
      <div class="sichern offen" style="position:static;margin:0"><i></i><span id="hw-stand"></span><button class="kn kn--klein" type="button" id="hw-ok">Speichern</button></div>
    </div></section></div>`;
  const vor = () => { const t = $('#hw-text').value.trim(), lt = $('#hw-lt').value.trim() || 'Mehr', an = $('#hw-an').checked; $('#hw-vor').className = 'hwvor' + (an && t ? '' : ' aus'); $('#hw-vor').innerHTML = `${ST('sonne')}<p>${h(t || 'Dein Hinweis …')}${$('#hw-link').value ? ` <a>${h(lt)}</a>` : ''}</p>`; $('#hw-stand').textContent = an && t ? 'Wird oben auf jeder Seite gezeigt' : 'Ausgeschaltet, nichts zu sehen'; };
  vor();
  sicht.querySelector('.in').addEventListener('input', vor);
  $('#hw-ok').addEventListener('click', async () => {
    const neu = { an: $('#hw-an').checked, text: $('#hw-text').value, von: $('#hw-von').value, bis: $('#hw-bis').value, link: $('#hw-link').value, linktext: $('#hw-lt').value };
    if (await tun({ art: 'hinweis', hinweis: neu }, { titel: neu.an && neu.text.trim() ? 'Hinweis gespeichert' : 'Hinweis ausgeschaltet', text: neu.text.trim().slice(0, 80), id: 'h:hinweis', zurueck: { art: 'hinweis', hinweis: hw } })) neuZeichnen();
  });
}

// ---------------------------------------------------------------- Menü & eigene Seiten
function menueS() {
  const nav = Z.nav, bekannt = Z.seiten.map(s => [s.datei, s.name]).concat(Object.entries(Z.eigene_seiten).map(([k, p]) => [k + '.html', p.titel]));
  const name = hf => (bekannt.find(([d]) => d === hf) || [hf, hf])[1];
  sicht.innerHTML = `<div class="in">${kopf('Menü <em>& Seiten.</em>', 'Das Hauptmenü oben auf jeder Seite und deine eigenen Seiten. Eine neue Seite bekommt Foto, Einleitung und Abschnitte und kann ins Menü.', `<button class="kn" type="button" data-akt="seite-neu">Neue Seite</button>`)}
    <h2 class="zw" style="margin-top:0">Hauptmenü</h2>
    <section class="blatt gruppe" data-nav><div class="gruppe__k"><h3>Menüpunkte<span>${String(nav.filter(x => !x.aus).length).padStart(2, '0')}</span></h3><button class="kn kn--klein" type="button" data-akt="nav-neu">Menüpunkt hinzufügen</button></div>
      <div class="zeilen">${nav.map((x, i) => `<div class="gz gz--nav${x.aus ? ' aus' : ''}" data-i="${i}"><span class="gz__t"><input class="n" value="${h(x.t)}" maxlength="40" aria-label="Beschriftung"><span>${h(name(x.h))}</span></span><span class="gz__s"></span><span class="gz__p"></span>
        <div class="gz__r"><button class="rund" type="button" data-akt="hoch" aria-label="Nach oben"${i === 0 ? ' disabled' : ''}>${SYM.hoch}</button><button class="rund" type="button" data-akt="runter" aria-label="Nach unten"${i === nav.length - 1 ? ' disabled' : ''}>${SYM.runter}</button><button class="rund" type="button" data-akt="aus" aria-label="${x.aus ? 'Zeigen' : 'Ausblenden'}" title="${x.aus ? 'Im Menü zeigen' : 'Aus dem Menü nehmen'}">${x.aus ? SYM.augezu : SYM.auge}</button></div></div>`).join('')}</div>
      <div class="gruppe__f"><span class="leise" style="font-size:13.5px">Die Beschriftung änderst du direkt in der Zeile.</span><div class="sichern offen" style="position:static;margin:0 0 0 auto"><i></i><span>Menü</span><button class="kn kn--klein" type="button" data-akt="nav-ok">Speichern</button></div></div></section>
    <h2 class="zw">Eigene Seiten<span>${String(Object.keys(Z.eigene_seiten).length).padStart(2, '0')}</span></h2>
    <div class="raster r-4">${Object.entries(Z.eigene_seiten).map(([slug, p]) => `<button class="sk" type="button" data-akt="seite" data-slug="${h(slug)}"><span class="sk__b">${p.bild ? `<img src="${bildadr(p.bild)}" alt="">` : ''}</span><span class="sk__t"><b>${h(p.titel)}</b><span>${slug}.html${Z.nav.some(x => x.h === slug + '.html' && !x.aus) ? ' · im Menü' : ''}</span></span></button>`).join('')}
      <button class="pk pk--neu" type="button" data-akt="seite-neu" style="min-height:200px"><i>+</i><b>Neue Seite</b><span>mit Foto, Text und Abschnitten</span></button></div></div>`;
  const wurzel = sicht.querySelector('.in');
  const liesNav = () => $$('[data-nav] .gz').map((z, i) => ({ t: $('.n', z).value.trim(), h: nav[+z.dataset.i].h, aus: z.classList.contains('aus') }));
  wurzel.addEventListener('click', async ev => {
    const b = ev.target.closest('[data-akt]');
    if (!b) return;
    const akt = b.dataset.akt, z = b.closest('.gz');
    if (akt === 'seite-neu') return seiteFenster();
    if (akt === 'seite') return seiteFenster(b.dataset.slug);
    if (akt === 'nav-neu') {
      const frei = bekannt.filter(([d]) => !nav.some(x => x.h === d));
      if (!frei.length) { sag('Alle Seiten stehen schon im Menü. Ausgeblendete holst du mit dem Auge in der Zeile zurück.'); return; }   // sonst öffnete sich eine leere Auswahl
      fenster(`<h2>Menüpunkt <em>hinzufügen.</em></h2><label class="feld" style="margin-top:18px"><span>Seite</span><select id="nv-h">${frei.map(([d, n]) => `<option value="${h(d)}">${h(n)}</option>`).join('')}</select></label><label class="feld" style="margin-top:14px"><span>Beschriftung im Menü</span><input id="nv-t" maxlength="40"></label>
        <div class="fenster__kn"><button class="kn kn--linie" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="nv-ok">Hinzufügen</button></div>`);
      $('#nv-h').addEventListener('change', () => { $('#nv-t').value = name($('#nv-h').value); });
      $('#nv-t').value = frei.length ? name(frei[0][0]) : '';
      $('#nv-ok').addEventListener('click', async () => { const l = liesNav().concat([{ t: $('#nv-t').value.trim() || name($('#nv-h').value), h: $('#nv-h').value, aus: false }]); if (await tun({ art: 'nav', liste: l }, { titel: 'Menüpunkt hinzugefügt', text: l[l.length - 1].t, zurueck: { art: 'nav', liste: nav } })) { fensterZu(); neuZeichnen(); } });
      return;
    }
    const l = liesNav(), i = z ? +z.dataset.i : -1;
    if (akt === 'hoch' && i > 0) [l[i - 1], l[i]] = [l[i], l[i - 1]];
    else if (akt === 'runter' && i >= 0 && i < l.length - 1) [l[i + 1], l[i]] = [l[i], l[i + 1]];
    else if (akt === 'aus' && i >= 0) l[i].aus = !l[i].aus;
    else if (akt !== 'nav-ok') return;
    if (await tun({ art: 'nav', liste: l }, { titel: 'Menü gespeichert', text: l.filter(x => !x.aus).map(x => x.t).join(' · '), zurueck: { art: 'nav', liste: nav } })) neuZeichnen();
  });
}
function seiteFenster(slug) {
  const neu = !slug, p0 = neu ? null : Z.eigene_seiten[slug];
  const st = neu ? { titel: '', kopfz: '', h1: '', intro: '', beschr: '', bild: null, im_menue: true, abschnitte: [{ u: '', t: '', b: null }] } : JSON.parse(JSON.stringify(p0));
  if (!neu) st.im_menue = Z.nav.some(x => x.h === slug + '.html' && !x.aus);  // der Schalter zeigt, was im Menü wirklich steht
  fenster(`<h2>${neu ? 'Neue <em>Seite.</em>' : 'Seite <em>bearbeiten.</em>'}</h2>${neu ? '' : `<p class="form2__ort" style="margin-top:6px">${h(slug)}.html</p>`}
    <div class="form1">
      <div class="raster r-2"><label class="feld"><span>Titel der Seite</span><input id="ps-titel" maxlength="80" value="${h(st.titel)}" placeholder="z. B. Events"></label><label class="feld"><span>Kleine Zeile über der Überschrift</span><input id="ps-kopfz" maxlength="60" value="${h(st.kopfz)}" placeholder="z. B. Feiern bei uns"></label></div>
      <label class="feld"><span>Große Überschrift</span><input id="ps-h1" maxlength="120" value="${h(st.h1)}" placeholder="Leer = Titel der Seite"></label>
      <label class="feld"><span>Einleitung</span><textarea id="ps-intro" rows="3" maxlength="600">${h(st.intro)}</textarea></label>
      <div class="feld" id="ps-bild"></div>
      <div class="feld"><span>Abschnitte</span><div id="ps-abs"></div><button class="link" type="button" data-akt="abs-neu" style="justify-self:start;margin-top:8px">Abschnitt hinzufügen</button></div>
      ${schalter('ps-menue', st.im_menue, 'Im Hauptmenü zeigen')}
      <label class="feld"><span>Beschreibung bei Google (freiwillig)</span><input id="ps-beschr" maxlength="320" value="${h(st.beschr)}"></label>
    </div>
    <div class="fehler" id="ps-f" role="alert"></div>
    <div class="fenster__kn">${neu ? '' : '<button class="link" type="button" id="ps-weg" style="margin-right:auto">Seite löschen</button>'}<button class="kn kn--linie" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="ps-ok">${neu ? 'Seite anlegen' : 'Speichern'}</button></div>`, true);
  const f = $('#fenster');
  const lies = () => { st.titel = $('#ps-titel').value.trim(); st.kopfz = $('#ps-kopfz').value.trim(); st.h1 = $('#ps-h1').value.trim(); st.intro = $('#ps-intro').value; st.beschr = $('#ps-beschr').value.trim(); st.im_menue = $('#ps-menue').checked; $$('.abs', f).forEach((a, i) => { st.abschnitte[i].u = $('.abs-u', a).value.trim(); st.abschnitte[i].t = $('.abs-t', a).value; }); };
  const mal2 = () => {
    $('#ps-bild').innerHTML = `<span>Foto im Seitenkopf</span><div class="fotowahl">${st.bild ? `<img src="${bildadr(st.bild)}" alt="">` : `<div class="fotowahl__leer">${ST('sonne')}</div>`}<div><button class="kn kn--klein kn--linie" type="button" data-akt="foto">${st.bild ? 'Anderes Foto' : 'Foto wählen'}</button>${st.bild ? '<button class="link" type="button" data-akt="ohnefoto">Ohne Foto</button>' : ''}</div></div>`;
    $('#ps-abs').innerHTML = st.abschnitte.map((a, i) => `<div class="abs" data-i="${i}"><div class="abs__k"><b>Abschnitt ${i + 1}</b><button class="link" type="button" data-akt="abs-weg" data-i="${i}">Entfernen</button></div><input class="abs-u" maxlength="120" value="${h(a.u)}" placeholder="Überschrift"><textarea class="abs-t" rows="4" placeholder="Text. Eine Leerzeile beginnt einen neuen Absatz.">${h(a.t)}</textarea>
      <div class="abs__b">${a.b ? `<img src="${bildadr(a.b)}" alt="">` : ''}<button class="link" type="button" data-akt="abs-foto" data-i="${i}">${a.b ? 'Anderes Foto' : 'Foto zum Abschnitt'}</button>${a.b ? `<button class="link" type="button" data-akt="abs-ohne" data-i="${i}">Ohne Foto</button>` : ''}</div></div>`).join('');
  };
  mal2();
  f.onclick = async ev => {
    const b = ev.target.closest('[data-akt]');
    if (!b) return;
    const akt = b.dataset.akt, i = +b.dataset.i;
    lies();
    if (akt === 'foto') { const r = await hochladen(''); if (r) st.bild = r.key; }
    else if (akt === 'ohnefoto') st.bild = null;
    else if (akt === 'abs-neu') st.abschnitte.push({ u: '', t: '', b: null });
    else if (akt === 'abs-weg') st.abschnitte.splice(i, 1);
    else if (akt === 'abs-foto') { const r = await hochladen(''); if (r) st.abschnitte[i].b = r.key; }
    else if (akt === 'abs-ohne') st.abschnitte[i].b = null;
    else return;
    mal2();
  };
  const weg = $('#ps-weg');
  if (weg) weg.addEventListener('click', () => frage('Seite <em>löschen?</em>', `„${h(p0.titel)}“ verschwindet von der Website und aus dem Menü.`, 'Löschen', async () => { if (await tun({ art: 'seite-weg', slug }, { titel: 'Seite gelöscht', text: p0.titel })) { fensterZu(); neuZeichnen(); } }));
  $('#ps-ok').addEventListener('click', async ev => {
    lies();
    if (!st.titel) { $('#ps-f').textContent = 'Bitte einen Titel eintragen.'; return; }
    ev.target.disabled = true;
    try {
      const davor = new Set(Object.keys(Z.eigene_seiten));
      await aendern({ art: 'seite', slug: slug || '', seite: st });
      const ns = slug || Object.keys(Z.eigene_seiten).find(k => !davor.has(k));
      if (ns) {  // der Schalter „Im Hauptmenü zeigen“ gilt beim Anlegen und beim Bearbeiten
        const hf = ns + '.html', da = Z.nav.find(x => x.h === hf);
        if (st.im_menue && !da) await aendern({ art: 'nav', liste: Z.nav.concat([{ t: st.titel, h: hf, aus: false }]) }).catch(e => sag(e.message, true, e.lex));
        else if (st.im_menue && da && da.aus) await aendern({ art: 'nav', liste: Z.nav.map(x => x.h === hf ? { ...x, aus: false } : x) }).catch(e => sag(e.message, true, e.lex));
        else if (!st.im_menue && da && !da.aus) await aendern({ art: 'nav', liste: Z.nav.filter(x => x.h !== hf) }).catch(e => sag(e.message, true, e.lex));
      }
      quittung(neu ? 'Seite angelegt' : 'Seite gespeichert', `${st.titel} · ${ns}.html`, { id: 'p:' + ns, zurueck: neu ? { art: 'seite-weg', slug: ns } : { art: 'seite', slug, seite: p0 } });
      fensterZu();
      if (location.hash.startsWith('#/menue')) neuZeichnen(); else location.hash = '#/menue';
    } catch (e) { $('#ps-f').textContent = e.message; }
    ev.target.disabled = false;
  });
  $('#ps-titel').focus();
}

// ---------------------------------------------------------------- Google-Texte und Bildbeschreibungen
function googleS(filter) {
  const seiten = Z.seiten.filter(s => s.gruppe !== 'Shop' || s.datei === 'shop.html');
  const datei = filter && Z.seo[filter] ? filter : 'index.html', so = Z.seo[datei], sd = Z.seiten.find(s => s.datei === datei);
  const alts = Object.entries(Z.alt).filter(([k]) => Z.bilder.some(b => b.key === k && b.seiten.some(x => x.datei === datei)));
  sicht.innerHTML = `<div class="in">${kopf('Google <em>& Co.</em>', 'Was Google und andere Suchmaschinen über jede Seite zeigen, und die Beschreibung jedes Bildes für Menschen, die nicht sehen können.')}
    <div class="filter">${seiten.map(s => `<button type="button" data-f="${h(s.datei)}" class="${s.datei === datei ? 'an' : ''}">${h(s.name)}</button>`).join('')}</div>
    <section class="blatt" style="max-width:820px"><h3>Bei Google: ${h(sd ? sd.name : datei)}</h3><div class="form1" style="margin-top:16px">
      <label class="feld"><span>Titel (so steht es im Browser-Reiter und bei Google)</span><input id="se-titel" maxlength="120" value="${h(so.eigen.titel || '')}" placeholder="${h(so.titel)}"><small><span id="se-tz">${(so.eigen.titel || so.titel).length}</span> Zeichen, bis 60 sind ideal</small></label>
      <label class="feld"><span>Beschreibung (die zwei Zeilen unter dem Titel)</span><textarea id="se-beschr" rows="3" maxlength="320" placeholder="${h(so.beschr)}">${h(so.eigen.beschr || '')}</textarea><small><span id="se-bz">${(so.eigen.beschr || so.beschr).length}</span> Zeichen, bis 155 sind ideal · leer lassen heißt: Vorgabe behalten</small></label>
      <div class="gvor"><b id="gv-t">${h(so.eigen.titel || so.titel)}</b><i>saltandsilver.de › ${h(datei.replace('.html', ''))}</i><p id="gv-b">${h(so.eigen.beschr || so.beschr)}</p></div>
      <div class="sichern offen" style="position:static;margin:0"><i></i><span>Google-Text</span><button class="kn kn--klein" type="button" id="se-ok">Speichern</button></div></div></section>
    <h2 class="zw">Bildbeschreibungen<span>${String(alts.length).padStart(2, '0')}</span></h2>
    <section class="blatt" style="padding:4px 0">${alts.map(([k, a]) => `<div class="ware" data-alt="${h(k)}" style="grid-template-columns:86px minmax(0,1fr) auto;align-items:center"><img src="${bildadr(k)}" alt=""><label class="feld"><span>Beschreibung${a.eigen ? ' <i class="marke rot">Im Entwurf geändert</i>' : ''}</span><input maxlength="200" value="${h(a.eigen || '')}" placeholder="${h(a.standard || 'Was ist auf dem Bild zu sehen?')}"></label><button class="kn kn--klein kn--linie" type="button" data-akt="alt-ok">Speichern</button></div>`).join('') || '<p class="gz leer">Auf dieser Seite gibt es keine Bilder.</p>'}</section></div>`;
  const wurzel = sicht.querySelector('.in');
  wurzel.addEventListener('input', () => { const t = $('#se-titel').value.trim() || so.titel, b = $('#se-beschr').value.trim() || so.beschr; $('#gv-t').textContent = t; $('#gv-b').textContent = b; $('#se-tz').textContent = t.length; $('#se-bz').textContent = b.length; });
  wurzel.addEventListener('click', async ev => {
    const f = ev.target.closest('[data-f]'), b = ev.target.closest('[data-akt]');
    if (f) { location.hash = '#/google/' + encodeURIComponent(f.dataset.f); return; }
    if (!b) return;
    if (b.dataset.akt === 'alt-ok') { const z = b.closest('[data-alt]'), k = z.dataset.alt, alt = Z.alt[k].eigen; if (await tun({ art: 'alt', key: k, text: $('input', z).value }, { titel: 'Bildbeschreibung gespeichert', text: $('input', z).value.trim().slice(0, 80) || 'Vorgabe', id: 'a:' + k, zurueck: { art: 'alt', key: k, text: alt } })) neuZeichnen(); }
  });
  $('#se-ok').addEventListener('click', async () => { if (await tun({ art: 'seo', datei, titel: $('#se-titel').value, beschr: $('#se-beschr').value }, { titel: 'Google-Text gespeichert', text: sd ? sd.name : datei, id: 'g:' + datei, zurueck: { art: 'seo', datei, titel: so.eigen.titel || '', beschr: so.eigen.beschr || '' } })) neuZeichnen(); });
}

// ---------------------------------------------------------------- Eingang (Formulare der Website)
function eingangS(filter) {
  const alle = Z.eingang, liste = alle.filter(x => !filter || x.formular === filter), neu = alle.filter(x => !x.gelesen).length;
  const feldname = k => ({ e_mail: 'E-Mail', strasse_und_hausnummer: 'Straße und Hausnummer', postleitzahl: 'PLZ', name: 'Name', mail: 'E-Mail', stelle: 'Position', nachricht: 'Nachricht', marke: 'Marke', idee: 'Worum es geht', warenkorb: 'Warenkorb', zwischensumme: 'Zwischensumme', versand: 'Versand', gesamt: 'Gesamt', zahlung: 'Zahlungsart', land: 'Land', vorname: 'Vorname', nachname: 'Nachname', strasse: 'Straße', plz: 'PLZ', ort: 'Ort', telefon: 'Telefon', bestellnummer: 'Bestellnummer', grund: 'Grund' }[k] || (k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ')));
  const wert = (k, v) => k === 'warenkorb' && Array.isArray(v) ? `<ul class="korbliste">${v.map(p => `<li>${h(p.menge)} × ${h(p.name)}${p.zusatz ? ' (' + h(p.zusatz) + ')' : ''} · ${((Number(p.einzel) * Number(p.menge)) || 0).toFixed(2).replace('.', ',')} €</li>`).join('')}</ul>` : /^(zwischensumme|versand|gesamt)$/.test(k) ? h(String(v).replace('.', ',')) + ' €' : h(String(v));
  const karte = x => `<article class="post${x.gelesen ? '' : ' neu'}" data-id="${h(x.id)}"><div class="post__k"><span class="lade__z">${ST({ bewerbung: 'palme', newsletter: 'wal', kooperation: 'herz', widerruf: 'schaedel', bestellung: 'kaktus' }[x.formular] || 'sonne')}</span>
      <div><b>${h(Z.formulare[x.formular] || x.formular)}${x.gelesen ? '' : ' <i class="marke rot">Neu</i>'}${x.beispiel ? ' <i class="marke">Beispiel</i>' : ''}</b><small>${datum(x.zeit)}${x.felder.mail ? ' · ' + h(x.felder.mail) : ''}${x.seite ? ' · von ' + h(x.seite) : ''}</small></div>
      <div class="post__a">${(x.felder.nachricht || x.felder.idee) && x.formular !== 'bewerbung' ? `<button class="kn kn--klein" type="button" data-akt="entwurf">Antwort entwerfen</button>` : ''}${x.felder.mail ? `<a class="kn kn--klein kn--linie" href="mailto:${h(x.felder.mail)}?subject=${encodeURIComponent('Re: ' + (Z.formulare[x.formular] || ''))}">Antworten</a>` : ''}<button class="rund" type="button" data-akt="${x.gelesen ? 'ungelesen' : 'gelesen'}" title="${x.gelesen ? 'Als neu markieren' : 'Als gelesen markieren'}" aria-label="Gelesen">${x.gelesen ? SYM.augezu : SYM.auge}</button><button class="rund" type="button" data-akt="weg" title="Löschen" aria-label="Löschen">${SYM.korb}</button></div></div>
      <dl class="post__f">${Object.entries(x.felder).filter(([k, v]) => v !== '' && !/^(website|fax|betrag)$/.test(k)).map(([k, v]) => `<div><dt>${h(feldname(k))}</dt><dd>${wert(k, v)}</dd></div>`).join('')}
      ${x.anhaenge.length ? `<div><dt>Anhang</dt><dd>${x.anhaenge.map(a => `<a class="link" href="/studio/api/anhang?datei=${encodeURIComponent(a.datei)}">${h(a.name)} (${a.kb} kB)</a>`).join(' · ')}</dd></div>` : ''}
      ${x.weitergeleitet ? `<div><dt>Weitergeleitet</dt><dd>${h(String(x.weitergeleitet.status))} · ${datum(x.weitergeleitet.zeit)}</dd></div>` : ''}</dl></article>`;
  sicht.innerHTML = `<div class="in">${kopf('Ein<em>gang.</em>', `Alles, was Gäste über die Formulare der Website schicken: Bewerbungen, Newsletter-Anmeldungen, Kooperationsanfragen, Widerrufe und Bestellungen. ${neu ? `<b>${mal(neu, 'neuer Eintrag', 'neue Einträge')}.</b>` : 'Nichts Neues.'}`, `<button class="kn kn--linie" type="button" data-akt="einstellungen">Weiterleitung einrichten</button>`)}
    <div class="filter"><button type="button" data-f="" class="${filter ? '' : 'an'}">Alle</button>${Object.entries(Z.formulare).filter(([k]) => k !== 'nachricht').map(([k, n]) => `<button type="button" data-f="${k}" class="${filter === k ? 'an' : ''}">${h(n)}${alle.filter(x => x.formular === k && !x.gelesen).length ? `<b>${alle.filter(x => x.formular === k && !x.gelesen).length}</b>` : ''}</button>`).join('')}</div>
    ${liste.length ? liste.map(karte).join('') : `<div class="leerbild">${ST('wal')}<b>Noch nichts da.</b><p>Sobald jemand ein Formular auf der Website abschickt, steht es hier.</p></div>`}</div>`;
  sicht.querySelector('.in').addEventListener('click', async ev => {
    const f = ev.target.closest('[data-f]'), b = ev.target.closest('[data-akt]');
    if (f) { location.hash = '#/eingang' + (f.dataset.f ? '/' + f.dataset.f : ''); return; }
    if (!b) return;
    if (b.dataset.akt === 'einstellungen') return einstellungenFenster();
    const k = b.closest('.post');
    if (!k) return;
    if (b.dataset.akt === 'entwurf') {   // Anfrage aus dem Eingang an den Anfragen-Assistenten (Gäste im Chat)
      const x = Z.eingang.find(y => y.id === k.dataset.id), f = x.felder;
      ENTWURF_A = { mail: [f.name && 'Von: ' + f.name + (f.mail ? ' <' + f.mail + '>' : ''), f.marke && 'Marke: ' + f.marke, f.idee, f.nachricht].filter(Boolean).join('\n\n'), hinweis: '' };
      location.hash = '#/gaeste/anfragen'; return;
    }
    const tu = async () => { Z = await api('eingang', { id: k.dataset.id, tun: b.dataset.akt }); rand(); zeige(true); };
    try {
      if (b.dataset.akt === 'weg') frage('Eintrag <em>löschen?</em>', 'Der Eintrag und sein Anhang werden endgültig gelöscht.', 'Löschen', tu);
      else await tu();
    } catch (e) { sag(e.message, true, e.lex); }
  });
}
// ---------------------------------------------------------------- Gäste im Chat (Tasty Studios, 10.10.2026)
// Der Chat unten rechts auf der Website (gast/) legt jede Frage mit Antwort online im Speicher hinter /api/fragen ab. Hier liest das Team
// sie Woche für Woche; was nicht auf der Website steht, ist markiert und wird mit einem Klick zur häufigen Frage. Dazu der Anfragen-Assistent:
// Anfrage einfügen (oder aus dem Eingang holen), Entwurf im Ton von Salt & Silver bekommen, lesen, ändern, selbst schicken. Das Studio schickt nichts.
// Beides läuft nur online (Speicher und Funktion gibt es am Rechner nicht).
let FRAGEN = null, ENTWURF_A = null;
function kw(z) {
  const d = new Date(z), t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), tag = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - tag);
  const j = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)), n = Math.ceil(((t - j) / 864e5 + 1) / 7), mo = new Date(d); mo.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return { k: t.getUTCFullYear() + '-' + String(n).padStart(2, '0'), titel: 'Woche ' + n + ' · ab ' + mo.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }) };
}
const HAUSNAME = { hh: 'Salt & Silver Restaurant', cr: 'Bistro Crudo', am: 'Salt & Silver am Meer' };
function gaesteS(teil) {
  const reiter = `<div class="filter"><a href="#/gaeste" class="${teil === 'anfragen' ? '' : 'an'}">Das wurde gefragt</a><a href="#/gaeste/anfragen" class="${teil === 'anfragen' ? 'an' : ''}">Anfragen beantworten</a><a href="/im-chat/" target="_blank" rel="noopener">Was der Chat kann ↗</a></div>`;
  return teil === 'anfragen' ? anfragenS(reiter) : gefragtS(teil, reiter);
}
async function gefragtS(filter, reiter) {
  filter = filter === 'alle' || filter === 'erledigt' ? filter : 'luecke';
  const titel = 'Gäste <em>im Chat.</em>';
  sicht.innerHTML = `<div class="in">${kopf(titel, 'Was Gäste den Chat unten rechts auf der Website fragen, Woche für Woche.')}${reiter}<div class="leerbild">${ST('sonne')}<b>Einen Moment.</b><p>Die Fragen werden geladen.</p></div></div>`;
  try {
    const r = await fetch('/api/fragen', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    FRAGEN = (await r.json()).fragen || [];
  } catch (e) {
    $('.in', sicht).innerHTML = kopf(titel, '') + reiter + `<div class="leerbild">${ST('sonne')}<b>Nur online.</b><p>Die Fragen liegen im Speicher der Online-Fassung. Öffne das Studio unter salt-and-silver-studie.vercel.app/studio/.</p></div>`;
    return;
  }
  const alle = FRAGEN, luecken = alle.filter(x => !x.belegt && !x.erledigt);
  const liste = filter === 'luecke' ? luecken : filter === 'erledigt' ? alle.filter(x => x.erledigt) : alle;
  const gruppen = [];
  liste.forEach(x => { const w = kw(x.zeit); let g = gruppen.find(y => y.k === w.k); if (!g) { g = { ...w, l: [] }; gruppen.push(g); } g.l.push(x); });
  const karte = x => `<article class="post frage${x.erledigt || x.belegt ? '' : ' neu'}" data-id="${h(x.id)}"><div class="post__k"><span class="lade__z">${ST(x.buchung ? 'taco' : 'sonne')}</span>
      <div><b>${h(x.frage)}${!x.belegt && !x.erledigt ? ' <i class="marke rot">Steht nicht auf der Website</i>' : ''}${x.erledigt ? ' <i class="marke">Erledigt</i>' : ''}</b>
      <small>${datum(x.zeit)}${x.sprache && x.sprache !== 'de' ? ' · ' + ({ en: 'Englisch', fr: 'Französisch' }[x.sprache] || x.sprache) : ''}${x.buchung ? ' · Tischmaske gezeigt' : ''}${x.thema ? ' · ' + h(x.thema) : ''}</small></div>
      <div class="post__a">${x.erledigt ? `<button class="kn kn--klein kn--linie" type="button" data-akt="offen">Zurückholen</button>` : `${x.belegt ? '' : `<button class="kn kn--klein" type="button" data-akt="uebernehmen">Als häufige Frage</button>`}<button class="kn kn--klein kn--linie" type="button" data-akt="erledigt">Erledigt</button>`}</div></div>
      <details class="frage__a"><summary>Antwort im Chat</summary><p>${h(x.antwort).replace(/\n/g, '<br>')}</p></details></article>`;
  $('.in', sicht).innerHTML = kopf(titel, `Was Gäste den Chat unten rechts auf der Website fragen, Woche für Woche. ${luecken.length ? `<b>${luecken.length === 1 ? 'Eine Frage steht' : luecken.length + ' Fragen stehen'} nicht auf der Website.</b> Mit «Als häufige Frage» wird daraus ein Eintrag auf „Kontakt & Fragen“, die Antwort schreibst du selbst. Danach weiß es auch der Chat.` : 'Alles, was gefragt wurde, steht auf der Website.'}`,
      `<button class="kn kn--linie" type="button" data-akt="neu-laden">Neu laden</button>`) + reiter +
    `<section class="blatt zahlen-gefragt"><div><b>${alle.length}</b><span>Fragen gesamt</span></div><div><b>${alle.filter(x => !x.belegt).length}</b><span>nicht auf der Website</span></div><div><b>${alle.filter(x => x.buchung).length}</b><span>mit Tischmaske</span></div><div><b>${alle.filter(x => x.sprache && x.sprache !== 'de').length}</b><span>auf der englischen Seite</span></div></section>
    <div class="filter filter--klein"><button type="button" data-f="luecke" class="${filter === 'luecke' ? 'an' : ''}">Nicht auf der Website${luecken.length ? ` <b>${luecken.length}</b>` : ''}</button><button type="button" data-f="alle" class="${filter === 'alle' ? 'an' : ''}">Alle Fragen</button><button type="button" data-f="erledigt" class="${filter === 'erledigt' ? 'an' : ''}">Erledigt</button></div>
    ${gruppen.length ? gruppen.map(g => `<h2 class="woche">${h(g.titel)}<span>${g.l.length}</span></h2>${g.l.map(karte).join('')}`).join('') : `<div class="leerbild">${ST('sonne')}<b>${filter === 'luecke' ? 'Keine Lücken.' : 'Noch nichts da.'}</b><p>${filter === 'luecke' ? 'Jede Frage der Gäste ließ sich aus der Website beantworten.' : 'Sobald Gäste den Chat fragen, steht es hier.'}</p></div>`}`;
  $('.in', sicht).onclick = async ev => {
    const f = ev.target.closest('[data-f]'), b = ev.target.closest('[data-akt]');
    if (f) return gefragtS(f.dataset.f, reiter);
    if (!b) return;
    if (b.dataset.akt === 'neu-laden') return gefragtS(filter, reiter);
    const k = b.closest('.frage'), x = k && FRAGEN.find(y => y.id === k.dataset.id);
    if (!x) return;
    if (b.dataset.akt === 'uebernehmen') {
      if (!Z.listen.fragen) return sag('Die häufigen Fragen sind gerade nicht erreichbar.', true);
      listeFenster('fragen', undefined, { frage: x.frage.charAt(0).toUpperCase() + x.frage.slice(1), antwort: '' });
      sag('Schreib die Antwort so, wie sie auf der Website stehen soll. Danach hier «Erledigt» drücken.');
      return;
    }
    try {
      const r = await fetch('/api/fragen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tun: b.dataset.akt, id: x.id }) });
      if (!r.ok) throw new Error('Das hat nicht geklappt.');
      x.erledigt = b.dataset.akt === 'erledigt';
      sag(x.erledigt ? 'Erledigt.' : 'Zurückgeholt.');
      gefragtS(filter, reiter);
    } catch (e) { sag(e.message, true); }
  };
}
function anfragenS(reiter) {
  sicht.innerHTML = `<div class="in">${kopf('Anfragen <em>beantworten.</em>', 'Gruppen ab 10 Personen, ein ganzes Restaurant, Firmenfeiern, Pop-ups, Kooperationen: Füg die Anfrage ein (oder hol sie im Eingang mit «Antwort entwerfen»), der Assistent schreibt einen Entwurf im Ton von Salt & Silver, mit Preisen und Gerichten von der Website und aus den Karten. Du liest, änderst und schickst selbst. Hier wird nichts verschickt.')}${reiter}
    <section class="blatt anfrage"><div class="form1" style="margin-top:0">
      <label class="feld"><span>Anfrage</span><textarea id="an-mail" rows="9" placeholder="Die Mail hier einfügen, mit Anrede und Unterschrift.">${h(ENTWURF_A ? ENTWURF_A.mail : '')}</textarea></label>
      <label class="feld"><span>Hinweis an den Assistenten (freiwillig)</span><input id="an-hinweis" maxlength="400" placeholder="z. B. Crudo am 14. März ist frei, Fondue-Pop-up vorschlagen" value="${h(ENTWURF_A ? ENTWURF_A.hinweis : '')}"></label>
      <div class="fehler" id="an-f" role="alert"></div>
      <div class="fenster__kn" style="justify-content:flex-start;margin-top:4px"><button class="kn" type="button" id="an-los">Entwurf schreiben<i>${PF}</i></button>${ENTWURF_A && ENTWURF_A.text ? '<button class="kn kn--linie" type="button" id="an-leer">Neue Anfrage</button>' : ''}</div>
    </div></section>
    <div id="an-ergebnis">${ENTWURF_A && ENTWURF_A.text ? anfrageErgebnis(ENTWURF_A) : ''}</div></div>`;
  const los = $('#an-los');
  los.onclick = async () => {
    const mail = $('#an-mail').value.trim(), hinweis = $('#an-hinweis').value.trim(), fe = $('#an-f');
    fe.textContent = '';
    if (mail.length < 20) { fe.textContent = 'Bitte die Anfrage einfügen.'; return; }
    los.disabled = true; los.firstChild.textContent = 'Wird geschrieben …';
    $('#an-ergebnis').innerHTML = `<div class="leerbild">${ST('sonne')}<b>Einen Moment.</b><p>Der Assistent liest die Anfrage, die Website und die Karten.</p></div>`;
    try {
      const r = await fetch('/api/gast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modus: 'anfrage', mail, hinweis }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.text) throw new Error(j.fehler || (r.status === 404 ? 'Der Assistent läuft nur in der Online-Fassung (salt-and-silver-studie.vercel.app/studio/).' : 'Das hat nicht geklappt.'));
      ENTWURF_A = { mail, hinweis, ...j };
      anfragenS(reiter);
      $('#an-ergebnis').scrollIntoView({ block: 'start', behavior: 'smooth' });
    } catch (e) { fe.textContent = e.message; $('#an-ergebnis').innerHTML = ''; los.disabled = false; los.firstChild.textContent = 'Entwurf schreiben'; }
  };
  const leer = $('#an-leer');
  if (leer) leer.onclick = () => { ENTWURF_A = null; anfragenS(reiter); };
  $('#an-ergebnis').onclick = async ev => {
    const b = ev.target.closest('[data-akt]');
    if (!b || !ENTWURF_A) return;
    const betreff = $('#an-betreff').value, text = $('#an-text').value;
    if (b.dataset.akt === 'kopieren') { try { await navigator.clipboard.writeText(text); sag('Kopiert. Den Text in deine Antwort-Mail einfügen.'); } catch (e) { sag('Kopieren ging nicht. Bitte den Text markieren und kopieren.', true); } }
    if (b.dataset.akt === 'mail') {
      const an = (ENTWURF_A.mail.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [''])[0];
      location.href = 'mailto:' + an + '?subject=' + encodeURIComponent(betreff) + '&body=' + encodeURIComponent(text);
    }
  };
}
function anfrageErgebnis(a) {
  const offen = (a.text.match(/\[[^\]]+\]/g) || []).length;
  return `<section class="blatt anfrage__e"><div class="gruppe__k"><h3>Entwurf<span>${offen ? offen + (offen === 1 ? ' Stelle' : ' Stellen') + ' in [Klammern] klären' : 'bereit zum Lesen'}</span></h3></div>
    <div class="form1"><label class="feld"><span>Betreff</span><input id="an-betreff" value="${h(a.betreff || '')}"></label>
    <label class="feld"><span>Mail</span><textarea id="an-text" rows="18">${h(a.text)}</textarea></label></div>
    ${a.team ? `<div class="anfrage__team"><b>Nur fürs Team</b><p>${h(a.team).replace(/\n/g, '<br>')}</p></div>` : ''}
    <div class="fenster__kn" style="justify-content:flex-start"><button class="kn" type="button" data-akt="mail">Im Mailprogramm öffnen<i>${PF}</i></button><button class="kn kn--linie" type="button" data-akt="kopieren">Text kopieren</button></div>
    <p class="leise" style="margin-top:12px;font-size:13.5px">Erst lesen, dann senden. Alles in eckigen Klammern entscheidet das Team.</p></section>`;
}
function einstellungenFenster() {
  const E = Z.einstellungen;
  fenster(`<h2>Weiter<em>leitung.</em></h2><p>Jede Einsendung bleibt hier im Eingang. Zusätzlich kann sie an einen Dienst gehen, der daraus eine Mail macht oder sie in ein Programm schreibt (zum Beispiel Zapier, Make oder dein Newsletter-Dienst). Trag dazu die Empfangsadresse ein, die dir der Dienst gibt.</p>
    <div class="form1" style="margin-top:18px">${Object.entries(Z.formulare).filter(([k]) => k !== 'nachricht').map(([k, n]) => `<label class="feld"><span>${h(n)}</span><input data-ef="${k}" inputmode="url" value="${h((E[k] || {}).weiterleitung || '')}" placeholder="https://… (leer = keine Weiterleitung)"></label>`).join('')}</div>
    <div class="fehler" id="ef-f" role="alert"></div>
    <div class="fenster__kn"><button class="kn kn--linie" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="ef-ok">Speichern</button></div>`);
  $('#ef-ok').addEventListener('click', async () => {
    try {
      for (const i of $$('[data-ef]')) if (i.value.trim() !== ((E[i.dataset.ef] || {}).weiterleitung || '')) Z = await api('einstellung', { formular: i.dataset.ef, weiterleitung: i.value.trim() });
      rand(); fensterZu(); sag('Weiterleitung gespeichert.'); zeige(true);
    } catch (e) { $('#ef-f').textContent = e.message; }
  });
}

// ---------------------------------------------------------------- Shop: Versand & Zahlung · Karte: Gruppen
function regelnBlatt() {
  const r = Z.shopregeln;
  return `<h2 class="zw">Versand & Zahlung</h2><section class="blatt" data-regeln><div class="raster r-3">
      ${[['DE', 'Versand Deutschland'], ['EU', 'Versand EU'], ['WELT', 'Versand Schweiz & Großbritannien']].map(([k, n]) => `<label class="feld"><span>${n}</span><input data-vs="${k}" inputmode="decimal" value="${h(String(r.versand[k]).replace('.', ','))}"><small>Euro, pauschal je Bestellung</small></label>`).join('')}</div>
    <div class="feld" style="margin-top:18px"><span>Zahlungsarten an der Kasse</span><div class="schalterreihe" style="padding-top:8px">${r.alle.map(z => `<label class="schalter"><input type="checkbox" data-za="${z.id}"${r.zahlung.includes(z.id) ? ' checked' : ''}><i></i><span>${h(z.n)}</span></label>`).join('')}</div></div>
    <p class="hinweis" style="margin-top:16px">Die Kasse nimmt Bestellungen entgegen und legt sie in den Eingang. Ein Zahlungsdienst ist noch nicht angeschlossen: Es wird beim Bestellen nichts abgebucht, die Zahlung klärst du mit dem Kunden aus dem Eingang heraus.</p>
    <div class="sichern offen" style="position:static;margin:14px 0 0"><i></i><span>Versand & Zahlung</span><button class="kn kn--klein" type="button" data-akt="regeln-ok">Speichern</button></div></section>`;
}
async function regelnKlick(ev) {
  const b = ev.target.closest('[data-akt="regeln-ok"]');
  if (!b) return false;
  const alt = { versand: { ...Z.shopregeln.versand }, zahlung: [...Z.shopregeln.zahlung] };
  const neu = { versand: Object.fromEntries($$('[data-vs]').map(i => [i.dataset.vs, i.value])), zahlung: $$('[data-za]').filter(i => i.checked).map(i => i.dataset.za) };
  if (await tun({ art: 'shopregeln', regeln: neu }, { titel: 'Versand & Zahlung gespeichert', text: `DE ${neu.versand.DE} € · ${neu.zahlung.length} Zahlungsarten`, id: 'r:shopregeln', zurueck: { art: 'shopregeln', regeln: alt } })) neuZeichnen();
  return true;
}
function gruppenBlatt(haus) {
  const gs = Z.kartengruppen.filter(g => g.haus === haus);
  return `<section class="blatt gruppe" data-gruppen><div class="gruppe__k"><h3>Eigene Gruppen<span>${String(gs.length).padStart(2, '0')}</span></h3><button class="kn kn--klein" type="button" data-akt="gruppe-neu">Gruppe anlegen</button></div>
    <p class="gruppe__hin">Eine Gruppe ist eine Rubrik der Karte, zum Beispiel „Herbst-Specials“ unter Essen oder „Shots“ unter Drinks. Gerichte legst du danach wie gewohnt an.</p>
    <div class="zeilen">${gs.map(g => `<div class="gz" data-gi="${g.i}"><span class="gz__t"><b>${h(g.titel)}</b><span>${h(g.reihe)}</span></span><span class="gz__s"></span><span class="gz__p"></span><div class="gz__r"><button class="rund" type="button" data-akt="gruppe-weg" aria-label="Entfernen" title="Gruppe entfernen">${SYM.korb}</button><button class="kn kn--klein kn--linie" type="button" data-akt="gruppe-edit">Umbenennen</button></div></div>`).join('') || '<p class="gz leer">Noch keine eigene Gruppe.</p>'}</div></section>`;
}
function gruppeFenster(haus, g) {
  fenster(`<h2>${g ? 'Gruppe <em>umbenennen.</em>' : 'Neue <em>Gruppe.</em>'}</h2><div class="form1" style="margin-top:18px">
    <label class="feld"><span>Name der Gruppe</span><input id="gr-t" maxlength="60" value="${h(g ? g.titel : '')}" placeholder="z. B. Herbst-Specials"></label>
    <div class="feld"><span>Wo auf der Karte</span>${chipsH('reihe', [['Essen', 'Unter Essen'], ['Drinks', 'Unter Drinks']], g ? g.reihe : 'Essen')}</div></div>
    <div class="fehler" id="gr-f"></div><div class="fenster__kn"><button class="kn kn--linie" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="gr-ok">${g ? 'Speichern' : 'Anlegen'}</button></div>`);
  let reihe = g ? g.reihe : 'Essen';
  $('#fenster').bei = ev => { if (ev.detail.name === 'reihe') reihe = ev.detail.wert; };
  $('#gr-ok').addEventListener('click', async () => {
    const t = $('#gr-t').value.trim();
    if (!t) { $('#gr-f').textContent = 'Bitte einen Namen eintragen.'; return; }
    if (await tun({ art: 'kartengruppe', haus, reihe, titel: t, i: g ? g.i : undefined }, { titel: g ? 'Gruppe gespeichert' : 'Gruppe angelegt', text: `${t} · ${reihe}, ${Z.haeuser[haus]}` })) { fensterZu(); neuZeichnen(); }
  });
  $('#gr-t').focus();
}
function gruppenKlick(ev, haus) {
  const b = ev.target.closest('[data-akt]');
  if (!b || !b.closest('[data-gruppen]')) return false;
  const z = b.closest('.gz'), g = z && Z.kartengruppen.find(x => x.i === +z.dataset.gi);
  if (b.dataset.akt === 'gruppe-neu') gruppeFenster(haus);
  else if (b.dataset.akt === 'gruppe-edit' && g) gruppeFenster(haus, g);
  else if (b.dataset.akt === 'gruppe-weg' && g) frage('Gruppe <em>entfernen?</em>', `„${h(g.titel)}“ und die Gerichte darin verschwinden von der Karte.`, 'Entfernen', async () => { if (await tun({ art: 'kartengruppe-weg', i: g.i, haus }, { titel: 'Gruppe entfernt', text: g.titel })) neuZeichnen(); });
  else return false;
  return true;
}

// ---------------------------------------------------------------- Karten-PDF hochladen
async function pdfHoch(pfad) {
  const d = await waehleDateiArt('application/pdf,.pdf');
  if (!d) return null;
  if (d.type !== 'application/pdf' && !/\.pdf$/i.test(d.name)) { sag('Bitte eine PDF wählen.', true); return null; }
  sag('Die PDF wird abgelegt …');
  try {
    const r = await api('hochladen?art=pdf&name=' + encodeURIComponent(d.name), d, true);
    if (await tun({ art: 'fakt', pfad, wert: r.pfad }, { titel: 'Karte als PDF ersetzt', text: `${d.name} (${r.kb} kB)`, id: 'f:' + pfad, zurueck: { art: 'fakt', pfad, wert: Z.felder[pfad].wert } })) neuZeichnen();
  } catch (e) { sag(e.message, true, e.lex); }
}
function waehleDateiArt(accept) {
  return new Promise(ok => { const i = $('#datei'); i.value = ''; i.accept = accept; i.onchange = () => { ok(i.files[0] || null); i.accept = 'image/jpeg,image/png,image/webp'; }; i.oncancel = () => { ok(null); i.accept = 'image/jpeg,image/png,image/webp'; }; i.click(); });
}

// ---------------------------------------------------------------- Vergleich vorher / nachher
function vergleich(c, seiteDatei) {
  const stellen = c.stellen.length ? c.stellen : [];
  if (!stellen.length) return;
  V = { c, stellen, i: Math.max(0, seiteDatei ? stellen.findIndex(s => s.seite === seiteDatei) : 0), geraet: 'rechner', box: {}, seite: {} };
  const v = $('#vergleich');
  v.hidden = false;
  v.innerHTML = `<div class="vgl__k"><button class="rund" type="button" data-akt="zu" title="Schließen" aria-label="Schließen">${SYM.zu}</button>
      <h2>${h(c.titel)}<small>${h(c.ort || '')}</small></h2>
      <select id="v-seite" aria-label="Seite"${c.seiten.length < 2 ? ' hidden' : ''}>${c.seiten.map(s => `<option value="${h(s.datei)}">${h(s.name)}${s.zahl > 1 ? ` (${s.zahl} Stellen)` : ''}</option>`).join('')}</select>
      <div class="vgl__nav"><button class="rund" type="button" data-akt="vor" aria-label="Vorherige Stelle">${SYM.links}</button><span id="v-zahl"></span><button class="rund" type="button" data-akt="nach" aria-label="Nächste Stelle">${SYM.rechts}</button>
        <button class="rund an" type="button" data-g="rechner" aria-label="Wie am Rechner">${SYM.rechner}</button><button class="rund" type="button" data-g="handy" aria-label="Wie am Handy">${SYM.handy}</button></div></div>
    <div class="vgl__b" id="v-b">${['vorher', 'entwurf'].map(p => `<div class="vgl__s"><span>${p === 'vorher' ? 'Vorher <b>so steht es jetzt auf der Website</b>' : 'Nachher <b>so sieht es nach dem Veröffentlichen aus</b>'}</span>
      <div class="vgl__r"><iframe id="v-${p}" title="${p === 'vorher' ? 'Vorher' : 'Nachher'}"></iframe><div class="vgl__m" id="vm-${p}"></div><div class="vgl__leer" id="vl-${p}" hidden></div></div></div>`).join('')}</div>`;
  v.onclick = ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.akt === 'zu') return vglZu();
    if (b.dataset.akt === 'vor') V.i = (V.i - 1 + V.stellen.length) % V.stellen.length;
    else if (b.dataset.akt === 'nach') V.i = (V.i + 1) % V.stellen.length;
    else if (b.dataset.g) {
      V.geraet = b.dataset.g;
      $('#v-b').classList.toggle('handy', V.geraet === 'handy');
      $$('.vgl__r', v).forEach(r => r.classList.toggle('handy', V.geraet === 'handy'));
      $$('[data-g]', v).forEach(x => x.classList.toggle('an', x === b));
      V.passe.forEach(f => f());
      setTimeout(() => ['vorher', 'entwurf'].forEach(vglMarke), 350);
      return;
    }
    else return;
    vglLade();
  };
  $('#v-seite').addEventListener('change', ev => { V.i = Math.max(0, V.stellen.findIndex(s => s.seite === ev.target.value)); vglLade(); });
  V.passe = [];
  ['vorher', 'entwurf'].forEach(p => {
    const fr = $('#v-' + p);
    V.passe.push(passe(fr, fr.parentNode, 1280));
    fr.addEventListener('load', () => {
      const d = fr.contentDocument;
      if (!d || !d.body || !V) return;
      V.box[p] = richte(d, false).an;
      d.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('a[href]')) ev.preventDefault(); }, true);
      d.defaultView.addEventListener('wheel', () => requestAnimationFrame(() => { const a = $('#v-' + (p === 'vorher' ? 'entwurf' : 'vorher')); try { a.contentWindow.scrollTo(0, d.defaultView.scrollY); vglRahmen(); } catch (e) {} }), { passive: true });
      d.defaultView.addEventListener('scroll', vglRahmen, { passive: true });
      vglMarke(p);
    });
  });
  vglLade();
}
function vglZu() { V = null; const v = $('#vergleich'); v.hidden = true; v.innerHTML = ''; }
function vglFinde(d, st, p) {
  if (st.oben) return null;
  if (st.b) return d.querySelector(`img[data-b="${st.b}"][data-bn="${st.n}"]`);
  const genau = () => d.querySelector(`[data-e="${st.h}"][data-en="${st.n}"]`);
  if (V.c.art !== 'karte' || p === (st.vorher ? 'vorher' : 'entwurf')) return genau();
  return $$(`[data-e="${st.h}"]`, d).find(e => e.textContent.trim() === st.t) || null;  // im anderen Stand kann das Gericht an anderer Stelle stehen
}
function vglRahmen() {
  if (!V) return;
  ['vorher', 'entwurf'].forEach(p => { const el = V.el && V.el[p]; if (el) rahme(V.box[p], el); });
}
function vglMarke(p) {
  if (!V) return;
  const fr = $('#v-' + p), d = fr.contentDocument, st = V.stellen[V.i], leer = $('#vl-' + p), m = $('#vm-' + p);
  if (!d || !d.body || V.seite[p] !== st.seite || d.readyState === 'loading') return;
  V.el = V.el || {};
  let el = vglFinde(d, st, p);
  leer.hidden = true;
  if (st.oben) { d.defaultView.scrollTo(0, 0); rahme(V.box[p], null); m.innerHTML = ''; V.el[p] = null; return; }
  if (el) {
    zeig(el);
    el = el.closest('.gk,.gericht') || el;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    if (!rahme(V.box[p], el)) { leer.hidden = false; leer.textContent = 'Diese Stelle ist auf der Seite gerade eingeklappt und erst nach einem Klick zu sehen.'; }
  } else {
    rahme(V.box[p], null);
    leer.hidden = false;
    leer.textContent = p === 'vorher' ? 'Hier stand das vorher noch nicht.' : 'Hier steht es nach dem Veröffentlichen nicht mehr.';
  }
  V.el[p] = el;
  const hoehe = d.documentElement.scrollHeight || 1;
  m.innerHTML = V.stellen.map((s, i) => {
    if (s.seite !== st.seite) return '';
    const e = i === V.i ? el : vglFinde(d, s, p);
    const r = e && e.getBoundingClientRect();
    return r && (r.width || r.height) ? `<i class="${i === V.i ? 'an' : ''}" style="top:${((r.top + d.defaultView.scrollY) / hoehe * 100).toFixed(2)}%"></i>` : '';
  }).join('');
}
function vglLade() {
  const st = V.stellen[V.i], name = (V.c.seiten.find(s => s.datei === st.seite) || {}).name || st.seite;
  $('#v-zahl').textContent = `Stelle ${V.i + 1} von ${V.stellen.length} · ${name}`;
  $('#v-seite').value = st.seite;
  ['vorher', 'entwurf'].forEach(p => {
    const fr = $('#v-' + p);
    if (V.seite[p] !== st.seite) { V.seite[p] = st.seite; V.el = {}; fr.src = `/${p}/${encodeURIComponent(st.seite)}?nomotion`; } else vglMarke(p);
  });
}

// ---------------------------------------------------------------- Verlauf und Zugang
function verlauf() {
  const vs = Z.verlauf;
  sicht.innerHTML = `<div class="in">${kopf('Ver<em>lauf.</em>', vs.length ? 'Jede Veröffentlichung wird aufgehoben. Holst du einen früheren Stand zurück, liegt er zuerst als Entwurf bereit. Du prüfst ihn und veröffentlichst dann.' : '')}
    ${vs.length ? `<ol class="lauf">${vs.map((v, i) => `<li><div class="blatt"><div><time>${v.anfang ? 'Ursprünglicher Stand' : datum(v.zeit)}</time>
      <p>${v.anfang ? 'So war die Website, bevor im Studio zum ersten Mal etwas geändert wurde.' : (v.notiz ? `<b>${h(v.notiz)}</b> · ` : '') + h(v.punkte.slice(0, 6).join(' · ')) + (v.punkte.length > 6 ? ` und ${v.punkte.length - 6} weitere` : '')}</p></div>
      ${i === 0 ? '<span class="mono leise">Das ist der Stand der Website</span>' : `<button class="kn kn--klein kn--linie" type="button" data-id="${h(v.id)}">Diesen Stand zurückholen</button>`}</div></li>`).join('')}</ol>`
    : `<div class="leerbild">${ST('schildkroete')}<b>Noch nichts veröffentlicht.</b><p>Sobald du zum ersten Mal etwas veröffentlichst, findest du hier jeden Stand der Website und kannst ihn zurückholen.</p></div>`}</div>`;
  sicht.querySelector('.in').addEventListener('click', ev => {
    const b = ev.target.closest('[data-id]');
    if (!b) return;
    frage('Stand <em>zurückholen?</em>', 'Der frühere Stand wird als Entwurf geladen. Was du gerade an unveröffentlichten Änderungen hast, wird dabei ersetzt. Auf der Website ändert sich erst etwas, wenn du veröffentlichst.', 'Zurückholen', async () => {
      Z = await api('zurueck', { id: b.dataset.id });
      sag('Der frühere Stand liegt als Entwurf bereit.');
      location.hash = '#/aenderungen';
    });
  });
}
function zugang() {
  zugangInnen();
  const in_ = $('.in', sicht);  // die Prüfung ist von hier aus immer erreichbar, auch am Handy (dort fehlt die Leiste links)
  if (in_) in_.insertAdjacentHTML('beforeend', `<section class="blatt" style="max-width:640px;margin-top:22px"><h3>Prüfung</h3><p style="margin-top:12px;color:rgba(11,12,16,.7)">Wenn irgendwo etwas hakt: Die Prüfung testet das ganze Studio, erklärt jeden Fehler in einfachen Worten und repariert das meiste mit einem Knopf. Sie läuft auch dann, wenn das Studio selbst nicht mehr startet.</p><p style="margin-top:16px"><a class="kn kn--klein" href="/studio/pruefung.html" target="_blank" rel="noopener">Prüfung öffnen</a></p></section>`);
}
function zugangInnen() {
  if (PROBE) {
    sicht.innerHTML = `<div class="in">${kopf('Zu<em>gang.</em>', 'Die Probe-Fassung braucht kein Passwort. Jeder Besucher arbeitet in seiner eigenen Kopie, die echte Website bleibt, wie sie ist.')}
      <section class="blatt" style="max-width:640px"><h3>Im echten Studio</h3><p style="margin-top:12px;color:rgba(11,12,16,.7)">Dort legt ihr beim ersten Öffnen euer eigenes Passwort fest und könnt es hier jederzeit ändern. Nach zwölf Stunden meldet es euch von selbst ab.</p></section></div>`;
    return;
  }
  if (OFFEN) {
    sicht.innerHTML = `<div class="in">${kopf('Zu<em>gang.</em>', 'Das Studio ist gerade ohne Passwort offen. Sobald ihr wirklich damit arbeitet, wird der Schutz wieder eingeschaltet; dein Passwort bleibt dafür gespeichert.')}
      <section class="blatt" style="max-width:640px"><h3>Offen</h3><p style="margin-top:12px;color:rgba(11,12,16,.7)">Jeder, der die Adresse kennt, kann gerade ändern und veröffentlichen. Zum Einschalten des Schutzes sag Robert Bescheid.</p></section></div>`;
    return;
  }
  sicht.innerHTML = `<div class="in">${kopf('Zu<em>gang.</em>', 'Das Studio ist mit einem Passwort geschützt. Nach zwölf Stunden meldet es dich von selbst ab.')}
    <div class="raster r-2"><section class="blatt"><h3>Passwort ändern</h3><form id="z-form" style="display:grid;gap:14px;margin-top:18px" autocomplete="off">
      <label class="feld"><span>Bisheriges Passwort</span><input type="password" name="alt" autocomplete="current-password" required></label>
      <label class="feld"><span>Neues Passwort</span><input type="password" name="neu" autocomplete="new-password" required minlength="10"><small>Mindestens 10 Zeichen</small></label>
      <label class="feld"><span>Noch einmal</span><input type="password" name="neu2" autocomplete="new-password" required></label>
      <div class="fehler" role="alert" style="text-align:left"></div><div><button class="kn" type="submit">Passwort ändern</button></div></form></section>
    <section class="blatt"><h3>Abmelden</h3><p style="margin:14px 0 20px;color:rgba(11,12,16,.7)">An einem fremden Rechner meldest du dich am besten ab, wenn du fertig bist. Entwürfe bleiben erhalten.</p><button class="kn kn--linie" type="button" data-akt="abmelden">Abmelden</button></section></div></div>`;
  const f = $('#z-form');
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    const fe = $('.fehler', f);
    fe.textContent = '';
    if (f.neu.value !== f.neu2.value) { fe.textContent = 'Die beiden neuen Eingaben sind nicht gleich.'; return; }
    try { await api('passwort', { alt: f.alt.value, neu: f.neu.value }); f.reset(); sag('Das Passwort ist geändert.'); } catch (e) { fe.textContent = e.message; }
  });
}

// ---------------------------------------------------------------- Fenster
function fenster(html, breit) {
  const f = $('#fenster');
  f.hidden = false;
  f.oninput = f.onclick = f.bei = null;
  $$('.quitt').forEach(x => { if (!html.includes('class="erfolg"')) x.remove(); });
  f.innerHTML = `<div class="fenster__k${breit ? ' breit' : ''}" role="dialog" aria-modal="true"><button class="rund zu" type="button" data-zu aria-label="Schließen">${SYM.zu}</button>${html}</div>`;
  const erstes = $('input,button.kn', f);
  if (erstes) erstes.focus();
}
function fensterZu() { const f = $('#fenster'); f.hidden = true; f.innerHTML = ''; }
function frage(titel, text, knopf, tun) {
  fenster(`<h2>${titel}</h2><p>${text}</p><div class="fenster__kn"><button class="kn kn--linie" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="f-ja">${knopf}</button></div>`);
  $('#f-ja').addEventListener('click', async ev => {
    const k = ev.currentTarget;
    if (k.disabled) return;
    k.disabled = true;  // ein zweiter Klick während der Antwort würde dieselbe Aktion noch einmal auslösen (zwei Einträge weg statt einem)
    try { await tun(); fensterZu(); } catch (e) { sag(e.message, true, e.lex); k.disabled = false; }
  });
}
$('#fenster').addEventListener('click', ev => { if (ev.target.closest('[data-zu]')) fensterZu(); });
$('#fenster').addEventListener('wahl', ev => { const f = $('#fenster'); if (f.bei) f.bei(ev); });
$('#lade').addEventListener('click', ev => { if (ev.target.id === 'lade') ladeZu(); });
addEventListener('keydown', ev => {
  if (ev.key !== 'Escape') return;
  if (!$('#fenster').hidden) fensterZu(); else if (V) vglZu(); else if (!$('#lade').hidden) ladeZu();
});
document.addEventListener('click', async ev => {
  const b = ev.target.closest('[data-akt]');
  if (!b) return;
  const akt = b.dataset.akt, imLade = b.closest('#lade');
  if (akt === 'abmelden') { try { await api('abmelden', {}); } catch (e) {} Z = null; ladeZu(); tor('an'); }
  if (akt === 'lade') { if ($('#lade').hidden) lade(); else ladeZu(); }
  if (akt === 'ladezu') ladeZu();
  if (akt === 'raus' || akt === 'alles') aktAenderung(akt);
  if (imLade && (akt === 'sehen' || akt === 'weg')) aktAenderung(akt, b.closest('[data-id]').dataset.id);
  if (b.dataset.akt === 'geraet' && W) {
    $('#w-buehne').classList.toggle('handy', b.dataset.g === 'handy');
    W.passe();
    $$('[data-akt="geraet"]').forEach(x => x.classList.toggle('an', x === b));
    setTimeout(() => { if (W && W.sel) rahme(W.an, W.sel.el); }, 300);
  }
});

(async () => {
  const notaus = $('#notausgang');  // steht im HTML für den Fall, dass dieses Skript gar nicht lädt
  if (notaus) notaus.remove();
  try {
    const s = await api('status');
    OFFEN = !!s.offen;
    PROBE = !!s.probe;
    if (s.offen) await laden(); else if (!s.eingerichtet) tor('neu'); else if (!s.angemeldet) tor('an'); else await laden();
  } catch (e) {
    merkFehler('Studio startet nicht: ' + e.message, e.stack || '', e.lex || 'server-aus');
    const t = $('#tor');  // Tür zur Prüfung: die läuft auch dann, wenn hier nichts mehr geht
    $('#app').hidden = true;
    t.hidden = false;
    t.innerHTML = `<div class="tor__k"><h1>Das Studio <em>startet nicht.</em></h1><p>${h(e.message)}</p><p>Die Prüfung findet heraus, woran es liegt, und hilft weiter.</p>
      <p style="margin-top:22px"><a class="kn kn--breit" href="/studio/pruefung.html${e.lex ? '#lex-' + encodeURIComponent(e.lex) : ''}">Prüfung öffnen</a></p></div>`;
  }
})();
})();
