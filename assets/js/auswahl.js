/* Salt & Silver, 23.10.2026: Auswahl, Kalender und Uhrzeit im Stil des Hauses statt der grauen Browser-Auswahl
   (Master Website-Bau 2.9 Punkt 11). Übernommen aus Grand Beau-Rivage (website/assets/js/main.js Datumsblock + assets/js/auswahl.js),
   nur gelesen und kopiert; Schreibweise de-DE, Aussehen in assets/css/auswahl.css. */
/* ---------- Datumsfelder, die der Browser selbst zeichnet (12.10.2026) ----------
   Feiern: Datum und Anfrage, Anreise: Spa-Tag, die Buchung im Chat. Der Browser schreibt dort das Datum in seiner eigenen Schreibweise
   (meist amerikanisch «mm/dd/yyyy»), nicht in der der Seite. Darum liegt über jedem solchen Feld eine Zeile in der Schreibweise der Sprache
   (de/fr 12.10.2026, en britisch 12/10/2026, zh 2026/10/12, ko 2026. 10. 12., ar 12/10/2026); das echte Feld bleibt darunter, unsichtbar
   beschriftet, und öffnet beim Klick den Kalender des Browsers. Felder mit eigenem Kalender (lw-nativ, Block darüber) brauchen das nicht. */
(function () {
  var LANG = document.documentElement.lang || 'de-DE', SP = LANG.slice(0, 2);
  var ORT = { de: 'de-DE', en: 'en-GB', fr: 'fr-CH', zh: 'zh-CN', ko: 'ko-KR', ar: 'ar-u-nu-latn' }[SP] || LANG;
  var LEER = { de: 'Datum wählen', en: 'Choose a date', fr: 'Choisir une date', zh: '选择日期', ko: '날짜 선택', ar: 'اختيار التاريخ' }[SP] || 'Datum wählen';
  var fmt; try { fmt = new Intl.DateTimeFormat(ORT, { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return; }
  var lies = function (s) { var p = (s || '').split('-'); return p.length === 3 ? new Date(+p[0], p[1] - 1, +p[2]) : null; };
  var alle = [];
  function lege(i) {
    var b = i._dtAnz; if (!b) return;
    if (!i.offsetWidth) { b.hidden = true; return; } b.hidden = false;
    b.style.left = i.offsetLeft + 'px'; b.style.top = i.offsetTop + 'px'; b.style.width = i.offsetWidth + 'px'; b.style.height = i.offsetHeight + 'px';
  }
  function schreibe(i) { var d = lies(i.value), b = i._dtAnz; b.textContent = d ? fmt.format(d) : LEER; b.classList.toggle('dt-anz--leer', !d); lege(i); }
  function ruest(i) {
    if (i._dtAnz || i.type !== 'date' || i.classList.contains('lw-nativ')) return;
    var el = i.parentNode; if (!el) return;
    var cs = getComputedStyle(i), b = document.createElement('b'); b.className = 'dt-anz'; b.setAttribute('aria-hidden', 'true');
    b.style.font = cs.font; b.style.letterSpacing = cs.letterSpacing; b.style.color = cs.color; b.style.padding = cs.padding; b.style.direction = cs.direction;
    b.style.justifyContent = /right|end/.test(cs.textAlign) ? 'flex-end' : cs.textAlign === 'center' ? 'center' : 'flex-start';
    i._dtAnz = b; i.classList.add('dt-nativ'); el.classList.add('dt-feld'); el.insertBefore(b, i.nextSibling);
    ['input', 'change', 'blur'].forEach(function (ev) { i.addEventListener(ev, function () { schreibe(i); }); });
    i.addEventListener('click', function () { try { i.showPicker(); } catch (e) {} });
    alle.push(i); schreibe(i);
    if (window.ResizeObserver) new ResizeObserver(function () { lege(i); }).observe(i);   /* S&S: Felder im Tischfenster sind beim Laden unsichtbar; sobald das Fenster aufgeht, sitzt die Zeile sofort */
  }
  function suche() { [].slice.call(document.querySelectorAll('input[type=date]')).forEach(ruest); }
  /* die Leisten mit eigenem Kalender markieren ihre Felder beim Laden (lw-nativ), darum erst danach suchen */
  setTimeout(suche, 0);
  if ('MutationObserver' in window) new MutationObserver(function (ms) {
    var neu = ms.some(function (m) { return [].some.call(m.addedNodes, function (n) { return n.nodeType === 1 && (n.tagName === 'INPUT' || (n.querySelector && n.querySelector('input[type=date]'))); }); });
    if (neu) setTimeout(suche, 0);
  }).observe(document.body, { childList: true, subtree: true });
  var takt = 0; window.addEventListener('resize', function () { if (!takt) takt = requestAnimationFrame(function () { takt = 0; alle.forEach(lege); }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { alle.forEach(lege); });
})();

/* Auswahllisten im Stil des Hauses (Robert 11.10.2026: «überall, wo es solche Auswahlmöglichkeiten gibt, im Stil des Hauses,
   und immer, wenn sowas gebaut wird, direkt mit»). Jedes <select> der Seite bekommt eine eigene Liste: Creme-Karte mit Goldkante,
   Namen in der Titelschrift, gewählter Eintrag nachtblau mit Goldraute. Das echte <select> bleibt (unsichtbar) im Formular und trägt
   den Wert, deshalb funktionieren Formulare, Rechner und Mail-Anfragen unverändert; jede Wahl löst «change» und «input» aus.
   Auch später eingefügte Listen (z. B. gast.js) werden übernommen. Ausgenommen: die Buchungsleiste (form[data-leiste]) mit ihrer
   eigenen Gäste-Liste und alles in [data-eigene-wahl]. Tastatur: Pfeile, Pos1/Ende, Anfangsbuchstabe, Enter, Escape, Tab.
   Die Liste hängt am <body> (oder im offenen <dialog>), damit kein überlaufender Abschnitt sie abschneidet; sie öffnet nach unten
   oder, wenn unten kein Platz ist, nach oben. Bewegung nur über transform und opacity. */
(function () {
  'use strict';
  var doc = document, offen = null, nr = 0;
  var PFEIL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';

  function ausgenommen(s) { return s.multiple || s.size > 1 || s.closest('form[data-leiste],form[data-leiste-kal],[data-eigene-wahl]') || s.classList.contains('lw-nativ'); }

  function baue(s) {
    if (s.dataset.hwahl || ausgenommen(s)) return;
    s.dataset.hwahl = '1';
    var id = 'hwahl' + (++nr);
    var hülle = doc.createElement('span'); hülle.className = 'hwahl';
    s.parentNode.insertBefore(hülle, s); hülle.appendChild(s);
    s.classList.add('hwahl-nativ'); s.tabIndex = -1; s.setAttribute('aria-hidden', 'true');
    var k = doc.createElement('button'); k.type = 'button'; k.className = 'hwahl-knopf'; k.style.webkitAppearance = 'none'; k.style.appearance = 'none';   // nie der System-Knopf
    k.setAttribute('aria-haspopup', 'listbox'); k.setAttribute('aria-expanded', 'false'); k.setAttribute('aria-controls', id);
    var lab = s.closest('label'); var titel = lab ? (lab.querySelector('span') || {}).textContent : s.getAttribute('aria-label');
    if (titel) k.setAttribute('aria-label', titel.trim());
    k.innerHTML = '<b class="hwahl-wert"></b>' + PFEIL;
    hülle.appendChild(k);
    // Schrift, Linie, Polster und Fläche des Feldes übernehmen, damit der Knopf in jede Leiste passt. Das geschieht mehrmals (sofort, wenn alle
    // Stylesheets da sind, wenn die Schriften da sind): Läuft das Skript, bevor der Stil der Seite geladen ist, hat das Feld noch das Aussehen des
    // Systems (weiss, mit Rand), und das blieb sonst am Knopf hängen (Robert 12.10.2026, Pass-Berater: «diese weissen Kästen»).
    function kleide() {
      var cs = getComputedStyle(s);
      k.style.fontFamily = cs.fontFamily; k.style.fontSize = cs.fontSize; k.style.fontWeight = cs.fontWeight; k.style.color = cs.color; k.style.letterSpacing = cs.letterSpacing;
      ['borderBottom', 'borderTop', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'backgroundColor', 'borderRadius', 'boxShadow', 'minHeight'].forEach(function (x) { k.style[x] = ''; if (cs[x] && cs[x] !== 'none' && cs[x] !== 'rgba(0, 0, 0, 0)') k.style[x] = cs[x]; });
    }
    kleide(); s._kleide = kleide;
    var l = doc.createElement('ul'); l.className = 'hwahl-liste'; l.id = id; l.setAttribute('role', 'listbox'); l.tabIndex = -1;
    if (titel) l.setAttribute('aria-label', titel.trim());
    var g = { s: s, k: k, l: l, j: 0 };
    s._gw = g;
    k.addEventListener('click', function () { offen === g ? zu(true) : auf(g); });
    k.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auf(g); } });
    l.addEventListener('keydown', function (e) { taste(g, e); });
    l.addEventListener('click', function (e) { var o = e.target.closest('[role=option]'); if (o) waehle(g, +o.dataset.i); });
    l.addEventListener('mousemove', function (e) { var o = e.target.closest('[role=option]'); if (o) markiere(g, +o.dataset.i); });
    s.addEventListener('change', function () { zeige(g); });
    var f = s.form; if (f) f.addEventListener('reset', function () { setTimeout(function () { zeige(g); }, 0); });
    zeige(g);
  }

  function zeige(g) { var o = g.s.options[g.s.selectedIndex]; g.k.querySelector('.hwahl-wert').textContent = o ? o.textContent : ''; g.k.classList.toggle('hwahl-leer', !!(o && !o.value && o.disabled)); }

  function fuelle(g) {
    var h = '';
    [].forEach.call(g.s.options, function (o, i) {
      if (o.hidden) return;
      var ja = i === g.s.selectedIndex;
      h += '<li role="option" data-i="' + i + '" aria-selected="' + ja + '"' + (o.disabled ? ' aria-disabled="true"' : '') + ' style="--i:' + i + '"><i></i><span></span></li>';
    });
    g.l.innerHTML = h;
    [].forEach.call(g.l.children, function (li) { li.querySelector('span').textContent = g.s.options[+li.dataset.i].textContent; });
  }

  function lage(g) {
    var r = g.k.closest('.hwahl').getBoundingClientRect(), feld = g.k.closest('label,.feld,.anf__f') || g.k;
    var rf = feld.getBoundingClientRect(), b = Math.max(rf.width, 240), hl = g.l.offsetHeight, unten = innerHeight - rf.bottom, oben = rf.top;
    var nachOben = unten < hl + 16 && oben > unten;
    var x = Math.min(Math.max(8, rf.left), innerWidth - b - 8);
    g.l.style.left = x + 'px'; g.l.style.width = b + 'px';
    g.l.style.top = (nachOben ? rf.top - hl - 8 : rf.bottom + 8) + 'px';
    g.l.classList.toggle('hwahl-oben', nachOben);
  }

  function auf(g) {
    if (offen) zu(false);
    fuelle(g);
    (g.s.closest('dialog[open]') || doc.body).appendChild(g.l);
    lage(g);
    offen = g; g.k.setAttribute('aria-expanded', 'true'); g.k.closest('.hwahl').classList.add('hwahl--offen');
    markiere(g, Math.max(0, g.s.selectedIndex));
    requestAnimationFrame(function () { g.l.classList.add('hwahl-auf'); });
    g.l.focus({ preventScroll: true });
    addEventListener('scroll', mit, true); addEventListener('resize', mit);
  }
  var takt = 0;
  function mit() { if (!offen || takt) return; takt = requestAnimationFrame(function () { takt = 0; if (offen) lage(offen); }); }

  function zu(fokus) {
    var g = offen; if (!g) return;
    offen = null; g.k.setAttribute('aria-expanded', 'false'); g.k.closest('.hwahl').classList.remove('hwahl--offen');
    g.l.classList.remove('hwahl-auf');
    removeEventListener('scroll', mit, true); removeEventListener('resize', mit);
    setTimeout(function () { if (offen !== g && g.l.parentNode) g.l.parentNode.removeChild(g.l); }, 320);
    if (fokus) g.k.focus({ preventScroll: true });
  }

  function markiere(g, i) {
    var lis = [].slice.call(g.l.children); if (!lis.length) return;
    var li = g.l.querySelector('[data-i="' + i + '"]') || lis[0];
    lis.forEach(function (x) { x.classList.toggle('hwahl-hier', x === li); });
    g.j = +li.dataset.i; g.l.setAttribute('aria-activedescendant', '');
    var r = li.getBoundingClientRect(), rl = g.l.getBoundingClientRect();
    if (r.bottom > rl.bottom) g.l.scrollTop += r.bottom - rl.bottom; else if (r.top < rl.top) g.l.scrollTop -= rl.top - r.top;
  }

  function waehle(g, i) {
    var o = g.s.options[i]; if (!o || o.disabled) return;
    g.s.selectedIndex = i;
    g.s.dispatchEvent(new Event('input', { bubbles: true })); g.s.dispatchEvent(new Event('change', { bubbles: true }));
    zeige(g); zu(true);
  }

  var suche = '', suchUhr = 0;
  function taste(g, e) {
    var lis = [].slice.call(g.l.children).filter(function (x) { return !x.hasAttribute('aria-disabled'); });
    var pos = lis.findIndex(function (x) { return +x.dataset.i === g.j; });
    if (e.key === 'ArrowDown') { e.preventDefault(); markiere(g, +lis[Math.min(lis.length - 1, pos + 1)].dataset.i); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); markiere(g, +lis[Math.max(0, pos - 1)].dataset.i); }
    else if (e.key === 'Home') { e.preventDefault(); markiere(g, +lis[0].dataset.i); }
    else if (e.key === 'End') { e.preventDefault(); markiere(g, +lis[lis.length - 1].dataset.i); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); waehle(g, g.j); }
    else if (e.key === 'Escape') { e.preventDefault(); zu(true); }
    else if (e.key === 'Tab') { zu(false); }
    else if (e.key.length === 1) {
      clearTimeout(suchUhr); suche += e.key.toLowerCase(); suchUhr = setTimeout(function () { suche = ''; }, 700);
      var t = lis.find(function (x) { return x.textContent.trim().toLowerCase().replace(/^[«"„]/, '').indexOf(suche) === 0; }); if (t) markiere(g, +t.dataset.i);
    }
  }

  doc.addEventListener('pointerdown', function (e) { if (offen && !offen.l.contains(e.target) && !offen.k.contains(e.target)) zu(false); }, true);

  function alle(wurzel) { [].forEach.call((wurzel || doc).querySelectorAll('select'), baue); }
  // Werte, die andere Skripte direkt setzen (s.value = …), beim nächsten Blick nachziehen
  setInterval(function () { [].forEach.call(doc.querySelectorAll('select[data-hwahl]'), function (s) { var g = s._gw; if (g && g.k.querySelector('.hwahl-wert').textContent !== (s.options[s.selectedIndex] || {}).textContent) zeige(g); }); }, 600);
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { alle(); }); else alle();
  function neuKleiden() { [].forEach.call(doc.querySelectorAll('select[data-hwahl]'), function (s) { if (s._kleide) s._kleide(); }); }
  [].forEach.call(doc.querySelectorAll('link[rel=stylesheet]'), function (l) { l.addEventListener('load', neuKleiden); });
  window.addEventListener('load', neuKleiden);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(neuKleiden);
  new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType !== 1) return; if (n.tagName === 'SELECT') baue(n); else if (n.querySelector) alle(n); }); }); }).observe(doc.documentElement, { childList: true, subtree: true });
  window.susAuswahl = { baue: baue, alle: alle };
})();

/* ---------- Datum und Uhrzeit im Stil des Hauses (Robert 12.10.2026: «die Auswahlmöglichkeiten auch immer im Stil des Hauses, feste Designregel») ----------
   Jedes Datumsfeld (input type=date) bekommt den Kalender des Hauses, jedes Zeitfeld (type=time) die Zeitwahl des Hauses, statt des
   Kalenders und der Räder des Browsers. Das echte Feld bleibt im Formular und trägt den Wert (jjjj-mm-tt bzw. hh:mm), darum laufen
   Rechner, Prüfungen und Mail-Anfragen unverändert; jede Wahl löst «input» und «change» aus. Über dem Feld liegt ein unsichtbarer Knopf,
   der die Auswahl öffnet, so kommt der Browser gar nicht erst zum Zug. min/max und step des Feldes gelten. Ausgenommen: die Leisten mit
   eigenem Zeitraum-Kalender (lw-nativ) und alles in [data-eigene-wahl]. Tastatur: Pfeile, Bild auf/ab, Enter, Escape.
   Die Auswahl hängt am <body> (oder im offenen <dialog>), steht fest auf der Seite und scrollt mit. Bewegung nur über transform und opacity. */
(function () {
  'use strict';
  var doc = document, LANG = doc.documentElement.lang || 'de-DE', SP = LANG.slice(0, 2);
  var ORT = { de: 'de-DE', en: 'en-GB', fr: 'fr-CH', zh: 'zh-CN', ko: 'ko-KR', ar: 'ar-u-nu-latn' }[SP] || LANG;
  var W = { de: ['Vorheriger Monat', 'Nächster Monat', 'Stunde', 'Minute'], en: ['Previous month', 'Next month', 'Hour', 'Minute'], fr: ['Mois précédent', 'Mois suivant', 'Heure', 'Minute'],
            zh: ['上个月', '下个月', '时', '分'], ko: ['이전 달', '다음 달', '시', '분'], ar: ['الشهر السابق', 'الشهر التالي', 'الساعة', 'الدقيقة'] }[SP] || ['Vorheriger Monat', 'Nächster Monat', 'Stunde', 'Minute'];
  var fMonat, fTag, fLang;
  try { fMonat = new Intl.DateTimeFormat(ORT, { month: 'long' }); fTag = new Intl.DateTimeFormat(ORT, { weekday: 'short' }); fLang = new Intl.DateTimeFormat(ORT, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return; }
  var PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg>';
  var zwei = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (d) { return d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate()); };
  var lies = function (s) { var p = (s || '').split('-'); return p.length === 3 && +p[0] ? new Date(+p[0], p[1] - 1, +p[2]) : null; };
  var offen = null;

  function ausgenommen(i) { return i.classList.contains('lw-nativ') || i.closest('[data-eigene-wahl]') || i.disabled; }

  function ruest(i) {
    if (i._zw || ausgenommen(i) || (i.type !== 'date' && i.type !== 'time')) return;
    var el = i.parentNode; if (!el) return;
    var art = i.type, k = doc.createElement('button'); k.type = 'button'; k.className = 'zw-knopf'; k.setAttribute('aria-haspopup', 'dialog'); k.setAttribute('aria-expanded', 'false');
    var lab = i.closest('label'), titel = lab && lab.querySelector('span') ? lab.querySelector('span').textContent.trim() : (i.getAttribute('aria-label') || '');
    i._zw = { i: i, k: k, art: art, titel: titel };
    el.classList.add('dt-feld'); i.classList.add('zw-nativ'); i.tabIndex = -1;
    if (art === 'time' && !i._dtAnz) {   /* Zeitfelder bekommen dieselbe Zeile wie die Datumsfelder (dort legt main.js sie an) */
      var cs = getComputedStyle(i), b = doc.createElement('b'); b.className = 'dt-anz'; b.setAttribute('aria-hidden', 'true');
      b.style.font = cs.font; b.style.letterSpacing = cs.letterSpacing; b.style.color = cs.color; b.style.padding = cs.padding; b.style.direction = 'ltr';
      b.style.justifyContent = /right|end/.test(cs.textAlign) ? 'flex-end' : cs.textAlign === 'center' ? 'center' : 'flex-start';
      i._zwAnz = b; i.classList.add('dt-nativ'); el.insertBefore(b, i.nextSibling);
      ['input', 'change'].forEach(function (ev) { i.addEventListener(ev, function () { schreibe(i); }); });
    }
    el.appendChild(k);
    k.addEventListener('click', function (e) { e.preventDefault(); offen && offen.z === i._zw ? zu(true) : auf(i._zw); });
    if (lab) lab.addEventListener('click', function (e) { if (e.target !== k && !(offen && offen.f.contains(e.target))) e.preventDefault(); });   /* ein Klick auf die Beschriftung soll das echte Feld nicht öffnen */
    lege(i); schreibe(i);
    if (window.ResizeObserver) new ResizeObserver(function () { lege(i); }).observe(i);   /* S&S: wie oben, ohne auf den 700-ms-Takt zu warten */
  }
  function schreibe(i) { var b = i._zwAnz; if (b) { b.textContent = i.value || '–:–'; b.classList.toggle('dt-anz--leer', !i.value); } beschrifte(i); }
  function beschrifte(i) { var z = i._zw; if (!z) return; var d = z.art === 'date' ? lies(i.value) : null; z.k.setAttribute('aria-label', (z.titel ? z.titel + ': ' : '') + (d ? fLang.format(d) : (i.value || '…'))); }
  function lege(i) {
    var z = i._zw; if (!z) return;
    var s = z.k.style, b = i._zwAnz; s.left = i.offsetLeft + 'px'; s.top = i.offsetTop + 'px'; s.width = i.offsetWidth + 'px'; s.height = i.offsetHeight + 'px'; z.k.hidden = !i.offsetWidth;
    if (b) { b.hidden = !i.offsetWidth; b.style.left = s.left; b.style.top = s.top; b.style.width = s.width; b.style.height = s.height; }
  }

  function auf(z) {
    zu(false);
    var f = doc.createElement('div'); f.className = 'zw zw--' + z.art; f.setAttribute('role', 'dialog'); if (z.titel) f.setAttribute('aria-label', z.titel);
    var wirt = z.i.closest('dialog[open]') || doc.body; wirt.appendChild(f);
    offen = { z: z, f: f, fest: wirt !== doc.body };
    if (offen.fest) f.classList.add('zw--fest');
    z.k.setAttribute('aria-expanded', 'true');
    if (z.art === 'date') { var d = lies(z.i.value) || grenze(z.i, new Date()); offen.blick = new Date(d.getFullYear(), d.getMonth(), 1); offen.hier = d; kalender(); }
    else zeit();
    lageF(); requestAnimationFrame(function () { f.classList.add('zw--auf'); });
    f.addEventListener('keydown', taste);
  }
  function zu(fokus) {
    if (!offen) return;
    var o = offen; offen = null; o.z.k.setAttribute('aria-expanded', 'false'); o.f.classList.remove('zw--auf');
    setTimeout(function () { if (o.f.parentNode) o.f.parentNode.removeChild(o.f); }, 320);
    if (fokus) o.z.k.focus();
  }
  function lageF() {
    if (!offen) return;
    var f = offen.f, r = offen.z.k.getBoundingClientRect(), b = f.offsetWidth, h = f.offsetHeight, vw = doc.documentElement.clientWidth, vh = window.innerHeight;
    var x = Math.max(10, Math.min(r.left, vw - b - 10)), unten = r.bottom + 10 + h <= vh || r.top - 10 - h < 60, y = unten ? r.bottom + 10 : r.top - 10 - h;
    f.classList.toggle('zw--oben', !unten);
    if (offen.fest) { f.style.left = x + 'px'; f.style.top = Math.max(10, y) + 'px'; }
    else { f.style.left = (x + window.scrollX) + 'px'; f.style.top = (y + window.scrollY) + 'px'; }
  }
  function grenze(i, d) { var mn = lies(i.min), mx = lies(i.max); if (mn && d < mn) return mn; if (mx && d > mx) return mx; return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function setze(z, wert) { z.i.value = wert; z.i.dispatchEvent(new Event('input', { bubbles: true })); z.i.dispatchEvent(new Event('change', { bubbles: true })); schreibe(z.i); }

  /* ----- Kalender: ein Monat, Wochentage in der Sprache der Seite, Woche beginnt am Montag ----- */
  function kalender() {
    var o = offen, i = o.z.i, mn = lies(i.min), mx = lies(i.max), wahl = lies(i.value), heute = iso(new Date()), b = o.blick, j = b.getFullYear(), m = b.getMonth();
    var h = '<div class="zw__kopf"><button type="button" class="zw__pfeil zw__pfeil--zur" data-schritt="-1" aria-label="' + W[0] + '">' + PF + '</button><p class="zw__monat"><b>' + fMonat.format(b) + '</b> ' + j + '</p><button type="button" class="zw__pfeil" data-schritt="1" aria-label="' + W[1] + '">' + PF + '</button></div><div class="zw__tage" aria-hidden="true">';
    for (var t = 0; t < 7; t++) h += '<span>' + fTag.format(new Date(2024, 0, 1 + t)).replace('.', '') + '</span>';   /* 1.1.2024 war ein Montag */
    h += '</div><div class="zw__raster" role="grid">';
    var leer = (new Date(j, m, 1).getDay() + 6) % 7, n = new Date(j, m + 1, 0).getDate();
    for (t = 0; t < leer; t++) h += '<span></span>';
    for (t = 1; t <= n; t++) {
      var d = new Date(j, m, t), s = iso(d), aus = (mn && d < mn) || (mx && d > mx);
      h += '<button type="button" class="zw__tag' + (s === heute ? ' zw__tag--heute' : '') + '" data-tag="' + s + '"' + (wahl && iso(wahl) === s ? ' aria-pressed="true"' : '') + (aus ? ' disabled' : '') + ' aria-label="' + fLang.format(d) + '" tabindex="-1">' + t + '</button>';
    }
    o.f.innerHTML = h + '</div>';
    var ziel = o.f.querySelector('[data-tag="' + iso(o.hier) + '"]:not([disabled])') || o.f.querySelector('.zw__tag[aria-pressed]') || o.f.querySelector('.zw__tag:not([disabled])');
    if (ziel) { ziel.tabIndex = 0; setTimeout(function () { if (offen === o) ziel.focus({ preventScroll: true }); }, 30); }
  }
  /* ----- Zeit: Stunden und Minuten nebeneinander, Schritt aus dem Feld (step in Sekunden) ----- */
  function zeit() {
    var o = offen, i = o.z.i, wert = /^\d\d:\d\d/.test(i.value) ? i.value : '12:00', hh = +wert.slice(0, 2), mm = +wert.slice(3, 5);
    var schritt = Math.max(1, Math.min(30, Math.round((+i.step || 900) / 60))); if (60 % schritt) schritt = 5;
    mm = Math.round(mm / schritt) * schritt % 60;
    var h = '<div class="zw__zeit"><div class="zw__spalte" role="listbox" aria-label="' + W[2] + '" data-teil="h">';
    for (var t = 0; t < 24; t++) h += '<button type="button" role="option" class="zw__z" data-w="' + t + '" aria-selected="' + (t === hh) + '" tabindex="' + (t === hh ? 0 : -1) + '">' + zwei(t) + '</button>';
    h += '</div><i class="zw__punkt" aria-hidden="true">:</i><div class="zw__spalte" role="listbox" aria-label="' + W[3] + '" data-teil="m">';
    for (t = 0; t < 60; t += schritt) h += '<button type="button" role="option" class="zw__z" data-w="' + t + '" aria-selected="' + (t === mm) + '" tabindex="' + (t === mm ? 0 : -1) + '">' + zwei(t) + '</button>';
    o.f.innerHTML = h + '</div></div>';
    o.hh = hh; o.mm = mm;
    [].forEach.call(o.f.querySelectorAll('.zw__spalte'), function (sp) { var a = sp.querySelector('[aria-selected=true]'); if (a) sp.scrollTop = a.offsetTop - sp.clientHeight / 2 + a.offsetHeight / 2; });
    var e = o.f.querySelector('[data-teil=h] [aria-selected=true]'); if (e) setTimeout(function () { if (offen === o) e.focus({ preventScroll: true }); }, 30);
  }

  doc.addEventListener('click', function (e) {
    if (!offen || !offen.f.contains(e.target)) return;
    var o = offen, p = e.target.closest('[data-schritt]'), tg = e.target.closest('.zw__tag'), zz = e.target.closest('.zw__z');
    if (p) { o.blick = new Date(o.blick.getFullYear(), o.blick.getMonth() + (+p.getAttribute('data-schritt')), 1); o.hier = o.blick; kalender(); lageF(); }
    else if (tg && !tg.disabled) { setze(o.z, tg.getAttribute('data-tag')); zu(true); }
    else if (zz) {
      var teil = zz.parentNode.getAttribute('data-teil'); if (teil === 'h') o.hh = +zz.getAttribute('data-w'); else o.mm = +zz.getAttribute('data-w');
      [].forEach.call(zz.parentNode.children, function (x) { x.setAttribute('aria-selected', String(x === zz)); x.tabIndex = x === zz ? 0 : -1; });
      setze(o.z, zwei(o.hh) + ':' + zwei(o.mm));
      if (teil === 'm') zu(true); else { var m = o.f.querySelector('[data-teil=m] [aria-selected=true]'); if (m) m.focus({ preventScroll: true }); }
    }
  });
  function taste(e) {
    var o = offen; if (!o) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); zu(true); return; }
    if (e.key === 'Tab') { zu(false); return; }
    if (o.z.art === 'date') {
      var a = doc.activeElement, d = a && a.getAttribute && lies(a.getAttribute('data-tag')); if (!d) return;
      var plus = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (SP === 'ar' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) plus = -plus;
      if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); d = new Date(d.getFullYear(), d.getMonth() + (e.key === 'PageUp' ? -1 : 1), d.getDate()); }
      else if (plus) { e.preventDefault(); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + plus); }
      else return;
      d = grenze(o.z.i, d); o.hier = d; o.blick = new Date(d.getFullYear(), d.getMonth(), 1); kalender(); lageF();
    } else {
      var z = doc.activeElement; if (!z || !z.classList || !z.classList.contains('zw__z')) return;
      var n = e.key === 'ArrowDown' ? z.nextElementSibling : e.key === 'ArrowUp' ? z.previousElementSibling : null;
      if (n) { e.preventDefault(); n.focus(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var and = o.f.querySelector('[data-teil=' + (z.parentNode.getAttribute('data-teil') === 'h' ? 'm' : 'h') + '] [aria-selected=true]'); if (and) and.focus(); }
    }
  }
  doc.addEventListener('pointerdown', function (e) { if (offen && !offen.f.contains(e.target) && !offen.z.k.contains(e.target)) zu(false); }, true);
  window.addEventListener('resize', function () { [].forEach.call(doc.querySelectorAll('.zw-nativ'), lege); lageF(); });

  function alle() { [].forEach.call(doc.querySelectorAll('input[type=date],input[type=time]'), ruest); [].forEach.call(doc.querySelectorAll('.zw-nativ'), function (i) { lege(i); if (i._zwAnz && i._zwAnz.textContent !== (i.value || '–:–')) schreibe(i); }); }
  /* nach main.js (legt die Datumszeile an und markiert die Leisten mit eigenem Kalender), dann für alles, was später dazukommt oder sichtbar wird */
  var start = function () { setTimeout(alle, 60); };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
  setInterval(alle, 700);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(alle);
  window.susZeitwahl = { alle: alle };
})();
