/* Werkbank Salt & Silver · neuer Stand 11.11.2026: Bewegung der Marken-Tafel (Vorlage «lebt»), Feed im Handy lädt am Rechner von selbst, Schalter «Nummern». */
(function () {
  'use strict';
  var d = document, ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* Marke: jede Zeile der Tafel kommt in Bewegung an, sobald sie im Bild ist */
  var hs = d.querySelector('.hs2');
  if (hs && 'IntersectionObserver' in window && !ruhig) {
    hs.classList.add('lebt');
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    [].forEach.call(hs.querySelectorAll('.hs2-z'), function (z) {
      if (z.getBoundingClientRect().top < innerHeight * 0.88) z.classList.add('da'); else io.observe(z);
    });
  }

  /* Feed: am Rechner liegt der echte Feed im Handy, sobald es im Bild ist (Klick dafür übernimmt mehr.js); Nummern zeigen die Reihenfolge zum Posten */
  var h = d.querySelector('.fw .mfh__e'), nr = d.querySelector('.fw-nr'), an = false;
  var fein = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function nummern() {
    var fr = h && h.querySelector('iframe'); if (!fr) return;
    try {
      var doc = fr.contentDocument; if (!doc || !doc.head) return;
      if (!doc.getElementById('wb-nr')) {
        var st = doc.createElement('style'); st.id = 'wb-nr';
        st.textContent = '.ig-p{position:relative}html.wb-nr .ig-p::after{content:attr(data-n);position:absolute;left:6px;top:6px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:rgba(17,20,33,.82);color:#fff;font:500 13px/22px system-ui,sans-serif;text-align:center}';
        doc.head.appendChild(st);
      }
      doc.documentElement.classList.toggle('wb-nr', an);
    } catch (e) {}
  }
  if (h) {
    if (fein && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting && !h.classList.contains('live') && !h.classList.contains('laedt')) h.click(); });
      }, { threshold: 0.35 }).observe(h);
    }
    new MutationObserver(function () { var fr = h.querySelector('iframe'); if (fr && !fr.dataset.nr) { fr.dataset.nr = '1'; fr.addEventListener('load', nummern); } }).observe(h, { childList: true });
  }
  if (nr) nr.addEventListener('click', function () {
    an = !an; nr.setAttribute('aria-checked', an ? 'true' : 'false'); nummern();
  });
})();
/* Wegweiser und Befund: Bilder rechtzeitig holen und entpacken, bevor das Kapitel ins Bild kommt (Vorlage «rh-karussell») */
(function(){var K=[].slice.call(document.querySelectorAll('#register .rgw,.sbf-b,.fd3-b'));if(!K.length)return;function hol(k){[].forEach.call(k.querySelectorAll('img'),function(i){try{i.fetchPriority='high'}catch(e){}i.loading='eager';if(i.decode)i.decode().catch(function(){})})}if(!('IntersectionObserver' in window)){K.forEach(hol);return}var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){io.unobserve(x.target);hol(x.target)}})},{rootMargin:'300% 0px 300% 0px'});K.forEach(function(k){io.observe(k)})})();
