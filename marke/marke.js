/* Salt & Silver · Werkzeug «Marke»: Ansichten wechseln, Bildarchiv filtern, Foto im Browser zuschneiden und speichern, Dateien, Farben kopieren. */
(function () {
  var d = document, $ = function (s, w) { return (w || d).querySelector(s); }, $$ = function (s, w) { return Array.prototype.slice.call((w || d).querySelectorAll(s)); };
  var PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10"/></svg>';
  var D = null, bereich = 'Alle', wort = '';

  function zeige(name, merken) {
    $$('.t-ansicht').forEach(function (a) { var an = a.getAttribute('data-ansicht') === name; a.hidden = !an; if (an) $('#t-titel').textContent = a.getAttribute('data-name'); });
    $$('.t-nav[data-zu]').forEach(function (n) { n.classList.toggle('an', n.getAttribute('data-zu') === name); });
    if (merken !== false) history.replaceState(null, '', '#' + name);
    window.scrollTo(0, 0);
    requestAnimationFrame(function () { requestAnimationFrame(function () { $$('[data-ansicht="' + name + '"] .m-karte, [data-ansicht="' + name + '"] .m-farbe').forEach(function (k) { k.classList.add('da'); }); }); });
  }
  d.addEventListener('click', function (ev) {
    var z = ev.target.closest('[data-zu]');
    if (z) { zeige(z.getAttribute('data-zu')); return; }
    if (ev.target.closest('[data-zu-fenster]')) $('#foto').close();
  });

  function hinweis(t) { var k = $('#kopiert'); k.textContent = t; k.classList.add('da'); clearTimeout(hinweis.t); hinweis.t = setTimeout(function () { k.classList.remove('da'); }, 1800); }

  /* ---------- Bildarchiv ---------- */
  function raster() {
    var r = $('#raster'), n = 0, w = wort.toLowerCase();
    r.innerHTML = '';
    D.fotos.forEach(function (f) {
      if (bereich !== 'Alle' && f.b !== bereich) return;
      if (w && (f.n + ' ' + f.b).toLowerCase().indexOf(w) < 0) return;
      n++;
      var b = d.createElement('button'); b.className = 'm-bild';
      b.innerHTML = '<span class="m-bild__b"><img src="mini/' + f.k + '.webp" width="' + f.w + '" height="' + f.h + '" alt="" loading="lazy" decoding="async"></span><span class="m-bild__t"><small></small></span>';
      $('small', b).textContent = f.b; $('.m-bild__t', b).appendChild(d.createTextNode(f.n));
      b.addEventListener('click', function () { oeffne(f); });
      r.appendChild(b);
    });
    $('#leer').hidden = n > 0;
  }
  function pillen() {
    var p = $('#bereiche'); p.innerHTML = '';
    ['Alle'].concat(D.bereiche).forEach(function (b) {
      var k = d.createElement('button'); k.className = 't-pille' + (b === bereich ? ' an' : ''); k.textContent = b;
      k.addEventListener('click', function () { bereich = b; pillen(); raster(); });
      p.appendChild(k);
    });
  }

  /* ---------- Foto zuschneiden: nie grösser rechnen, als das Foto hergibt ---------- */
  var FORMATE = [['Beitrag', 4 / 5, 1080], ['Story', 9 / 16, 1080], ['Quer', 16 / 9, 1920], ['Ganzes Foto', 0, 0]];
  var bild = null, foto = null, format = FORMATE[0];
  function schnitt() {
    var w = bild.naturalWidth, h = bild.naturalHeight, v = format[1] || w / h, sw, sh;
    if (w / h > v) { sh = h; sw = Math.round(h * v); } else { sw = w; sh = Math.round(w / v); }
    var frei = w - sw, freiY = h - sh, lage = +$('#lage').value / 100;
    var zielB = format[2] ? Math.min(format[2], sw) : sw;
    return { sx: Math.round(frei * lage), sy: Math.round(freiY * lage), sw: sw, sh: sh, b: zielB, h: Math.round(zielB * sh / sw), frei: frei + freiY };
  }
  function male() {
    if (!bild) return;
    var s = schnitt(), c = $('#leinwand');
    c.width = s.b; c.height = s.h;
    c.getContext('2d').drawImage(bild, s.sx, s.sy, s.sw, s.sh, 0, 0, s.b, s.h);
    $('#schieber').style.visibility = s.frei > 0 ? '' : 'hidden';
    $('#f-mass').textContent = format[0] + ' · ' + s.b + ' × ' + s.h + ' Pixel';
  }
  function formate() {
    var p = $('#formate'); p.innerHTML = '';
    FORMATE.forEach(function (f) {
      var k = d.createElement('button'); k.className = 't-pille' + (f === format ? ' an' : ''); k.textContent = f[0];
      k.addEventListener('click', function () { format = f; $('#lage').value = 50; formate(); male(); });
      p.appendChild(k);
    });
  }
  function oeffne(f) {
    foto = f; format = FORMATE[0]; $('#lage').value = 50;
    $('#f-name').textContent = f.n; $('#f-bereich').textContent = f.b; $('#f-mass').textContent = 'Foto lädt';
    formate();
    bild = new Image();
    bild.onload = male;
    bild.onerror = function () { $('#f-mass').textContent = 'Das Foto liess sich gerade nicht laden. Bitte noch einmal öffnen.'; };
    bild.src = '../assets/img/' + f.k + '-l.webp';
    $('#foto').showModal();
  }
  $('#lage').addEventListener('input', male);
  $('#laden').addEventListener('click', function () {
    if (!bild || !bild.complete || !bild.naturalWidth) { hinweis('Das Foto lädt noch'); return; }
    $('#leinwand').toBlob(function (b) {
      var a = d.createElement('a'); a.href = URL.createObjectURL(b);
      a.download = 'salt-and-silver-' + foto.k + '-' + format[0].toLowerCase().replace(/\s+/g, '-') + '.jpg';
      d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      hinweis('Gespeichert');
    }, 'image/jpeg', 0.92);
  });
  $('#foto').addEventListener('click', function (ev) { if (ev.target === this) this.close(); });

  /* ---------- Logo & Dateien, Farben ---------- */
  function dateien() {
    var z = $('#d-liste'), gruppen = {};
    D.dateien.forEach(function (x) { (gruppen[x.g] = gruppen[x.g] || []).push(x); });
    Object.keys(gruppen).forEach(function (g) {
      var s = d.createElement('section'); s.className = 'm-gruppe'; s.innerHTML = '<h3></h3><div class="m-dateien"></div>'; $('h3', s).textContent = g;
      gruppen[g].forEach(function (x) {
        var a = d.createElement('a'); a.className = 'm-datei'; a.href = 'dateien/' + x.d; a.setAttribute('download', '');
        a.innerHTML = '<span class="m-datei__b m-datei__b--' + x.grund + '">' + (x.v ? '<img src="dateien/' + x.v + '" alt="" loading="lazy">' : '<span>' + x.art + '</span>') + '</span><span class="m-datei__t"><span><small>' + x.art + '</small></span><i>' + PF + '</i></span>';
        $('.m-datei__t span', a).appendChild(d.createTextNode(x.n));
        $('.m-dateien', s).appendChild(a);
      });
      z.appendChild(s);
    });
  }
  function farben() {
    var z = $('#f-liste');
    D.farben.forEach(function (f, i) {
      var b = d.createElement('button'); b.className = 'm-farbe'; b.style.transitionDelay = (i * 70) + 'ms';
      b.innerHTML = '<i style="background:' + f.w + ';transition-delay:' + (i * 70) + 'ms"></i><b></b><span></span><small></small>';
      $('b', b).textContent = f.n; $('span', b).textContent = f.w; $('small', b).textContent = f.r;
      b.addEventListener('click', function () {
        var fertig = function () { hinweis(f.w + ' kopiert'); }, nicht = function () { hinweis('Kopieren ging nicht: ' + f.w); };   // nie «kopiert» sagen, wenn es nicht geklappt hat
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(f.w).then(fertig, nicht); else nicht();
      });
      z.appendChild(b);
    });
  }

  wzHole('marke.json', function (j) {
    D = j; pillen(); raster(); dateien(); farben();
    $('#suche').addEventListener('input', function () { wort = this.value.trim(); raster(); });
    var ausAdresse = function () { var start = (location.hash || '').slice(1); zeige(/^[\w-]+$/.test(start) && $('[data-ansicht="' + start + '"]') ? start : 'uebersicht', false); };   // fremde Zeichen in der Adresse brechen sonst die Suche ab
    window.addEventListener('hashchange', ausAdresse);
    ausAdresse();
  });
})();
