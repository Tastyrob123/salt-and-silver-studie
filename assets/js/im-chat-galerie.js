/* Handy-Reihe «Was Gäste wissen wollen» (/im-chat/), Robert 10.10.2026:
   beim Scrollen wandern Handy 1 und 3 nach unten, 2 und 4 nach oben (nur transform, ein Takt, nur solange der Abschnitt im Bild ist).
   Quelle: gast/landing/galerie.js (landing.py kopiert nach assets/js/im-chat-galerie.js). */
(function () {
  'use strict';
  var g = document.querySelector('.hg'); if (!g || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var zuege = [].slice.call(g.querySelectorAll('.hg__zug')), sichtbar = false, takt = 0;
  function lauf() {
    takt = 0; if (!sichtbar) return;
    var r = g.getBoundingClientRect(), h = innerHeight;
    var p = (h / 2 - (r.top + r.height / 2)) / (h / 2 + r.height / 2);   // -1 unten herein … 0 Mitte … 1 oben hinaus
    p = Math.max(-1, Math.min(1, p));
    var weg = Math.min(90, innerWidth * 0.06);
    zuege.forEach(function (z, i) { z.style.transform = 'translate3d(0,' + ((i % 2 ? -1 : 1) * p * weg).toFixed(1) + 'px,0)'; });
  }
  function an() { if (!takt) takt = requestAnimationFrame(lauf); }
  new IntersectionObserver(function (es) { sichtbar = es[0].isIntersecting; an(); }, { rootMargin: '20% 0px' }).observe(g);
  addEventListener('scroll', an, { passive: true });
  addEventListener('resize', an);
})();
