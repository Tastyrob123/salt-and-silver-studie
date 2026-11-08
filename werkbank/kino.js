/* Kino: Ein Klick startet den Film, dabei wird das Fenster groß und der Rest dunkel. Ein weiterer Klick hält an, und das Fenster
   kehrt an seinen Platz zurück, ebenso wenn der Film zu Ende ist. Bewegt wird nur über transform (FLIP), nativer Scroll bleibt.
   Gilt für jedes .kino auf Werkbank und Anleitung: mit <video> als Film, ohne (.kino--bild) als Standbild, das ein Klick groß und wieder klein macht. */
(function () {
  'use strict';
  var doc = document, ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var dunkel = doc.createElement('div'); dunkel.className = 'kinodunkel'; doc.body.appendChild(dunkel);
  var offen = null, lauf = false;
  function kino(v) { return v.closest('.kino'); }

  var zurueck = null;  // Fokus vor dem Öffnen, kommt beim Schließen zurück
  function gross(k) {
    if (offen === k || lauf) return;
    if (offen) klein(offen, true);
    if (k.__platz && k.__platz.parentNode) k.__platz.parentNode.removeChild(k.__platz);  // Rest eines unterbrochenen Schließens
    var v = k.querySelector('video');
    var vor = k.getBoundingClientRect();
    var platz = doc.createElement('div'); platz.className = 'kinoplatz'; platz.style.height = vor.height + 'px'; platz.style.width = vor.width + 'px';
    platz.__seite = vor.width / Math.max(1, vor.height);
    k.parentNode.insertBefore(platz, k); k.__platz = platz;
    k.classList.add('kino--gross'); doc.body.classList.add('kino-offen'); dunkel.classList.add('an');
    var nach = k.getBoundingClientRect();
    var sx = vor.width / nach.width, sy = vor.height / nach.height;
    k.style.transformOrigin = '0 0';
    k.style.transition = 'none';
    k.style.transform = 'translate(' + (vor.left - nach.left) + 'px,' + (vor.top - nach.top) + 'px) scale(' + sx + ',' + sy + ')';
    offen = k; lauf = true;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      k.style.transition = ruhig ? 'none' : 'transform .7s cubic-bezier(.16,1,.3,1)';
      k.style.transform = 'none';
      setTimeout(function () { lauf = false; }, ruhig ? 0 : 720);
    }); });
    if (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    zurueck = doc.activeElement;
    var s = k.querySelector('.kino__s');
    if (s && s.focus) s.focus({ preventScroll: true });
  }
  function zu() { if (!offen) return; var v = offen.querySelector('video'); if (v && !v.paused) v.pause(); else klein(offen); }

  function klein(k, sofort) {
    if (offen !== k) return;
    var v = k.querySelector('video'), platz = k.__platz;
    offen = null;
    lauf = !(ruhig || sofort);  // während das Fenster zurückfährt, öffnet ein Klick es nicht erneut (sonst bleibt der Rest dunkel und ein Platzhalter liegen)
    if (v && !v.paused) v.pause();
    dunkel.classList.remove('an'); doc.body.classList.remove('kino-offen');
    if (!platz) { k.classList.remove('kino--gross'); k.style.transform = ''; lauf = false; return; }
    var vor = k.getBoundingClientRect(), ziel = platz.getBoundingClientRect();
    var sx = ziel.width / vor.width, sy = ziel.height / vor.height;
    k.style.transition = (ruhig || sofort) ? 'none' : 'transform .6s cubic-bezier(.16,1,.3,1)';
    k.style.transform = 'translate(' + (ziel.left - vor.left) + 'px,' + (ziel.top - vor.top) + 'px) scale(' + sx + ',' + sy + ')';
    var fertig = function () {
      lauf = false;
      if (k.__platz !== platz) return;
      k.style.transition = 'none'; k.style.transform = ''; k.classList.remove('kino--gross');
      if (platz.parentNode) platz.parentNode.removeChild(platz); k.__platz = null;
      if (zurueck && zurueck.focus && !sofort) { try { zurueck.focus({ preventScroll: true }); } catch (e) {} }
      zurueck = null;
    };
    if (ruhig || sofort) fertig(); else setTimeout(fertig, 620);
  }

  doc.addEventListener('click', function (e) {
    var ziel = e.target.closest('.kino__s, .kino__play');
    if (!ziel) return;
    var k = ziel.closest('.kino'), v = k && k.querySelector('video');
    if (!k || (!v && !k.classList.contains('kino--bild'))) return;
    e.preventDefault();
    if (offen === k) { zu(); return; }
    if (!v) { gross(k); return; }
    if (!v.getAttribute('src') && k.getAttribute('data-film')) { v.src = k.getAttribute('data-film'); v.load(); }
    gross(k);
  });
  doc.addEventListener('pause', function (e) { var k = kino(e.target); if (k && offen === k) klein(k); }, true);
  doc.addEventListener('ended', function (e) { var k = kino(e.target); if (k && offen === k) klein(k); }, true);
  doc.addEventListener('play', function (e) { var k = kino(e.target); if (k) k.classList.add('kino--laeuft'); }, true);
  doc.addEventListener('pause', function (e) { var k = kino(e.target); if (k) k.classList.remove('kino--laeuft'); }, true);
  doc.addEventListener('ended', function (e) { var k = kino(e.target); if (k) k.classList.remove('kino--laeuft'); }, true);
  dunkel.addEventListener('click', zu);
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
  // Fenstergröße ändert sich (Handy gedreht): der Film bleibt offen und läuft weiter; nur der Platzhalter passt sich der neuen Breite an
  addEventListener('resize', function () {
    var p = offen && offen.__platz;
    if (p) { p.style.width = ''; p.style.height = ''; p.style.aspectRatio = String(p.__seite || 16 / 9); }
  });
  // Mit der Tastatur erreichbar: Tab bis zum Film oder Bild, Eingabe oder Leertaste öffnet und schließt
  Array.prototype.forEach.call(doc.querySelectorAll('.kino'), function (k) {
    var s = k.querySelector('.kino__s');
    if (!s || s.hasAttribute('tabindex')) return;
    s.setAttribute('tabindex', '0');
    s.setAttribute('role', 'button');
    if (!s.getAttribute('aria-label')) s.setAttribute('aria-label', k.querySelector('video') || k.getAttribute('data-film') ? 'Film abspielen' : 'Bild vergrößern');
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var s = e.target.closest && e.target.closest('.kino__s');
    if (!s) return;
    e.preventDefault();
    s.click();
  });
})();
