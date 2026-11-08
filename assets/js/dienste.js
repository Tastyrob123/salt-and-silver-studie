/* Salt & Silver — Gäste-Funktionen (Tasty Studios, 10.10.2026, Vorlage: die Hotel-Websites der Familie Maeder)
   Tisch mit Datum, Uhrzeit und Gästen direkt in die OpenTable-Buchung · Heute in Hamburg und am Böhler Strand mit Vorschlag · Anfrage ab zehn Personen oder ein ganzes Haus · Zahlen fürs Studio.
   Wetter aus /api/dienste, Klicks an /api/zahlen (ohne Kekse, ohne Adressen). Fällt ein Dienst aus, bleibt der bisherige Weg. */
(function () {
  'use strict';
  var doc = document.documentElement, $ = function (s, c) { return (c || document).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var PFEIL = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 11 11 3M4.5 3H11v6.5"/></svg>';
  var DATEN = {}; try { DATEN = JSON.parse(($('#dn-daten') || {}).textContent || '{}'); } catch (e) {}
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var iso = function (t) { return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); };
  var TAGE_L = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var RUHIG = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]nomotion/.test(location.search);
  var EN = /\/en\//.test(location.pathname);

  /* ---------- Zahlen fürs Studio: was angeklickt wird, ohne Keks, ohne Adresse, ohne Namen ---------- */
  var SEITE = location.pathname.split('/').pop() || 'index.html', LAND = ((navigator.language || '').split('-')[1] || '').toUpperCase().slice(0, 2);
  function zaehle(t, mehr) {
    if (navigator.webdriver || !window.fetch || /\/(entwurf|vorher|live)\//.test(location.pathname)) return;
    var d = { t: t, s: (EN ? 'en/' : '') + SEITE, sp: EN ? 'en' : 'de', l: LAND }; for (var k in mehr) d[k] = mehr[k];
    var roh = JSON.stringify(d);
    try { if (navigator.sendBeacon && navigator.sendBeacon('/api/zahlen', new Blob([roh], { type: 'application/json' }))) return; } catch (e) {}
    try { fetch('/api/zahlen', { method: 'POST', headers: { 'content-type': 'application/json' }, body: roh, keepalive: true }).catch(function () {}); } catch (e) {}
  }
  zaehle('seite');
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-tisch]'); if (b) zaehle('buchen', { p: 'tisch' });
    var a = e.target.closest && e.target.closest('a.sitz'); if (a) zaehle('tisch', { p: a.getAttribute('data-haus') || '' });
    var k = e.target.closest && e.target.closest('[data-korb-rein],[data-kaufen],.kn[href*="kasse"]'); if (k) zaehle('package', { p: 'shop' });
  }, true);

  /* ---------- Tisch: Datum, Uhrzeit, Gäste → OpenTable mit diesen Angaben (restref-Fenster, geprüft 10.10.2026) ---------- */
  $$('form[data-tischfelder]').forEach(function (fo) {
    var el = fo.elements, dlg = fo.closest('dialog'), heute = new Date();
    el.tag.min = iso(heute); el.tag.value = iso(heute);
    var h = heute.getHours(); el.zeit.value = h < 12 ? '12:30' : h < 18 ? '19:00' : '20:00';
    function neu() {
      var t = el.tag.value, z = el.zeit.value || '19:00', p = Math.max(1, Math.min(20, +el.pers.value || 2));
      $$('a.sitz', dlg).forEach(function (a) {
        var ref = a.getAttribute('data-restref'); if (!ref) return;
        a.href = 'https://www.opentable.de/restref/client/?restref=' + ref + '&lang=' + (EN ? 'en-US' : 'de-DE') + '&covers=' + p + '&dateTime=' + encodeURIComponent(t + 'T' + z);
        var s = $('.sitz__kn', a); if (s) s.innerHTML = (EN ? 'Book for ' : 'Tisch für ') + p + (EN ? (p === 1 ? ' guest' : ' guests') : '') + ' · ' + z + '<i>' + PFEIL + '</i>';
      });
    }
    fo.addEventListener('input', neu); fo.addEventListener('change', neu); fo.addEventListener('submit', function (e) { e.preventDefault(); }); neu();
  });

  /* ---------- Wetter: Zeichen, Auftritt ---------- */
  var WMO = EN ? ['clear', 'mostly clear', 'partly cloudy', 'overcast', 'fog', 'drizzle', 'rain', 'snow', 'showers', 'snow showers', 'thunderstorm'] : ['klar', 'heiter', 'teils bewölkt', 'bedeckt', 'Nebel', 'Niesel', 'Regen', 'Schnee', 'Schauer', 'Schneeschauer', 'Gewitter'];
  var wmo = function (c) { var w = WMO; return c === 0 ? w[0] : c === 1 ? w[1] : c === 2 ? w[2] : c === 3 ? w[3] : c < 50 ? w[4] : c < 60 ? w[5] : c < 70 ? w[6] : c < 80 ? w[7] : c < 83 ? w[8] : c < 90 ? w[9] : w[10]; };
  var icon = function (c, tag) {
    var s = '<svg viewBox="0 0 32 32" aria-hidden="true">';
    if (c <= 1) s += tag === 0 ? '<path d="M20 6a10 10 0 1 0 6 16A12 12 0 0 1 20 6Z"/>' : '<circle cx="16" cy="16" r="6"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8"/>';
    else if (c <= 3 || (c >= 45 && c < 50)) s += (c === 2 ? '<circle cx="12" cy="11" r="4.5"/>' : '') + '<path d="M9 25h14a5 5 0 0 0 0-10 7 7 0 0 0-13.4 2A4 4 0 0 0 9 25Z"/>';
    else if ((c >= 71 && c < 80) || c === 85 || c === 86) s += '<path d="M9 20h14a5 5 0 0 0 0-10 7 7 0 0 0-13.4 2A4 4 0 0 0 9 20Z"/><path d="M11 24v4M16 23v4M21 24v4"/>';
    else s += '<path d="M9 20h14a5 5 0 0 0 0-10 7 7 0 0 0-13.4 2A4 4 0 0 0 9 20Z"/><path d="m11 23-1.5 4M16 23l-1.5 4M21 23l-1.5 4"/>';
    return s + '</svg>';
  };
  function belebe(wurzel) {
    $$('[data-anim]', wurzel).forEach(function (el) {
      if (RUHIG) { el.classList.add('dn-los', 'dn-ruhig'); return; }
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('dn-los'); }); });
    });
  }
  var istStrand = function (t) { return t && t.code <= 2 && (t.regen == null || t.regen < 30) && t.max >= 17; };
  var istTerrasse = function (t) { return t && t.code <= 3 && (t.regen == null || t.regen < 40) && t.max >= 15; };

  /* ---------- Heute: Hamburg (Terrasse) und Sankt Peter-Ording (Pfahlbau am Strand) ---------- */
  $$('[data-wetter-heute]').forEach(function (feld) {
    if (!window.fetch) return;
    var ort = feld.getAttribute('data-wetter-heute'), box = $('[data-vorschlag]', feld.parentNode);
    fetch('/api/dienste?was=wetter').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (w) {
      var o = w[ort]; if (!o) throw new Error('kein Ort');
      var t = o.tage[0], morgen = o.tage[1];
      var tag = function (name, x, i, jetzt) {
        return '<div class="dn-rw__tag" style="--i:' + i + '"><span class="dn-rw__wt">' + esc(name) + '</span><span class="dn-rw__dt">' + esc(wmo(jetzt ? jetzt.code : x.code)) + '</span><span class="dn-rw__ic">' + icon(jetzt ? jetzt.code : x.code, jetzt ? jetzt.tag : 1) + '</span><b class="dn-rw__max">' + Math.round(jetzt ? jetzt.temp : x.max) + '°</b><span class="dn-rw__min">' + (jetzt ? (EN ? 'today ' : 'heute ') + Math.round(x.min) + '° ' + (EN ? 'to' : 'bis') + ' ' + Math.round(x.max) + '°' : Math.round(x.min) + '° ' + (EN ? 'to' : 'bis') + ' ' + Math.round(x.max) + '°') + '</span><span class="dn-rw__nass"><i style="--h:' + Math.max(.04, (x.regen || 0) / 100) + '"></i></span><em>' + (EN ? 'Rain ' : 'Regen ') + x.regen + ' %</em></div>';
      };
      feld.innerHTML = '<div class="dn-rw" data-anim><div class="dn-edel__kopf"><span class="kopf">' + esc(o.name) + ' · ' + (EN ? 'now and today' : 'jetzt und heute') + '</span></div><div class="dn-rw__reihe">' + tag(EN ? 'Now' : 'Jetzt', t, 0, o.jetzt) + (morgen ? tag(EN ? 'Tomorrow' : 'Morgen', morgen, 1) : '') + '</div></div>';
      belebe(feld);
      if (!box) return;
      var titel, satz, kn;
      var knA = function (tx, h, linie) { return '<a class="kn kn--klein' + (linie ? ' kn--linie' : '') + '" href="' + h + '">' + tx + '<i>' + PFEIL + '</i></a>'; };
      if (ort === 'am') {
        if (istStrand(t)) { titel = EN ? ['Looks like', 'beach weather.'] : ['Das sieht nach', 'Strandwetter aus.']; satz = EN ? 'The kiosk opens from 12 to 5 pm in beach weather, the terrace of the stilt house faces the water. Fish grill until the last order at 9 pm.' : 'Bei Strandwetter hat der Kiosk von 12 bis 17 Uhr offen, die Terrasse des Pfahlbaus liegt zum Wasser. Fischgrill bis zur letzten Bestellung um 21 Uhr.'; }
        else { titel = EN ? ['A day', 'inside the stilt house.'] : ['Ein Tag', 'drinnen im Pfahlbau.']; satz = EN ? 'Wind and rain outside, fish grill and a warm corner by the window inside. Kitchen break from 3:30 to 5 pm.' : 'Draussen Wind und Regen, drinnen Fischgrill und eine warme Ecke am Fenster. Küchenpause von 15:30 bis 17 Uhr.'; }
        kn = '<button class="kn kn--klein" type="button" data-tisch>' + (EN ? 'Book a table' : 'Tisch reservieren') + '<i>' + PFEIL + '</i></button>' + knA(EN ? 'The menu' : 'Zur Karte', '#karte', true);
      } else {
        if (istTerrasse(t)) { titel = EN ? ['Tonight', 'on the terrace.'] : ['Heute Abend', 'auf der Terrasse.']; satz = EN ? 'Mild evening at Hafenstraße: the terrace is open, kitchen until 9:30 pm.' : 'Milder Abend an der Hafenstraße: Die Terrasse ist offen, Küche bis 21:30 Uhr.'; }
        else { titel = EN ? ['Tonight', 'by the world map.'] : ['Heute Abend', 'an der Weltkarte.']; satz = EN ? 'Not a terrace night. Inside: the long table, the bar and the map of all our journeys.' : 'Kein Terrassenabend. Drinnen: der lange Tisch, die Bar und die Karte all unserer Reisen.'; }
        kn = '<button class="kn kn--klein" type="button" data-tisch>' + (EN ? 'Book a table' : 'Tisch reservieren') + '<i>' + PFEIL + '</i></button>' + knA(EN ? 'The menu' : 'Zur Karte', '#karte', true);
      }
      box.innerHTML = '<div><h3 class="d3">' + titel[0] + ' <em class="w">' + titel[1] + '</em></h3><p class="lauf">' + satz + '</p><div class="kn-reihe">' + kn + '</div></div>';
      box.hidden = false;
      var b = $('[data-tisch]', box), d = $('dialog.tisch'); if (b && d && d.showModal) b.addEventListener('click', function () { d.showModal(); });
    }).catch(function () { feld.innerHTML = '<p class="dn-hinweis">' + (EN ? 'Weather not available right now.' : 'Das Wetter ist gerade nicht abrufbar.') + '</p>'; });
  });

  /* ---------- Ab zehn Personen oder ein ganzes Haus: Anfrage per E-Mail ---------- */
  $$('form[data-gruppe]').forEach(function (fo) {
    var el = fo.elements, hund = 0;
    el.tag.min = iso(new Date());
    $$('[data-hund]', fo).forEach(function (b) { b.addEventListener('click', function () { hund = +b.getAttribute('data-hund'); $$('[data-hund]', fo).forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); }); }); });
    fo.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = el.tag.value ? new Date(el.tag.value + 'T12:00') : null;
      var z = [(EN ? 'Restaurant: ' : 'Haus: ') + el.haus.value, (EN ? 'Date: ' : 'Datum: ') + (d ? TAGE_L[d.getDay()] + ', ' + d.toLocaleDateString('de-DE') : (EN ? 'open' : 'offen')), (EN ? 'Time: ' : 'Uhrzeit: ') + el.zeit.value, (EN ? 'Guests: ' : 'Personen: ') + el.pers.value, (EN ? 'Occasion: ' : 'Anlass: ') + el.anlass.value, (EN ? 'Whole restaurant: ' : 'Ganzes Haus: ') + (el.exklusiv.checked ? (EN ? 'yes' : 'ja') : (EN ? 'no' : 'nein')), (EN ? 'Dog: ' : 'Hund: ') + (hund ? (EN ? 'yes' : 'ja') : (EN ? 'no' : 'nein')), 'Name: ' + el.name.value, (EN ? 'Phone: ' : 'Telefon: ') + (el.tel.value || '-')];
      if (el.wunsch.value) z.push((EN ? 'Wishes: ' : 'Wünsche: ') + el.wunsch.value);
      zaehle('formular', { f: 'gruppe', p: el.haus.value.slice(0, 40) });
      location.href = 'mailto:' + (DATEN.mail_gruppen || '') + '?subject=' + encodeURIComponent((EN ? 'Group request, ' : 'Anfrage Gruppe, ') + el.pers.value + (EN ? ' guests, ' : ' Personen, ') + el.haus.value) + '&body=' + encodeURIComponent((EN ? 'Hello\n\n' : 'Moin\n\n') + z.join('\n') + (EN ? '\n\nBest regards\n' : '\n\nViele Grüße\n'));
    });
  });
})();
