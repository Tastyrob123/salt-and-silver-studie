/* Seite «Rezeption im Chat»: Einblenden beim Hereinscrollen, Knöpfe öffnen den Chat, 3D-Handy erst nachladen, wenn es naht,
   am Handy statt des 3D-Modells den flachen Rahmen mit demselben Film einmal abspielen.
   Ausgelöst wird über die Lage im Fenster, geprüft beim Scrollen (einmal je Bild) und beim Laden: das läuft in jedem Browser,
   auch dort, wo ein IntersectionObserver nicht anspringt. */
(function () {
  'use strict';
  var d = document.documentElement; d.classList.add('js');
  var ziele = [].slice.call(document.querySelectorAll('[data-r]'));
  ziele.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 90 + 'ms'; });
  var block = document.getElementById('s-telefon3d');
  var mobil = matchMedia('(max-width:900px) and (orientation:portrait),(max-width:700px)').matches;
  var film = document.getElementById('m-tel-film');
  var dreiD = false, filmLos = false, wartet = false;

  function laden3d() {
    if (dreiD) return; dreiD = true;
    var v = ((document.querySelector('script[src*="im-chat.js"]') || {}).src || '').split('v=')[1] || '';
    var s = document.createElement('script'); s.src = '../assets/js/rezeption3d.js?v=' + v; document.body.appendChild(s);
  }
  function filmStart() {
    if (filmLos || !film) return; filmLos = true;
    film.preload = 'auto'; film.load();
    film.addEventListener('canplay', function () { var p = film.play(); if (p && p.catch) p.catch(function () {}); }, { once: true });
  }
  function pruefe() {
    wartet = false;
    var h = innerHeight;
    for (var i = ziele.length - 1; i >= 0; i--) {
      var r = ziele[i].getBoundingClientRect();
      if (r.top < h * 0.92 && r.bottom > 0) { ziele[i].classList.add('da'); ziele.splice(i, 1); }
    }
    if (block && !mobil && !dreiD && block.getBoundingClientRect().top < h * 3) laden3d();
    if (film && mobil && !filmLos) { var f = film.getBoundingClientRect(); if (f.top < h * 0.6 && f.bottom > h * 0.3) filmStart(); }
  }
  function bald() { if (!wartet) { wartet = true; requestAnimationFrame(pruefe); } }
  addEventListener('scroll', bald, { passive: true });
  addEventListener('resize', bald);
  addEventListener('load', bald);
  pruefe();
  setTimeout(pruefe, 400);

  if (film) film.addEventListener('click', function () { filmStart(); var p = film.play(); if (p && p.catch) p.catch(function () {}); });   // Antippen startet den Film, falls der Browser das Abspielen ohne Berührung verweigert
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-chat]'); if (!b) return;
    var k = document.querySelector('.gast-knopf');
    if (k && !d.classList.contains('gast-offen')) k.click();
  });
})();
