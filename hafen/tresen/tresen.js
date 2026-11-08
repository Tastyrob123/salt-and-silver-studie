/* Salt & Silver · Tresen: Fragen aus dem Chat lesen (online /api/fragen, sonst Stand vom letzten Abruf), als erledigt markieren, Antwort-Entwürfe für Anfragen holen. Verschickt nichts. */
(function () {
  var d = document, $ = function (s, w) { return (w || d).querySelector(s); }, $$ = function (s, w) { return Array.prototype.slice.call((w || d).querySelectorAll(s)); };
  var FRAGEN = [], live = false, filter = 'alle', wort = '';
  var SPRACHE = { en: 'Englisch', fr: 'Französisch', es: 'Spanisch', it: 'Italienisch', nl: 'Niederländisch', da: 'Dänisch' };
  var BEISPIEL = 'Hallo zusammen,\n\nwir möchten am Samstag, 12. Dezember, mit 14 Leuten den Geburtstag meiner Schwester bei euch feiern. Habt ihr einen langen Tisch frei? Zwei von uns essen vegetarisch.\n\nViele Grüße\nJonas';

  function h(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sag(t) { var k = $('#kopiert'); k.textContent = t; k.classList.add('da'); clearTimeout(sag.t); sag.t = setTimeout(function () { k.classList.remove('da'); }, 2200); }
  function datum(z) { return new Date(z).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) + ', ' + new Date(z).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'; }
  function woche(z) {
    var x = new Date(z), mo = new Date(x); mo.setDate(x.getDate() - ((x.getDay() + 6) % 7)); mo.setHours(0, 0, 0, 0);
    return { k: mo.getTime(), titel: 'Woche ab ' + mo.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }) };
  }

  function zeige(name, merken) {
    $$('.t-ansicht').forEach(function (a) { var an = a.getAttribute('data-ansicht') === name; a.hidden = !an; if (an) $('#t-titel').textContent = a.getAttribute('data-name'); });
    $$('.t-nav[data-zu]').forEach(function (n) { n.classList.toggle('an', n.getAttribute('data-zu') === name); });
    if (merken !== false) history.replaceState(null, '', '#' + name);
    window.scrollTo(0, 0);
    requestAnimationFrame(function () { requestAnimationFrame(function () { $$('.tr-tuer,.tr-zahlen').forEach(function (k) { k.classList.add('da'); }); }); });
  }

  function karte(x) {
    var fehlt = !x.belegt && !x.erledigt;
    var zusatz = [datum(x.zeit)];
    if (x.sprache && x.sprache !== 'de') zusatz.push(SPRACHE[x.sprache] || x.sprache);
    if (x.buchung) zusatz.push('Tischwunsch');
    if (x.thema) zusatz.push(x.thema);
    return '<article class="tr-frage w-platte" data-id="' + h(x.id) + '"><span class="tr-frage__z"><img src="../z/' + (x.buchung ? 'taco' : 'sonne') + '-tinte.svg" alt=""></span>' +
      '<div><b>' + h(x.frage) + (fehlt ? '<i class="tr-marke tr-marke--fehlt">Steht nicht auf der Website</i>' : '') + (x.erledigt ? '<i class="tr-marke">Erledigt</i>' : '') + '</b><small>' + h(zusatz.join(' · ')) + '</small></div>' +
      '<div class="tr-frage__a">' + (fehlt ? '<a class="kn kn--klein" href="../../studio/#/gaeste">Als häufige Frage<i><svg viewBox="0 0 16 16"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg></i></a>' : '') +
      '<button class="t-pille" data-akt="' + (x.erledigt ? 'offen' : 'erledigt') + '">' + (x.erledigt ? 'Zurückholen' : 'Erledigt') + '</button></div>' +
      '<details><summary>Antwort im Chat</summary><p>' + h(x.antwort) + '</p></details></article>';
  }
  function gruppiert(liste, leerTitel, leerText) {
    if (!liste.length) return '<div class="tr-leerbild"><img src="../z/sonne-tinte.svg" alt=""><b>' + leerTitel + '</b><p>' + leerText + '</p></div>';
    var g = [], aus = '';
    liste.forEach(function (x) { var w = woche(x.zeit), y = g.filter(function (q) { return q.k === w.k; })[0]; if (!y) { y = { k: w.k, titel: w.titel, l: [] }; g.push(y); } y.l.push(x); });
    g.forEach(function (y) { aus += '<h3 class="tr-woche">' + h(y.titel) + '<span>' + y.l.length + '</span></h3>' + y.l.map(karte).join(''); });
    return aus;
  }
  function male() {
    var luecken = FRAGEN.filter(function (x) { return !x.belegt && !x.erledigt; });
    $('#z-alle').textContent = FRAGEN.length; $('#z-luecken').textContent = luecken.length;
    $('#z-tisch').textContent = FRAGEN.filter(function (x) { return x.buchung; }).length;
    $('#z-sprachen').textContent = FRAGEN.filter(function (x) { return x.sprache && x.sprache !== 'de'; }).length;
    $('#n-fragen').textContent = FRAGEN.length; $('#n-luecken').textContent = luecken.length;
    var f = $('#filter'); f.innerHTML = '';
    [['alle', 'Alle Fragen'], ['tisch', 'Mit Tischwunsch'], ['sprache', 'Andere Sprache'], ['erledigt', 'Erledigt']].forEach(function (p) {
      var b = d.createElement('button'); b.className = 't-pille' + (filter === p[0] ? ' an' : ''); b.textContent = p[1];
      b.addEventListener('click', function () { filter = p[0]; male(); }); f.appendChild(b);
    });
    var w = wort.toLowerCase();
    var liste = FRAGEN.filter(function (x) {
      if (w && (x.frage + ' ' + x.antwort).toLowerCase().indexOf(w) < 0) return false;
      return filter === 'tisch' ? x.buchung : filter === 'sprache' ? (x.sprache && x.sprache !== 'de') : filter === 'erledigt' ? x.erledigt : true;
    });
    $('#liste').innerHTML = gruppiert(liste, 'Nichts gefunden.', 'Zu dieser Auswahl gibt es keine Frage.');
    $('#luecken').innerHTML = gruppiert(luecken, 'Keine Lücken.', 'Jede Frage ließ sich aus eurer Website beantworten.');
  }

  function lade() {
    $('#f-text').textContent = 'Die Fragen werden geladen.';
    return fetch('/api/fragen', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      FRAGEN = j.fragen || []; live = true;
      $('#f-titel').textContent = 'Stand von jetzt'; $('#f-text').textContent = 'Die Fragen kommen aus dem Speicher eurer Website.';
    }).catch(function () {
      return fetch('stand.json').then(function (r) { return r.json(); }).then(function (j) {
        FRAGEN = j.fragen || []; live = false;
        $('#f-titel').textContent = 'Stand vom ' + j.stand; $('#f-text').textContent = 'Am Rechner zeigt der Tresen den letzten Abruf. Die Fragen von heute stehen in der Online-Fassung.';
      });
    }).catch(function () {   // weder Speicher noch letzter Abruf erreichbar: sagen, statt still leer zu bleiben
      FRAGEN = FRAGEN || []; $('#f-titel').textContent = 'Keine Verbindung'; $('#f-text').textContent = 'Die Fragen liessen sich gerade nicht laden. Bitte die Seite neu laden.';
    }).then(male);
  }

  d.addEventListener('click', function (ev) {
    var z = ev.target.closest('[data-zu]');
    if (z) { zeige(z.getAttribute('data-zu')); return; }
    var b = ev.target.closest('[data-akt]');
    if (b) {
      var k = b.closest('.tr-frage'); if (!k) return;
      var x = FRAGEN.filter(function (y) { return y.id === k.getAttribute('data-id'); })[0];
      if (!x) return;
      var tun = b.getAttribute('data-akt');
      if (!live) { x.erledigt = tun === 'erledigt'; male(); sag('Nur in dieser Ansicht gemerkt'); return; }
      fetch('/api/fragen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tun: tun, id: x.id }) })
        .then(function (r) { if (!r.ok) throw 0; x.erledigt = tun === 'erledigt'; male(); sag(tun === 'erledigt' ? 'Als erledigt gemerkt' : 'Zurückgeholt'); })
        .catch(function () { sag('Das hat nicht geklappt'); });
    }
  });
  $('#suche').addEventListener('input', function () { wort = this.value.trim(); male(); });
  $('#neu').addEventListener('click', function () { lade().then(function () { sag('Neu geladen'); }); });

  /* ---------- Anfragen ---------- */
  var entwurf = $('#entwurf');
  function fertig(text) {
    entwurf.textContent = text; entwurf.setAttribute('contenteditable', 'true');
    $('#kopieren').disabled = false; $('#mailen').setAttribute('aria-disabled', 'false');
    $('#mailen').href = 'mailto:?body=' + encodeURIComponent(text);
  }
  entwurf.addEventListener('input', function () { $('#mailen').href = 'mailto:?body=' + encodeURIComponent(entwurf.innerText); });
  $('#beispiel').addEventListener('click', function () { $('#anfrage').value = BEISPIEL; $('#hinweis').value = 'Der 12. Dezember ist frei. Langer Tisch im Restaurant geht bis 16 Personen.'; });
  $('#entwerfen').addEventListener('click', function () {
    var mail = $('#anfrage').value.trim();
    if (!mail) { sag('Bitte erst die Anfrage einfügen'); return; }
    var kn = this; kn.disabled = true;
    entwurf.removeAttribute('contenteditable'); entwurf.innerHTML = '<p class="tr-leer">Der Entwurf wird geschrieben.</p>';
    fetch('/api/gast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modus: 'anfrage', mail: mail, hinweis: $('#hinweis').value.trim() }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.text) throw new Error(j.fehler || (r.status === 504 ? 'Der Assistent hat zu lange gebraucht. Bitte noch einmal versuchen.' : '')); return j.text; }); })   // keine Antwort als Text (z. B. Zeitüberschreitung): verständlicher Satz statt Programmfehler
      .then(fertig)
      .catch(function (e) { entwurf.innerHTML = '<p class="tr-leer">' + h(e && e.message ? e.message : 'Entwürfe schreibt der Tresen in der Online-Fassung. Am Rechner gibt es die Verbindung dazu nicht.') + '</p>'; })
      .then(function () { kn.disabled = false; });
  });
  $('#kopieren').addEventListener('click', function () {
    var t = entwurf.innerText, ok = function () { sag('Kopiert'); }, nicht = function () { sag('Kopieren ging nicht. Bitte den Text markieren und kopieren.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, nicht); else nicht();
  });

  function ausAdresse() { var s = (location.hash || '').slice(1); zeige(/^[\w-]+$/.test(s) && $('[data-ansicht="' + s + '"]') ? s : 'uebersicht', false); }
  window.addEventListener('hashchange', ausAdresse);
  lade().then(ausAdresse);
})();
