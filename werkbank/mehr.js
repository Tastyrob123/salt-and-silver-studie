/* Werkbank Salt & Silver · Einschübe: Laptop der Werkzeuge (Reiter, Standbild, echtes Werkzeug beim Klick) und Bildfolge des Handys im Feed. */
(function () {
  var d = document, w = d.querySelector('.mw');

  /* ---------- Scrollgefühl: nur Abschnitte nahe am Bild hängen ihre Auftritte ans Scrollen (jede gekoppelte Bewegung kostet eine Ebene) ---------- */
  if ('IntersectionObserver' in window && window.CSS && CSS.supports && CSS.supports('animation-timeline: view()')) {
    var nah = new IntersectionObserver(function (es) { es.forEach(function (x) { x.target.classList.toggle('sf-nah', x.isIntersecting); }); }, { rootMargin: '90% 0px 90% 0px' });
    Array.prototype.forEach.call(d.querySelectorAll('.fl, .schluss, .fuss'), function (x) { nah.observe(x); });
  }

  /* ---------- Laptop ---------- */
  if (w) {
    var e = w.querySelector('.ml-e'), rahmen = null, offen = 'hafen';
    var bild = function () { return w.querySelector('.ml-b[data-mw="' + offen + '"]'); };
    var passe = function () { if (rahmen) rahmen.style.transform = 'scale(' + (e.clientWidth / +e.getAttribute('data-b')) + ')'; };
    var schliesse = function () {
      if (rahmen) { rahmen.remove(); rahmen = null; }
      e.classList.remove('laedt', 'live'); d.documentElement.classList.remove('mw-live');
    };
    var waehle = function (k) {
      offen = k; schliesse();
      Array.prototype.forEach.call(w.querySelectorAll('[data-mw]'), function (x) {
        var an = x.getAttribute('data-mw') === k; x.classList.toggle('an', an);
        if (x.classList.contains('mw-reiter')) x.setAttribute('aria-selected', an ? 'true' : 'false');
      });
      e.classList.toggle('neu', bild().getAttribute('data-frei') === '0');
    };
    var oeffne = function () {
      if (rahmen) return;
      var b = bild(), seite = b.getAttribute('data-seite');
      if (b.getAttribute('data-frei') === '0') { window.open(seite, '_blank', 'noopener'); return; }
      e.classList.add('laedt');
      rahmen = d.createElement('iframe');
      rahmen.title = b.alt; rahmen.width = e.getAttribute('data-b'); rahmen.height = e.getAttribute('data-h');
      rahmen.style.width = e.getAttribute('data-b') + 'px'; rahmen.style.height = e.getAttribute('data-h') + 'px';
      var meiner = rahmen;
      rahmen.addEventListener('load', function () {
        if (rahmen !== meiner) return;
        setTimeout(function () { if (rahmen !== meiner) return; meiner.classList.add('da'); e.classList.remove('laedt'); e.classList.add('live'); d.documentElement.classList.add('mw-live'); }, 350);
      });
      rahmen.src = seite; passe(); e.appendChild(rahmen);
    };
    var weiter = function (schritt) {
      var alle = Array.prototype.map.call(w.querySelectorAll('.mw-reiter'), function (x) { return x.getAttribute('data-mw'); });
      waehle(alle[(alle.indexOf(offen) + schritt + alle.length) % alle.length]);
    };
    w.addEventListener('click', function (ev) {
      var r = ev.target.closest('.mw-reiter');
      if (r) { waehle(r.getAttribute('data-mw')); return; }
      if (ev.target.closest('.mw-vor')) { weiter(1); return; }
      if (ev.target.closest('.mw-zu')) { weiter(-1); return; }
      if (ev.target.closest('.ml-e') && !e.classList.contains('live')) oeffne();
    });
    e.addEventListener('keydown', function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && !rahmen) { ev.preventDefault(); oeffne(); } });
    window.addEventListener('resize', passe);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (x) { if (!x.isIntersecting) schliesse(); }); }).observe(w);  // weit weg gescrollt: das Werkzeug wieder schliessen, das Standbild steht
    }
  }

  /* ---------- Handy im Feed: ein Klick in den Bildschirm lädt den echten Feed an dieselbe Stelle, dann scrollt das Rad im Feed. Am Handy führt der Tipp zur Feed-Seite. ---------- */
  var h = d.querySelector('.mfh__e');
  if (h) {
    var fein = matchMedia('(hover: hover) and (pointer: fine)').matches, fr = null;
    var mass = function () { if (fr) fr.style.transform = 'scale(' + (h.clientWidth / 393) + ')'; };
    var weg = function () { if (fr) { fr.remove(); fr = null; } h.classList.remove('laedt', 'live'); d.documentElement.classList.remove('mfh-live'); };
    var los = function () {
      if (!fein) { window.open(h.getAttribute('data-ziel'), '_blank', 'noopener'); return; }
      if (fr) return;
      h.classList.add('laedt');
      fr = d.createElement('iframe'); fr.title = 'Der Feed zum Scrollen';
      var meiner = fr;
      fr.addEventListener('load', function () { if (fr !== meiner) return; setTimeout(function () { if (fr !== meiner) return; meiner.classList.add('da'); h.classList.remove('laedt'); h.classList.add('live'); d.documentElement.classList.add('mfh-live'); }, 250); });
      fr.src = h.getAttribute('data-seite'); mass(); h.appendChild(fr);
    };
    h.addEventListener('click', function () { if (!h.classList.contains('live')) los(); });
    h.addEventListener('keydown', function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && !fr) { ev.preventDefault(); los(); } });
    window.addEventListener('resize', mass);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (x) { if (!x.isIntersecting) weg(); }); }).observe(h);
  }

  /* ---------- Schwere Stücke früh holen: Laptop, Handy und die Standbilder kommen gleich nach dem Laden der Seite über die Leitung (keine Rechenarbeit),
     damit sie beim Hinscrollen schon da sind. ---------- */
  var frueh = function () { Array.prototype.forEach.call(d.querySelectorAll('.ml-g, .ml-b, .mfh img, .mb-b img'), function (im) { im.loading = 'eager'; }); };
  if (d.readyState === 'complete') setTimeout(frueh, 900); else window.addEventListener('load', function () { setTimeout(frueh, 900); });
})();
