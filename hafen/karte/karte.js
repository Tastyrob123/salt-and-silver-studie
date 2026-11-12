/* Salt & Silver · Werkzeug «Karte»: die gesetzten Speisekarten ändern. Links die Einträge einer Seite als Liste, rechts das Blatt; beides zeigt denselben Stand.
   Die Karte selbst ist die Wahrheit: jede Änderung geht direkt ins Blatt (im iframe) und von dort in den Speicher des Browsers (localStorage, je Karte die geänderten Seiten). */
(function () {
  var d = document, $ = function (s, w) { return (w || d).querySelector(s); }, $$ = function (s, w) { return Array.prototype.slice.call((w || d).querySelectorAll(s)); };
  var KARTEN = [], K = null, rahmen = $('#blatt'), doc = null, ORIG = {}, BASIS = {}, seite = 1, zoom = 0, vorher = false, MEINS = null;
  var STIL = '@media screen{html{background:transparent!important}body{background:transparent!important;margin:0!important;padding:0 0 20px!important}' +
    '.seite{margin:0 auto 18px!important;box-shadow:0 24px 36px -24px rgba(60,44,30,.8),0 0 0 1px rgba(60,44,30,.12)!important}' +
    '[data-k]{cursor:text;outline:1.5px dashed transparent;outline-offset:2px;border-radius:2px;transition:outline-color .25s}' +
    '[data-k]:hover{outline-color:rgba(255,49,50,.7)}[data-k]:focus{outline:2px solid #ff3132}.z.an-wz{outline:2px solid rgba(255,49,50,.55);outline-offset:3px;border-radius:3px}}';
  var PF = { hoch: '<svg viewBox="0 0 16 16"><path d="m4 10 4-4 4 4"/></svg>', runter: '<svg viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg>', weg: '<svg viewBox="0 0 16 16"><path d="M3.5 4.5h9M6 4.5V3h4v1.5M5 4.5l.6 8.5h4.8l.6-8.5"/></svg>', plus: '<svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg>' };

  function sag(t) { var k = $('#kopiert'); k.textContent = t; k.classList.add('da'); clearTimeout(sag.t); sag.t = setTimeout(function () { k.classList.remove('da'); }, 2200); }
  function lager(wert) {
    var k = 'sus-karte-' + K.k;
    try {
      if (wert === undefined) return JSON.parse(localStorage.getItem(k) || '{}');
      if (wert === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(wert));
    } catch (e) { return {}; }
  }
  function seiten() { return $$('.seite', doc); }
  function listeVon(s) { return $('.liste', s) || s; }
  function rein(el) { var c = el.cloneNode(true); $$('[data-k]', c).forEach(function (x) { x.removeAttribute('data-k'); x.removeAttribute('contenteditable'); x.removeAttribute('spellcheck'); }); $$('.an-wz', c).forEach(function (x) { x.classList.remove('an-wz'); }); $$('[style=""]', c).forEach(function (x) { x.removeAttribute('style'); }); return c.innerHTML; }  // leeres style-Attribut setzt der Browser beim Tippen, es zählt nicht als Änderung

  /* ---------- Speichern ---------- */
  function merke() {
    var a = {};
    seiten().forEach(function (s, i) { var h = rein(listeVon(s)); if (h !== ORIG[i]) a[i] = h; });
    if (Object.keys(a).length) lager(a); else lager(null);
    stand();
  }
  function stand() {
    var a = lager(), n = Object.keys(a).length;
    $('#f-titel').textContent = n ? (n === 1 ? 'Eine Seite geändert' : n + ' Seiten geändert') : 'Nichts geändert';
    $('#f-text').textContent = n ? 'Gespeichert in diesem Browser. «Probe-PDF» öffnet das Drucken-Fenster: dort «Als PDF sichern» wählen, Hintergründe an.' : 'Die Karte steht so da, wie sie gesetzt ist.';
    $('#vorher').disabled = !n; $('#zurueckstellen').disabled = !n;
    $$('#seiten .t-pille').forEach(function (p, i) { p.classList.toggle('geaendert', a[i] !== undefined); p.classList.toggle('an', i + 1 === seite); });
    voll();
  }
  /* Wie weit der unterste Eintrag einer Seite in den Fuss ragt (mm). Die gesetzte Karte ist der Massstab: gewarnt wird erst, wenn eine Seite voller ist als im Original. */
  function mass(s) {
    var l = listeVon(s), f = $('footer', s);
    if (!f || !l.lastElementChild) return null;
    var u = 0; $$('*', l).forEach(function (e) { u = Math.max(u, e.getBoundingClientRect().bottom); });
    return (u - f.getBoundingClientRect().top) / (s.getBoundingClientRect().width / 210);
  }
  function voll() {
    var i = seite - 1, m = mass(seiten()[i]), box = $('#voll'), basis = Math.max(0, BASIS[i] || 0);
    box.hidden = m === null || m <= basis + .8;
    if (!box.hidden) $('#voll-text').textContent = 'Der letzte Eintrag steht ' + Math.max(1, Math.round(m - basis)) + ' mm zu tief. Einen Eintrag kürzen, entfernen oder auf die nächste Seite setzen.';
  }

  /* ---------- Blatt bearbeitbar machen ---------- */
  function scharf(wurzel) {
    $$('[data-t],[data-h],[data-u],[data-sp] i', wurzel).forEach(function (el) {
      if (el.hasAttribute('data-k')) return;
      el.setAttribute('data-k', ''); el.setAttribute('contenteditable', 'true'); el.setAttribute('spellcheck', 'false');
      el.addEventListener('input', function () { merke(); liste(true); });
      el.addEventListener('focus', function () { var nr = seiten().indexOf(el.closest('.seite')) + 1; if (nr && nr !== seite) { seite = nr; liste(); stand(); kopfzeile(); } markiere(el.closest('.z')); });
      el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); el.blur(); } });
      el.addEventListener('paste', function (ev) { ev.preventDefault(); doc.execCommand('insertText', false, (ev.clipboardData || window.clipboardData).getData('text/plain').replace(/\s+/g, ' ')); });
    });
  }
  function markiere(z) {
    $$('.an-wz', doc).forEach(function (x) { x.classList.remove('an-wz'); });
    $$('.ka-e.an').forEach(function (x) { x.classList.remove('an'); });
    if (!z) return;
    z.classList.add('an-wz');
    var i = $$('.z', listeVon(seiten()[seite - 1])).indexOf(z), zeile = $$('.ka-e')[i];
    if (zeile) zeile.classList.add('an');
  }
  /* Name mit fettem Anfang: bis zum ersten Komma fett, wie in der gesetzten Karte */
  function setzeName(el, text) {
    var b = $('b', el);
    if (!b) { el.textContent = text; return; }
    var i = text.indexOf(',');
    el.innerHTML = ''; var nb = doc.createElement('b'); nb.textContent = i >= 0 ? text.slice(0, i + 1) : text; el.appendChild(nb);
    if (i >= 0) el.appendChild(doc.createTextNode(text.slice(i + 1)));
  }

  /* ---------- Liste der Seite ---------- */
  function knopf(art, titel) { var b = d.createElement('button'); b.type = 'button'; b.title = titel; b.setAttribute('aria-label', titel); b.innerHTML = PF[art]; return b; }
  function liste(nurWerte) {
    var erstesMal = !liste.war;
    var s = seiten()[seite - 1], l = listeVon(s), box = $('#eintraege');
    var teile = $$('[data-h],.z', l).filter(function (e) { return !e.closest('.z') || e.classList.contains('z'); });
    if (nurWerte) {  // Tippen im Blatt: nur die Felder nachziehen, nichts neu aufbauen (sonst springt der Zeiger)
      var felder = $$('[data-feld]', box);
      felder.forEach(function (f) { var el = f._el; if (el && d.activeElement !== f) f.value = el.textContent.trim(); });
      return;
    }
    box.innerHTML = '';
    if (!teile.length) { box.innerHTML = '<p class="ka-klein">Auf dieser Seite steht kein Eintrag zum Ändern.</p>'; return; }
    teile.forEach(function (el) {
      if (!el.classList.contains('z')) {
        var h = d.createElement('div'); h.className = 'ka-h';
        var hi = d.createElement('input'); hi.value = el.textContent.trim(); hi.setAttribute('data-feld', ''); hi._el = el; hi.setAttribute('aria-label', 'Überschrift');
        hi.addEventListener('input', function () { el.textContent = hi.value; merke(); });
        h.appendChild(hi); box.appendChild(h); return;
      }
      var z = d.createElement('div'); z.className = 'ka-e';
      var t = $('[data-t]', el), name = d.createElement('input');
      name.value = t ? t.textContent.trim() : ''; name.setAttribute('data-feld', ''); name._el = t; name.setAttribute('aria-label', 'Gericht');
      name.addEventListener('input', function () { setzeName(t, name.value); scharf(el); merke(); });
      name.addEventListener('focus', function () { markiere(el); zeigeIm(el); });
      z.appendChild(name);
      var preise = $$('[data-sp] i', el), pz = d.createElement('div'); pz.style.display = 'grid'; pz.style.gap = '4px';
      preise.forEach(function (p) {
        var pi = d.createElement('input'); pi.className = 'preis'; pi.value = p.textContent.trim(); pi.setAttribute('data-feld', ''); pi._el = p; pi.setAttribute('aria-label', 'Preis'); pi.setAttribute('inputmode', 'decimal');
        pi.addEventListener('input', function () { p.textContent = pi.value; merke(); });
        pi.addEventListener('focus', function () { markiere(el); zeigeIm(el); });
        pz.appendChild(pi);
      });
      z.appendChild(pz);
      var tun = d.createElement('div'); tun.className = 'ka-tun';
      var hoch = knopf('hoch', 'Nach oben'), runter = knopf('runter', 'Nach unten'), weg = knopf('weg', 'Entfernen'), neu = knopf('plus', 'Neuer Eintrag darunter');
      hoch.addEventListener('click', function () { var v = el.previousElementSibling; if (v && v.classList.contains('z')) { el.parentNode.insertBefore(el, v); merke(); liste(); markiere(el); } });
      runter.addEventListener('click', function () { var n = el.nextElementSibling; if (n && n.classList.contains('z')) { el.parentNode.insertBefore(n, el); merke(); liste(); markiere(el); } });
      weg.addEventListener('click', function () {
        if (weg.getAttribute('data-sicher') !== '1') { weg.setAttribute('data-sicher', '1'); weg.style.boxShadow = 'inset 0 0 0 2px #ff3132'; sag('Noch einmal drücken zum Entfernen'); setTimeout(function () { weg.removeAttribute('data-sicher'); weg.style.boxShadow = ''; }, 3000); return; }
        el.remove(); merke(); liste(); sag('Entfernt');
      });
      neu.addEventListener('click', function () {
        var k = el.cloneNode(true); $$('[data-k]', k).forEach(function (x) { x.removeAttribute('data-k'); }); $$('[data-u]', k).forEach(function (x) { x.remove(); });
        var kt = $('[data-t]', k); if (kt) setzeName(kt, 'Neuer Eintrag, Beschreibung');
        $$('[data-sp] i', k).forEach(function (x) { x.textContent = '0'; });
        el.parentNode.insertBefore(k, el.nextSibling); scharf(k); merke(); liste(); markiere(k);
        var f = $$('.ka-e')[$$('.z', l).indexOf(k)]; if (f) { var eingabe = $('input', f); eingabe.focus(); eingabe.select(); }
      });
      tun.appendChild(hoch); tun.appendChild(runter); tun.appendChild(neu); tun.appendChild(weg); z.appendChild(tun);
      $$('[data-u]', el).forEach(function (u) {
        var ui = d.createElement('input'); ui.className = 'u'; ui.value = u.textContent.trim(); ui.setAttribute('data-feld', ''); ui._el = u; ui.setAttribute('aria-label', 'Zusatz');
        ui.addEventListener('input', function () { u.textContent = ui.value; merke(); });
        z.appendChild(ui);
      });
      box.appendChild(z);
    });
    if (erstesMal && box.children.length) { liste.war = true; if (window.wzEin) wzEin(box.children); }   // nur beim ersten Aufbau einschweben, danach sofort da
  }

  /* ---------- Blatt: Grösse, Seite zeigen ---------- */
  function passe() {
    if (!doc) return;
    var mm = 96 / 25.4, breit = 210 * mm, platz = $('#buehne').clientWidth - 30;
    var z = zoom || Math.min(1.4, platz / breit);
    doc.documentElement.style.zoom = z;
    requestAnimationFrame(function () { rahmen.style.height = Math.ceil(doc.documentElement.scrollHeight * z) + 10 + 'px'; rahmen.style.width = zoom && breit * z > platz ? Math.ceil(breit * z + 10) + 'px' : '100%'; });
    passe.z = z;
  }
  function zeigeSeite() {
    var s = seiten()[seite - 1]; if (!s) return;
    requestAnimationFrame(function () { $('#buehne').scrollTo({ top: Math.max(0, s.offsetTop * passe.z - 4), behavior: 'smooth' }); });
  }
  function zeigeIm(el) {
    var b = $('#buehne'), y = el.getBoundingClientRect().top * passe.z;
    var sicht = b.scrollTop, hoehe = b.clientHeight;
    if (y < sicht + 20 || y > sicht + hoehe - 80) b.scrollTo({ top: Math.max(0, y - hoehe / 3), behavior: 'smooth' });
  }
  function kopfzeile() {
    $('#b-seite').textContent = 'Seite ' + seite + ' von ' + seiten().length;
    $('#t-titel').textContent = 'Karte ' + K.n; $('#t-unter').textContent = 'Seite ' + seite + ' von ' + seiten().length;
  }
  function pillen() {
    var p = $('#seiten'); p.innerHTML = '';
    seiten().forEach(function (s, i) {
      var b = d.createElement('button'); b.className = 't-pille'; b.textContent = i + 1; b.setAttribute('aria-label', 'Seite ' + (i + 1));
      b.addEventListener('click', function () { seite = i + 1; liste(); stand(); kopfzeile(); zeigeSeite(); });
      p.appendChild(b);
    });
  }

  function einrichten() {
    doc = rahmen.contentDocument;
    var st = doc.createElement('style'); st.textContent = STIL; doc.head.appendChild(st);
    var s0 = seiten()[0].getBoundingClientRect();
    if (!/@page/.test(doc.documentElement.innerHTML)) { var pg = doc.createElement('style'); pg.textContent = '@page{size:210mm ' + (210 * s0.height / s0.width).toFixed(2) + 'mm;margin:0}@media print{.seite{margin:0!important;box-shadow:none!important}}'; doc.head.appendChild(pg); }
    ORIG = {}; BASIS = {}; seiten().forEach(function (s, i) { ORIG[i] = listeVon(s).innerHTML; });
    // erste Seite mit Einträgen (die Karte am Meer beginnt mit einem Deckblatt, dort stand links nur «kein Eintrag»)
    seite = Math.max(1, seiten().findIndex(function (s) { return $$('[data-h],.z', listeVon(s)).length; }) + 1); vorher = false; $('#vorher').classList.remove('an'); $('#vorher').textContent = 'Vorher ansehen';
    pillen(); passe(); kopfzeile();
    var weiter = function () {
      passe();
      seiten().forEach(function (s, i) { BASIS[i] = mass(s); });  // am unveränderten Blatt gemessen, erst danach kommt der eigene Stand hinein
      var a = lager();
      Object.keys(a).forEach(function (i) { var s = seiten()[+i]; if (s) listeVon(s).innerHTML = a[i]; });
      scharf(doc); liste(); stand();
      if (seite > 1) zeigeSeite();
    };
    (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(function () { setTimeout(weiter, 60); });
  }
  function oeffne(k) {
    K = k; history.replaceState(null, '', '#' + k.k);
    $$('.ka-karte').forEach(function (b) { b.classList.toggle('an', b.getAttribute('data-k') === k.k); });
    $('#k-name').innerHTML = 'Karte <em></em>'; $('#k-name em').textContent = k.n + '.';
    $('#original').href = '../../assets/karten/' + k.pdf;
    rahmen.onload = einrichten;
    rahmen.src = '../../assets/karten/' + k.datei;
  }

  $('#kleiner').addEventListener('click', function () { zoom = Math.max(.35, (passe.z || 1) - .12); passe(); });
  $('#groesser').addEventListener('click', function () { zoom = Math.min(2, (passe.z || 1) + .12); passe(); });
  $('#drucken').addEventListener('click', function () { rahmen.contentWindow.focus(); rahmen.contentWindow.print(); });
  $('#zurueckstellen').addEventListener('click', function () {
    if (this.getAttribute('data-sicher') !== '1') { this.setAttribute('data-sicher', '1'); this.textContent = 'Wirklich zurücksetzen?'; var k = this; setTimeout(function () { k.removeAttribute('data-sicher'); k.textContent = 'Zurücksetzen'; }, 3500); return; }
    this.removeAttribute('data-sicher'); this.textContent = 'Zurücksetzen';
    lager(null); rahmen.contentWindow.location.reload(); sag('Zurückgesetzt');
  });
  $('#vorher').addEventListener('click', function () {
    vorher = !vorher; this.classList.toggle('an', vorher); this.textContent = vorher ? 'Zurück zu meiner Fassung' : 'Vorher ansehen';
    if (vorher) { MEINS = lager(); seiten().forEach(function (s, i) { listeVon(s).innerHTML = ORIG[i]; }); }
    else { Object.keys(MEINS).forEach(function (i) { listeVon(seiten()[+i]).innerHTML = MEINS[i]; }); scharf(doc); }
    liste(); $('#eintraege').style.pointerEvents = vorher ? 'none' : ''; $('#eintraege').style.opacity = vorher ? '.55' : '';
  });
  window.addEventListener('resize', passe);
  var takt = null;
  $('#buehne').addEventListener('scroll', function () {
    clearTimeout(takt);
    takt = setTimeout(function () {
      if (!doc || d.activeElement && d.activeElement.closest && d.activeElement.closest('#eintraege')) return;
      var mitte = ($('#buehne').scrollTop + $('#buehne').clientHeight * .35) / passe.z, nr = 1;
      seiten().forEach(function (s, i) { if (s.offsetTop <= mitte) nr = i + 1; });
      if (nr !== seite) { seite = nr; liste(); stand(); kopfzeile(); }
    }, 140);
  });

  wzHole('karten.json', function (j) {
    KARTEN = j; var box = $('#karten');
    j.forEach(function (k) {
      var b = d.createElement('button'); b.className = 'ka-karte'; b.setAttribute('data-k', k.k);
      b.innerHTML = '<img src="../../karten/img/' + k.bild + '" alt=""><span><b></b><small></small></span>';
      $('b', b).textContent = k.n; $('small', b).textContent = k.seiten + (k.seiten === 1 ? ' Seite' : ' Seiten') + ' · ' + k.eintraege + ' Einträge';
      b.addEventListener('click', function () { oeffne(k); });
      box.appendChild(b);
    });
    var s = (location.hash || '').slice(1);
    oeffne(j.filter(function (x) { return x.k === s; })[0] || j[0]);
    window.addEventListener('hashchange', function () { var h = (location.hash || '').slice(1), k = j.filter(function (x) { return x.k === h; })[0]; if (k && k !== K) oeffne(k); });
  });
})();
