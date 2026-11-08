/* Salt & Silver · Druckerei: Blatt aussuchen, Text direkt auf dem Blatt schreiben, Foto tauschen, als PDF speichern. Änderungen bleiben im Browser (localStorage). */
(function () {
  var d = document, $ = function (s, w) { return (w || d).querySelector(s); }, $$ = function (s, w) { return Array.prototype.slice.call((w || d).querySelectorAll(s)); };
  var D = null, gruppe = 'Alle', wort = '', offen = null, rahmen = $('#blatt'), ARCHIV = null, fotoZiel = null, vorher = false;
  var STIL = '@media screen{html{background:transparent!important}body{background:transparent!important;margin:0;padding:6px 0 30px}' +
    '.blatt{margin:0 auto 26px!important;box-shadow:0 30px 44px -28px rgba(60,44,30,.8),0 0 0 1px rgba(60,44,30,.12)}' +
    '[data-t]{cursor:text;outline:1.5px dashed transparent;outline-offset:3px;border-radius:3px;transition:outline-color .25s}' +
    '[data-t]:hover{outline-color:rgba(255,49,50,.65)}[data-t]:focus{outline:2px solid #ff3132}' +
    'img[data-f]{cursor:pointer}img[data-f]:hover{filter:brightness(1.12)}.dunkel{pointer-events:none}}';  // Abdunklungen über Fotos lassen den Klick durch

  function sag(t) { var k = $('#kopiert'); k.textContent = t; k.classList.add('da'); clearTimeout(sag.t); sag.t = setTimeout(function () { k.classList.remove('da'); }, 2200); }
  function lager(datei, wert) {
    var k = 'sus-druck-' + datei;
    try {
      if (wert === undefined) return JSON.parse(localStorage.getItem(k) || 'null') || { t: {}, f: {} };
      if (wert === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(wert));
    } catch (e) { return { t: {}, f: {} }; }
  }
  function zahl(s) { var a = lager(s.d); return Object.keys(a.t).length + Object.keys(a.f).length; }

  /* ---------- Atelier ---------- */
  function atelier() {
    var z = $('#atelier'), w = wort.toLowerCase(), n = 0; z.innerHTML = '';
    D.stuecke.forEach(function (s) {
      if (gruppe !== 'Alle' && s.g !== gruppe) return;
      if (w && (s.n + ' ' + s.f + ' ' + s.wozu).toLowerCase().indexOf(w) < 0) return;
      var b = d.createElement('button'); b.className = 'dr-stueck'; b.style.setProperty('--i', n % 3); n++;
      var g = zahl(s);
      b.innerHTML = '<span class="dr-stueck__b"><img src="../../drucksachen/img/' + s.d + '-1.webp" alt="" loading="lazy" data-v="' + (s.w / s.h).toFixed(4) + '"></span><span><b></b><small></small></span>';
      $('b', b).textContent = s.n; $('small', b).textContent = s.f + (g ? ' · ' + g + (g === 1 ? ' Stelle' : ' Stellen') + ' geändert' : '');
      b.addEventListener('click', function () { oeffne(s); });
      z.appendChild(b);
    });
    if (!n) z.innerHTML = '<p class="dr-leer">Dazu gibt es noch keine Vorlage.</p>';
    einpassen();
    requestAnimationFrame(function () { requestAnimationFrame(function () { $$('.dr-stueck', z).forEach(function (k) { k.classList.add('da'); }); }); });
  }
  /* Jedes Blatt bekommt seine Grösse in Pixeln: so hoch wie das Fach oder so breit wie drei Viertel der Spalte, je nachdem, was zuerst anstösst.
     Prozent-Höhen an Bildern rechnet Safari in solchen Fächern nicht (Blätter ragten über ihren Namen). */
  function einpassen() {
    $$('.dr-stueck__b').forEach(function (f) {
      var im = $('img', f), v = +im.getAttribute('data-v') || 1, b = f.clientWidth * .76, h = f.clientHeight;
      if (!b || !h) return;
      var breite = Math.min(b, h * v);
      im.style.width = Math.round(breite) + 'px'; im.style.height = Math.round(breite / v) + 'px';
    });
  }
  window.addEventListener('resize', einpassen);
  function pillen() {
    var p = $('#gruppen'); p.innerHTML = '';
    ['Alle'].concat(D.gruppen).forEach(function (g) {
      var k = d.createElement('button'); k.className = 't-pille' + (g === gruppe ? ' an' : ''); k.textContent = g;
      k.addEventListener('click', function () { gruppe = g; pillen(); atelier(); }); p.appendChild(k);
    });
  }
  function ansicht(name) {
    $$('.t-ansicht').forEach(function (a) { a.hidden = a.getAttribute('data-ansicht') !== name; });
    $('#fuss').hidden = name !== 'werk';
    if (name === 'atelier') { $('#t-titel').textContent = 'Alle Drucksachen'; $('#t-unter').textContent = D.stuecke.length + ' Vorlagen'; history.replaceState(null, '', '#'); atelier(); }
    window.scrollTo(0, 0);
  }

  /* ---------- Werkbank eines Blatts ---------- */
  function texte(doc) {
    var liste = [];
    $$('.satz *', doc).forEach(function (el) {
      if (el.closest('svg') || el.tagName === 'IMG' || el.tagName === 'BR') return;
      var eigen = Array.prototype.some.call(el.childNodes, function (k) { return k.nodeType === 3 && k.nodeValue.trim(); });
      if (eigen && !el.querySelector('svg,img') && !liste.some(function (v) { return v.contains(el); })) liste.push(el);
    });
    return liste;
  }
  function stand() {
    var a = lager(offen.d), n = Object.keys(a.t).length + Object.keys(a.f).length;
    $('#f-titel').textContent = n ? (n === 1 ? 'Eine Stelle geändert' : n + ' Stellen geändert') : 'Nichts geändert';
    $('#f-text').textContent = n ? 'Gespeichert in diesem Browser. «Als PDF speichern» öffnet das Drucken-Fenster: dort «Als PDF sichern» wählen, Hintergründe an.' : 'Das Blatt steht so da, wie es angelegt ist.';
    $('#vorher').disabled = !n; $('#zurueckstellen').disabled = !n;
  }
  /* Einrichten, sobald das Blatt gelesen ist, nicht erst wenn alle Fotos geladen sind (load). Am Handy mit langsamer Leitung
     stand die Postkarte sonst 7 Sekunden da, ohne dass sich Text oder Foto antippen liess (gemessen 14.10.2026). */
  function bereit(datei) {
    var n = 0;
    (function warte() {
      var doc = null; try { doc = rahmen.contentDocument; } catch (e) {}
      if (doc && doc.body && !doc.__eingerichtet && doc.readyState !== 'loading' && doc.URL.indexOf('/' + datei + '.html') > -1) einrichten();   // das alte Blatt (vor dem Neuladen) überspringen
      else if (++n < 600) setTimeout(warte, 25);
    })();
  }
  function einrichten() {
    var doc = rahmen.contentDocument;
    if (!offen || !doc || !doc.body || doc.URL.indexOf('/' + offen.d + '.html') < 0) return;   // leeres Blatt nach «Alle Drucksachen» oder ein altes Blatt: nichts einrichten
    var a = lager(offen.d);
    archiv().catch(function () {});   // im Hintergrund, ein Fehler zeigt sich erst beim Antippen eines Fotos
    if (doc.__eingerichtet) { passe(); return; }   // zweiter Aufruf (load nach dem Lesen): nur die Höhe nachziehen, die Fotos sind jetzt da
    doc.__eingerichtet = 1;
    var st = doc.createElement('style'); st.textContent = STIL; doc.head.appendChild(st);
    texte(doc).forEach(function (el, i) {
      el.setAttribute('data-t', i); el.setAttribute('data-original', el.innerHTML);
      if (a.t[i] !== undefined) el.innerHTML = a.t[i];
      el.setAttribute('contenteditable', 'true'); el.setAttribute('spellcheck', 'false');
      el.addEventListener('input', function () {
        var b = lager(offen.d);
        $$('[style=""]', el).forEach(function (x) { x.removeAttribute('style'); });  // leeres style-Attribut setzt der Browser beim Tippen
        if (el.innerHTML === el.getAttribute('data-original')) delete b.t[i]; else b.t[i] = el.innerHTML;
        lager(offen.d, b); stand();
      });
      el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); el.blur(); } });
      el.addEventListener('paste', function (ev) { ev.preventDefault(); doc.execCommand('insertText', false, (ev.clipboardData || window.clipboardData).getData('text/plain')); });
    });
    $$('.satz img', doc).forEach(function (im, i) {
      im.setAttribute('data-f', i); im.setAttribute('data-original', im.getAttribute('src'));
      if (a.f[i]) im.src = a.f[i];
      im.addEventListener('click', function () { fotoZiel = im; fotos(); });
    });
    passe(); stand();
    doc.fonts && doc.fonts.ready.then(passe);
  }
  function passe() {
    var doc = rahmen.contentDocument; if (!doc || !offen) return;
    var mm = 96 / 25.4, breit = (offen.w + 6) * mm, platz = rahmen.clientWidth - 8;
    var z = Math.min(1.6, platz / breit);
    doc.documentElement.style.zoom = z;
    rahmen.style.height = Math.ceil(doc.documentElement.scrollHeight * (doc.documentElement.style.zoom ? 1 : z)) + 20 + 'px';
    requestAnimationFrame(function () { rahmen.style.height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) * (('zoom' in doc.documentElement.style) ? z : 1) + 30 + 'px'; });
  }
  function oeffne(s) {
    if (!s.quelle) { window.open('../../drucksachen/pdf/Salt-and-Silver-' + s.d + '.pdf', '_blank'); return; }
    offen = s; vorher = false; $('#vorher').classList.remove('an'); $('#vorher').textContent = 'Vorher ansehen';
    $('#w-name').textContent = s.n; $('#w-format').textContent = s.f; $('#w-wozu').textContent = s.wozu; $('#w-papier').textContent = s.papier; $('#w-seiten').textContent = s.s;
    $('#t-titel').textContent = s.n; $('#t-unter').textContent = s.f;
    $('#original').href = '../../drucksachen/pdf/Salt-and-Silver-' + s.d + '.pdf';
    history.replaceState(null, '', '#' + s.d);
    ansicht('werk');
    rahmen.onload = einrichten;
    rahmen.src = '../../drucksachen/quelle/' + s.d + '.html';
    bereit(s.d);
  }
  $('#zurueck').addEventListener('click', function () { rahmen.onload = null; offen = null; rahmen.src = 'about:blank'; ansicht('atelier'); });
  $('#zurueckstellen').addEventListener('click', function () {
    if (this.getAttribute('data-sicher') !== '1') { this.setAttribute('data-sicher', '1'); this.textContent = 'Wirklich zurücksetzen?'; var k = this; setTimeout(function () { k.removeAttribute('data-sicher'); k.textContent = 'Zurücksetzen'; }, 3500); return; }
    this.removeAttribute('data-sicher'); this.textContent = 'Zurücksetzen';
    lager(offen.d, null); rahmen.contentWindow.location.reload(); bereit(offen.d); sag('Zurückgesetzt');
  });
  $('#vorher').addEventListener('click', function () {
    var doc = rahmen.contentDocument, a = lager(offen.d); vorher = !vorher;
    this.classList.toggle('an', vorher); this.textContent = vorher ? 'Zurück zu meiner Fassung' : 'Vorher ansehen';
    $$('[data-t]', doc).forEach(function (el) { var i = el.getAttribute('data-t'); el.innerHTML = vorher || a.t[i] === undefined ? el.getAttribute('data-original') : a.t[i]; el.setAttribute('contenteditable', vorher ? 'false' : 'true'); });
    $$('img[data-f]', doc).forEach(function (im) { var i = im.getAttribute('data-f'); im.src = vorher || !a.f[i] ? im.getAttribute('data-original') : a.f[i]; });
  });
  $('#drucken').addEventListener('click', function () { rahmen.contentWindow.focus(); rahmen.contentWindow.print(); });
  window.addEventListener('resize', passe);

  /* ---------- Foto tauschen ---------- */
  var fBereich = 'Alle';
  function fotoRaster() {
    var p = $('#f-bereiche'), r = $('#f-raster'); p.innerHTML = ''; r.innerHTML = '';
    ['Alle'].concat(ARCHIV.bereiche).forEach(function (b) {
      var k = d.createElement('button'); k.className = 't-pille' + (b === fBereich ? ' an' : ''); k.textContent = b;
      k.addEventListener('click', function () { fBereich = b; fotoRaster(); }); p.appendChild(k);
    });
    ARCHIV.fotos.forEach(function (f) {
      if (fBereich !== 'Alle' && f.b !== fBereich) return;
      var b = d.createElement('button'); b.title = f.n; b.innerHTML = '<img src="../../marke/mini/' + f.k + '.webp" alt="" loading="lazy">';
      b.addEventListener('click', function () {
        var src = '../../assets/img/' + f.k + '-l.webp', a = lager(offen.d);
        fotoZiel.src = src; a.f[fotoZiel.getAttribute('data-f')] = src; lager(offen.d, a); stand(); $('#fotos').close(); sag('Foto getauscht');
      });
      r.appendChild(b);
    });
  }
  /* Bildarchiv schon beim Öffnen eines Blatts holen: beim ersten Antippen eines Fotos verging sonst eine Sekunde ohne sichtbare Antwort (gemessen 14.10.2026) */
  var archivUnterwegs = null;
  function archiv() {
    if (ARCHIV) return Promise.resolve(ARCHIV);
    if (!archivUnterwegs) archivUnterwegs = fetch('../../marke/marke.json').then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(function (j) { ARCHIV = j; return j; }, function (e) { archivUnterwegs = null; throw e; });
    return archivUnterwegs;
  }
  function fotos() {
    var auf = function () { fotoRaster(); if (!$('#fotos').open) $('#fotos').showModal(); };
    if (ARCHIV) return auf();
    sag('Das Bildarchiv lädt');
    archiv().then(auf).catch(function () { sag('Das Bildarchiv ist gerade nicht erreichbar'); });
  }
  $('#fotos-zu').addEventListener('click', function () { $('#fotos').close(); });
  $('#fotos').addEventListener('click', function (ev) { if (ev.target === this) this.close(); });

  wzHole('stuecke.json', function (j) {
    D = j; pillen(); atelier();
    $('#suche').addEventListener('input', function () { wort = this.value.trim(); atelier(); });
    var ausAdresse = function () { var s = (location.hash || '').slice(1), st = D.stuecke.filter(function (x) { return x.d === s; })[0]; if (st && (!offen || offen.d !== st.d)) oeffne(st); };
    window.addEventListener('hashchange', ausAdresse);
    ausAdresse();
  });
})();
