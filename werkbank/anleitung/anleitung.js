/* Anleitung zum Studio: Hereinkommen wie auf der Werkbank, Filme und Bilder werden per Klick groß (kino.js). */
(function () {
  'use strict';
  var doc = document, ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $$ = function (s, e) { return [].slice.call((e || doc).querySelectorAll(s)); };

  /* Buchstaben der großen Zeile, Wörter der Absätze (wie werkbank.js) */
  function fasse(el, wortweise) {
    var i = 0, label = el.textContent;
    (function geh(k) {
      [].slice.call(k.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var f = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (teil) {
            if (!teil) return;
            if (/^\s+$/.test(teil)) { f.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span');
            if (wortweise) { w.className = 'wt'; w.style.setProperty('--w', i++); w.textContent = teil; }
            else { w.className = 'w'; teil.split('').forEach(function (z) { var b = doc.createElement('span'); b.className = 'b'; b.style.setProperty('--i', i++); b.textContent = z; w.appendChild(b); }); }
            f.appendChild(w);
          });
          k.replaceChild(f, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') geh(n);
      });
    })(el);
    if (!wortweise) el.setAttribute('aria-label', label);
  }
  $$('.roll').forEach(function (e) { fasse(e, false); });
  $$('[data-a="worte"]').forEach(function (e) { fasse(e, true); });
  $$('.insel nav a').forEach(function (a) {
    var t = a.textContent; a.textContent = ''; a.setAttribute('aria-label', t);
    t.split('').forEach(function (z, i) { var s = doc.createElement('span'); s.style.setProperty('--i', i); s.textContent = z === ' ' ? ' ' : z; a.appendChild(s); });
  });

  /* Hereinkommen */
  var alle = $$('[data-a], .zt, .roll');
  if (ruhig || !('IntersectionObserver' in window)) alle.forEach(function (e) { e.classList.add('da'); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('da'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    alle.forEach(function (e) { io.observe(e); });
  }
  setTimeout(function () { doc.body.classList.add('da'); $$('.auftakt [data-a], .auftakt .roll, .auftakt .zt').forEach(function (e) { e.classList.add('da'); }); }, 80);

  /* Filme: kurz bevor ein Film ins Bild kommt, schon laden, damit er beim Klick sofort läuft (gespielt wird per Klick, kino.js) */
  if ('IntersectionObserver' in window) $$('.kino video').forEach(function (v) {
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { v.preload = 'auto'; o.disconnect(); } }, { rootMargin: '80% 0px' }).observe(v);
  });
})();
