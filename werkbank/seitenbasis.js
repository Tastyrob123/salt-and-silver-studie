/* Werkbank Salt & Silver: Buchstaben, Einblenden, Zahlen, Bänder, Vergleich, Gefüge, Studio. Keine Bibliothek, nativer Scroll. */
(function () {
  'use strict';
  var doc = document, ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $ = function (s, e) { return (e || doc).querySelector(s); }, $$ = function (s, e) { return [].slice.call((e || doc).querySelectorAll(s)); };

  /* ---------- Buchstaben einzeln fassen, Wörter bleiben zusammen ---------- */
  function fasse(el) {
    var i = 0;
    (function geh(k) {
      [].slice.call(k.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var f = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (teil) {
            if (!teil) return;
            if (/^\s+$/.test(teil)) { f.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'); w.className = 'w';
            teil.split('').forEach(function (z) { var b = doc.createElement('span'); b.className = 'b'; b.style.setProperty('--i', i++); b.textContent = z; w.appendChild(b); });
            f.appendChild(w);
          });
          k.replaceChild(f, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') geh(n);
      });
    })(el);
    el.setAttribute('aria-label', el.textContent);
  }
  $$('.roll').forEach(fasse);
  $$('.insel nav a').forEach(function (a) {
    var t = a.textContent; a.textContent = ''; a.setAttribute('aria-label', t);
    t.split('').forEach(function (z, i) { var s = doc.createElement('span'); s.style.setProperty('--i', i); s.textContent = z === ' ' ? ' ' : z; a.appendChild(s); });
  });

  /* ---------- Zahlen, die durchrollen ---------- */
  $$('.odo').forEach(function (o) {
    var z = o.getAttribute('data-z'); o.setAttribute('aria-label', z); o.textContent = '';
    z.split('').forEach(function (c, i) {
      if (!/\d/.test(c)) { var p = doc.createElement('i'); p.textContent = c; o.appendChild(p); return; }
      var s = doc.createElement('span'); s.className = 'od'; s.style.setProperty('--i', i); s.dataset.d = c;
      for (var d = 0; d < 10; d++) { var e = doc.createElement('i'); e.textContent = d; s.appendChild(e); }
      o.appendChild(s);
    });
  });
  function rolle(o) { $$('.od', o).forEach(function (s) { s.style.transform = 'translateY(' + (-10 * +s.dataset.d) + '%)'; }); }

  /* ---------- Einblenden ---------- */
  var ziele = $$('[data-r],.roll,.odo,[data-sicht]');
  function zeig(el) {
    el.classList.add('da');
    if (el.classList.contains('odo')) rolle(el);
    if (el.id === 'brett' && typeof spiel === 'function') spiel();
  }
  if (!('IntersectionObserver' in window) || ruhig) ziele.forEach(zeig);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { zeig(e.target); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    ziele.forEach(function (z) { io.observe(z); });
    var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('sichtbar', e.isIntersecting); }); });
    $$('[data-lauf]').forEach(function (z) { io2.observe(z); });
  }

  /* ---------- Leiste: wo bin ich, wie weit bin ich ---------- */
  var linie = $('.gang-linie'), links = $$('.insel nav a'), abschn = links.map(function (a) { return $(a.getAttribute('href')); });
  var stapel = $$('.stapel>*'), auftakt = $('.auftakt'), takt = 0;
  function lauf() {
    takt = 0;
    var y = scrollY, h = doc.documentElement.scrollHeight - innerHeight;
    if (linie) linie.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    var an = -1;
    abschn.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) an = i; });
    links.forEach(function (a, i) { a.classList.toggle('an', i === an); });
    if (auftakt && y < innerHeight && !ruhig && innerWidth > 1079) stapel.forEach(function (el, i) { el.style.translate = '0 ' + (-y * (0.04 + i * 0.045)).toFixed(1) + 'px'; });
  }
  addEventListener('scroll', function () { if (!takt) takt = requestAnimationFrame(lauf); }, { passive: true });
  lauf();

  /* ---------- Bänder zum Blättern ---------- */
  $$('.gang').forEach(function (g) {
    var band = $('.band', g), balken = $('.gang__b i', g), zahl = $('.gang__z', g), vor = $('[data-vor]', g), zur = $('[data-zur]', g), t = 0;
    function sichtbare() { return [].slice.call(band.children).filter(function (k) { return !k.hidden; }); }
    function stand() {
      t = 0;
      var max = band.scrollWidth - band.clientWidth, k = sichtbare(), x = band.scrollLeft;
      var teil = max > 0 ? x / max : 1;
      if (balken) balken.style.transform = 'scaleX(' + Math.max(0.08, teil) + ')';
      var nr = 1; k.forEach(function (el, i) { if (el.offsetLeft - band.offsetLeft - 40 <= x) nr = i + 1; });
      if (max > 0 && x >= max - 2) nr = k.length;
      if (zahl) zahl.textContent = ('0' + nr).slice(-2) + ' / ' + ('0' + k.length).slice(-2);
      if (zur) zur.disabled = x <= 2;
      if (vor) vor.disabled = x >= max - 2;
    }
    function schritt(r) { var k = sichtbare()[0]; if (!k) return; band.scrollBy({ left: r * (k.offsetWidth + parseFloat(getComputedStyle(band).columnGap || 20)), behavior: ruhig ? 'auto' : 'smooth' }); }
    band.addEventListener('scroll', function () { if (!t) t = requestAnimationFrame(stand); }, { passive: true });
    if (vor) vor.addEventListener('click', function () { schritt(1); });
    if (zur) zur.addEventListener('click', function () { schritt(-1); });
    g.stand = stand; stand();
    addEventListener('resize', stand);
  });

  /* ---------- Seiten: Reiter und Durchlauf ---------- */
  $$('.reiter').forEach(function (r) {
    var g = $(r.getAttribute('data-fuer')), band = $('.band', g);
    r.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      $$('button', r).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      var f = b.getAttribute('data-g');
      [].forEach.call(band.children, function (k) { k.hidden = !!f && k.getAttribute('data-g') !== f; });
      band.scrollLeft = 0; g.stand();
    });
  });
  $$('.film').forEach(function (f) {
    var s = $('.film__s', f), img = $('img', f);
    function mass() { var hs = s.clientHeight, hi = img.clientHeight || hs; f.style.setProperty('--h', hs + 'px'); f.style.setProperty('--dauer', Math.max(4, (hi - hs) / 190).toFixed(1) + 's'); }
    f.addEventListener('pointerenter', mass);
    f.addEventListener('touchstart', function () { mass(); f.classList.toggle('laeuft'); }, { passive: true });
  });

  /* ---------- Vorher / Nachher ---------- */
  $$('.vgl').forEach(function (v) {
    var inp = $('input', v);
    inp.addEventListener('input', function () { v.style.setProperty('--x', inp.value + '%'); });
  });

  /* ---------- Ordner kippen mit der Maus ---------- */
  if (matchMedia('(pointer:fine)').matches && !ruhig) $$('.ordner').forEach(function (o) {
    o.addEventListener('pointermove', function (e) { var r = o.getBoundingClientRect(); o.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 9).toFixed(2) + 'deg'); o.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 9).toFixed(2) + 'deg'); });
    o.addEventListener('pointerleave', function () { o.style.setProperty('--ry', '0deg'); o.style.setProperty('--rx', '0deg'); });
  });

  /* ---------- Studio: Schritt für Schritt ---------- */
  (function () {
    var st = $('.studio'); if (!st) return;
    var texte = $$('.schritt-t>div', st), bilder = $$('.buehne__s img', st), z = $('.schritt-z', st), balken = $('.gang__b i', st), adr = $('.fen__k span', st);
    var n = 0, auto = null, beruehrt = false;
    function setz(i) {
      n = (i + texte.length) % texte.length;
      texte.forEach(function (t, k) { t.classList.toggle('an', k === n); });
      bilder.forEach(function (b, k) { b.classList.toggle('an', k === n); if (k === n && b.dataset.src) { b.src = b.dataset.src; delete b.dataset.src; } if (k === (n + 1) % bilder.length && b.dataset.src) { b.src = b.dataset.src; delete b.dataset.src; } });
      z.textContent = ('0' + (n + 1)).slice(-2);
      balken.style.transform = 'scaleX(' + (n + 1) / texte.length + ')';
      if (adr) adr.textContent = texte[n].getAttribute('data-adr');
    }
    $('[data-vor]', st).addEventListener('click', function () { beruehrt = true; setz(n + 1); });
    $('[data-zur]', st).addEventListener('click', function () { beruehrt = true; setz(n - 1); });
    setz(0);
    if ('IntersectionObserver' in window && !ruhig) new IntersectionObserver(function (es) {
      clearInterval(auto);
      if (es[0].isIntersecting && !beruehrt) auto = setInterval(function () { if (beruehrt) return clearInterval(auto); setz(n + 1); }, 5200);
    }, { threshold: 0.45 }).observe(st);
  })();

  /* ---------- Gefüge: Bausteine, Linien, Wege ---------- */
  var B = window.GEFUEGE, brett = $('#brett'), spiel = function () {};
  if (B && brett) (function () {
    var NS = 'http://www.w3.org/2000/svg', svg = $('svg', brett), nodes = $('#brett-n'), nach = {}, kanten = [], gewaehlt = null;
    var pk = $('#bp-k'), pt = $('#bp-t'), pp = $('#bp-p'), pw = $('#bp-w');
    B.n.forEach(function (n) {
      var o = { id: n[0], sp: n[1], z: n[2], titel: n[3], unter: n[4], art: n[5], lang: n[6], text: n[7] };
      var d = doc.createElement('div'); d.className = 'bn' + (o.art ? ' bn--' + o.art : '');
      d.innerHTML = '<button type="button"><b></b><small></small></button>';
      $('b', d).textContent = o.titel; $('small', d).textContent = o.unter;
      nodes.appendChild(d); o.el = d; nach[o.id] = o;
      $('button', d).addEventListener('click', function () { waehle(gewaehlt === o.id ? null : o.id); });
    });
    function ordne() {
      var W = brett.clientWidth, zeilen = 0, hoch = 0;
      B.n.forEach(function (n) { zeilen = Math.max(zeilen, n[2] + 1); hoch = Math.max(hoch, nach[n[0]].el.offsetHeight); });
      var oben = 40, abstand = hoch + 38, H = oben + zeilen * abstand + 10;
      brett.style.height = H + 'px';
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      B.n.forEach(function (n) {
        var o = nach[n[0]];
        o.x = W * B.fx[o.sp]; o.oben = oben + o.z * abstand + (o.vers || 0); o.hb = o.el.offsetWidth / 2; o.h = o.el.offsetHeight; o.y = o.oben + o.h / 2;
        o.el.style.left = o.x + 'px'; o.el.style.top = o.oben + 'px';
      });
      return W;
    }
    function weg(a, b, nr) {
      if (a.sp === b.sp) { var u = a.z < b.z; return { d: 'M' + a.x + ' ' + (u ? a.oben + a.h : a.oben) + ' V' + (u ? b.oben - 5 : b.oben + b.h + 5), ex: a.x, ey: u ? b.oben - 5 : b.oben + b.h + 5, w: u ? 90 : -90 }; }
      var r = b.x > a.x ? 1 : -1, x1 = a.x + r * a.hb, x2 = b.x - r * (b.hb + 6), mx = (x1 + x2) / 2 + ((nr % 5) - 2) * 9, rad = Math.min(12, Math.abs(b.y - a.y) / 2);
      if (Math.abs(b.y - a.y) < 2) return { d: 'M' + x1 + ' ' + a.y + ' H' + x2, ex: x2, ey: b.y, w: r > 0 ? 0 : 180 };
      var s = b.y > a.y ? 1 : -1;
      return { d: 'M' + x1 + ' ' + a.y + ' H' + (mx - r * rad) + ' Q' + mx + ' ' + a.y + ' ' + mx + ' ' + (a.y + s * rad) + ' V' + (b.y - s * rad) + ' Q' + mx + ' ' + b.y + ' ' + (mx + r * rad) + ' ' + b.y + ' H' + x2, ex: x2, ey: b.y, w: r > 0 ? 0 : 180 };
    }
    function zeichne() {
      ordne();
      svg.innerHTML = '';
      kanten = B.k.map(function (k, i) {
        var a = nach[k[0]], b = nach[k[1]], w = weg(a, b, i);
        var p = doc.createElementNS(NS, 'path'); p.setAttribute('d', w.d); p.setAttribute('class', 'bl'); svg.appendChild(p);
        var kopf = doc.createElementNS(NS, 'path'); kopf.setAttribute('d', 'M-7,-4.5 L0,0 L-7,4.5'); kopf.setAttribute('class', 'bk');
        kopf.setAttribute('transform', 'translate(' + w.ex + ',' + w.ey + ') rotate(' + w.w + ')'); svg.appendChild(kopf);
        return { von: k[0], nach: k[1], p: p, kopf: kopf, len: p.getTotalLength() };
      });
      if (gewaehlt) waehle(gewaehlt, true);
    }
    function kette(id) {
      var drin = {}; drin[id] = 1;
      (function vor(x) { kanten.forEach(function (k) { if (k.von === x && !drin[k.nach]) { drin[k.nach] = 1; vor(k.nach); } }); })(id);
      (function zur(x) { kanten.forEach(function (k) { if (k.nach === x && !drin[k.von]) { drin[k.von] = 1; zur(k.von); } }); })(id);
      return drin;
    }
    function waehle(id, still) {
      gewaehlt = id;
      brett.classList.toggle('leise', !!id);
      var drin = id ? kette(id) : {};
      B.n.forEach(function (n) { var o = nach[n[0]]; o.el.classList.toggle('heiss', !!drin[o.id]); o.el.classList.toggle('gewaehlt', o.id === id); });
      kanten.forEach(function (k) { var h = !!(drin[k.von] && drin[k.nach]); k.p.classList.toggle('heiss', h); k.kopf.classList.toggle('heiss', h); });
      if (still) return;
      if (!id) { pk.textContent = B.start[0]; pt.textContent = B.start[1]; pp.textContent = B.start[2]; pw.textContent = ''; return; }
      var o = nach[id];
      pk.textContent = B.sp[o.sp]; pt.textContent = o.lang; pp.textContent = o.text;
      var namen = B.n.filter(function (n) { return drin[n[0]] && n[0] !== id; }).map(function (n) { return n[3]; });
      pw.textContent = namen.length ? 'Hängt zusammen mit: ' + namen.join(' · ') : '';
    }
    spiel = function () {
      waehle(null);
      if (ruhig) { brett.classList.remove('vor'); return; }
      brett.classList.add('vor');
      kanten.forEach(function (k) { k.p.style.transition = 'none'; k.p.style.strokeDasharray = k.len; k.p.style.strokeDashoffset = k.len; });
      B.n.forEach(function (n) { nach[n[0]].el.style.transitionDelay = (n[1] * 0.24 + n[2] * 0.05) + 's'; });
      void brett.offsetWidth;
      brett.classList.remove('vor');
      kanten.forEach(function (k) {
        var a = nach[k.von], b = nach[k.nach], t = Math.min(a.sp, b.sp) * 0.24 + 0.5;
        k.p.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1) ' + t + 's, opacity .4s, stroke .4s'; k.p.style.strokeDashoffset = 0;
        k.kopf.style.transition = 'opacity .4s ' + (t + 0.8) + 's, stroke .4s';
      });
      setTimeout(function () { B.n.forEach(function (n) { nach[n[0]].el.style.transitionDelay = ''; }); kanten.forEach(function (k) { k.p.style.strokeDasharray = ''; k.p.style.transition = ''; k.kopf.style.transition = ''; }); }, 3200);
    };
    zeichne();
    brett.classList.add('vor');
    var rt = 0; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(zeichne, 150); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(zeichne);
    var noch = $('#brett-noch'); if (noch) noch.addEventListener('click', spiel);
    if (brett.classList.contains('da') || ruhig || !('IntersectionObserver' in window)) spiel();
  })();
})();
