/* Salt & Silver · Werkzeuge: Gruss nach Tageszeit, Einblenden, Laufband läuft nur im Bild, Buchstaben-Rollen in der Leiste. */
(function () {
  var d = document, ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var g = d.getElementById('gruss');
  if (g) { var h = /[?&]gruss=tag/.test(location.search) ? 12 : new Date().getHours(); g.textContent = h < 11 ? 'Guten Morgen.' : h < 18 ? 'Guten Tag.' : 'Guten Abend.'; }  // ?gruss=tag: fester Gruss, damit das Standbild im Laptop der Werkbank der echten Seite gleicht
  var dt = d.getElementById('datum');
  if (dt) dt.textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  d.querySelectorAll('.rl').forEach(function (s) {
    var t = s.textContent; s.textContent = ''; s.setAttribute('aria-label', t);
    Array.prototype.forEach.call(t, function (b, k) {
      var i = d.createElement('i'); i.textContent = b; i.setAttribute('data-b', b); i.style.setProperty('--k', k); i.setAttribute('aria-hidden', 'true'); s.appendChild(i);
    });
  });

  var erste = d.querySelector('[data-start]');
  if (erste) requestAnimationFrame(function () { requestAnimationFrame(function () { erste.classList.add('da'); }); });

  var stuecke = d.querySelectorAll('[data-r]');
  if (ruhig || !('IntersectionObserver' in window)) {
    stuecke.forEach(function (e) { e.classList.add('da', 'nah'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da', 'nah'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    stuecke.forEach(function (e) { io.observe(e); });
    var bio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('laeuft', e.isIntersecting); });
    });
    d.querySelectorAll('.w-band').forEach(function (b) { bio.observe(b); });
  }

  /* Grunddaten eines Werkzeugs laden (karten.json, stuecke.json, marke.json …). Bricht das Laden ab (schwache Leitung), zweimal neu versuchen,
     danach unten sagen, was zu tun ist. Ohne das blieb ein Werkzeug bei einem Abbruch stumm leer (Prüfung 14.10.2026). */
  window.wzHole = function (url, fertig, rueckfall) {
    var versuch = 0;
    (function los() {
      fetch(url).then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(fertig, function () {
        if (++versuch < 3) { setTimeout(los, 1500 * versuch); return; }
        if (rueckfall) { rueckfall(); return; }
        var k = d.getElementById('kopiert'); if (k) { k.textContent = 'Keine Verbindung. Bitte die Seite neu laden.'; k.classList.add('da'); }
      });
    })();
  };
})();

/* Auftritt beim Scrollen für Stücke, die ein Werkzeug selbst zeichnet (11.11.2026, Prüfung der Oberfläche: was unterhalb des ersten Bildschirms steht,
   schwebt beim Hereinscrollen ein; was schon im Bild steht, kommt sofort). Aufruf: wzEin(Liste der Elemente) */
window.wzEin = function (liste) {
  var io = 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }) : null;
  Array.prototype.forEach.call(liste, function (k) { k.classList.add('ein'); if (!io || k.getBoundingClientRect().top < innerHeight * .92) k.classList.add('da'); else io.observe(k); });
};
