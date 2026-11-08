/* Salt & Silver — Lader mit Reihenfolge (14.10.2026, Fassung 2; Bauart vom Grand Beau-Rivage, dort am 12.10.2026 auf gedrosselter Leitung gemessen).
   Robert 14.10.2026: «ganz oft laden Bilder nicht: erst blur, gräulich, ein, zwei Sekunden später sind sie da.» Gemessen (250 ms, 1,5 Mbit/s, kalt):
   Kopfbilder standen 0,3 bis 2,3 s unscharf, der erste Bildschirm brauchte 2,8 bis 6 s. Gründe: (1) die Fenster-Bilder (.bruch, stehen fest über dem
   Schirm) lud der Browser gleich beim Öffnen mit, 200 bis 700 kB neben dem Kopfbild; (2) die alte Fassung holte danach alles in vier Fensterhöhen auf
   einmal und den Rest zu viert, ohne Vorrang für das, was im Blick steht; (3) das Kopfbild der nächsten Seite wurde erst beim Öffnen bestellt.
   Jetzt: Online stehen die Fotos unter dem ersten Bildschirm «gehalten» im HTML (data-src/data-srcset, durchsichtiges Platzbild als src; schreibt
   halte.py in die Online-Kopie, site/ bleibt wie gebaut und lädt wie bisher über loading="lazy"). Dieses Skript entscheidet, was wann geholt wird:
   1. Zuerst gehört die Leitung dem ersten Bildschirm. Solange der nicht scharf ist, startet nichts anderes.
   2. Was sich dem Fenster nähert (gut eine Fensterhöhe voraus), kommt sofort und wird entpackt, an der Schlange vorbei.
   3. Alles Übrige der Seite kommt danach der Reihe nach, das Nächstliegende zuerst, nie mehr als GLEICH gleichzeitig.
   Wer ein gehaltenes Bild braucht, setzt wie bisher im.loading = 'eager' (main.js, shop.js): das Skript sieht die Änderung und gibt die Adresse frei.
   Fenster (.bruch): ihr Bild bleibt aus dem Bild (main.css: .bruch:not(.nah)>img), bis der Abschnitt naht. Kein Eingriff in den Scroll,
   keine Arbeit im Takt: nur Beobachter und eine Merkzahl. Messen: _qa/laden/ (lauf.sh, erster2.js). Fassung davor: _sicherung/2026-10-14-vor-bilder-lader/. */
(function () {
  'use strict';
  var doc = document, W = window;
  /* gehalten: Adresse freigeben */
  function frei(im) {
    if (!im.hasAttribute('data-src') && !im.hasAttribute('data-srcset')) return;
    var ss = im.getAttribute('data-srcset'), s = im.getAttribute('data-src'), jetzt = im.getAttribute('src') || '';
    im.removeAttribute('data-srcset'); im.removeAttribute('data-src');
    if (jetzt && jetzt.indexOf('data:') !== 0) { im.__frei = 1; return; }   /* ein Skript hat schon selbst eine Adresse gesetzt (Zimmer-Finder): die gilt */
    if (ss) im.setAttribute('srcset', ss);
    if (s) im.setAttribute('src', s);
    im.__frei = 1;
  }
  function gehalten(im) { return im.hasAttribute('data-src') || im.hasAttribute('data-srcset'); }
  function da(im) { return !gehalten(im) && im.complete && im.naturalWidth > 1; }
  function hole(im) { if (im.__h) return; im.__h = 1; frei(im); im.loading = 'eager'; }
  function entpacke(im) {
    if (im.__e || !im.decode) return; im.__e = 1;
    var los = function () { im.decode().catch(function () {}); };
    if (da(im)) los(); else im.addEventListener('load', los, { once: true });
  }
  /* wer irgendwo im.loading = 'eager' setzt, bekommt sein Bild (Beobachter auf dem Attribut, damit kein anderes Skript umgebaut werden muss) */
  var lauscher = ('MutationObserver' in W) ? new MutationObserver(function (ms) { ms.forEach(function (m) { var im = m.target; if (im.loading !== 'lazy' && gehalten(im)) hole(im); }); }) : null;
  function melde(im) { if (im.__m) return; im.__m = 1; if (lauscher) lauscher.observe(im, { attributes: true, attributeFilter: ['loading'] }); }
  var alle = [].slice.call(doc.querySelectorAll('img[loading="lazy"]'));
  var fenster = [].slice.call(doc.querySelectorAll('.bruch'));
  alle.forEach(melde);
  W.__bilderFrei = frei;   /* für Skripte, die eine Adresse sofort brauchen (Lupe) */
  if (!('IntersectionObserver' in W)) { fenster.forEach(function (b) { b.classList.add('nah'); }); alle.forEach(hole); return; }
  if (!alle.length) { fenster.forEach(function (b) { b.classList.add('nah'); }); return; }
  var netz = navigator.connection || {}, sparsam = !!netz.saveData || /2g/.test(netz.effectiveType || '');

  /* ---------- die Schlange: höchstens GLEICH Fotos unterwegs, Dringendes zählt mit und geht vor ---------- */
  /* GLEICH: höchstens so viele Fotos aus der Schlange zugleich. nahLaeuft: Fotos, die gleich im Blick stehen (nahe/bald) und noch unterwegs sind;
     solange eines davon läuft, startet die Schlange nichts Fernes, damit die Leitung dem Nahen gehört (Messung 12.10.2026, 1,5 Mbit/s:
     drei ferne Fotos zugleich hielten das nahe bis 2,8 s auf). */
  var GLEICH = 3, laeuft = 0, nahLaeuft = 0, frei_ = false, schlange = alle.slice(), neu = true;
  function starte(im, nah) {
    if (im.__h || da(im)) { hole(im); return; }
    laeuft++; if (nah) { nahLaeuft++; im.__n = 1; }
    var fertig = function () { if (im.__w) return; im.__w = 1; laeuft--; if (im.__n) nahLaeuft--; weiter(); };
    im.addEventListener('load', fertig, { once: true });
    im.addEventListener('error', fertig, { once: true });
    setTimeout(fertig, 8000);
    hole(im);
    if (da(im)) fertig();
  }
  function abstand(im) {
    var el = im.closest('.bruch') || im;
    if (el === im && im.offsetParent === null) return 1e7;
    var r = el.getBoundingClientRect(), h = W.innerHeight, w = W.innerWidth;
    var dy = r.bottom < 0 ? -r.bottom * 1.5 : (r.top > h ? r.top - h : 0);
    var dx = r.left > w ? r.left - w : (r.right < 0 ? -r.right : 0);
    return dy + dx * 2;
  }
  function weiter() {
    if (!frei_ || sparsam || nahLaeuft > 0) return;
    while (laeuft < GLEICH && schlange.length) {
      if (neu) {
        neu = false;
        schlange = schlange.filter(function (im) { return !im.__h && !da(im); });
        schlange.forEach(function (im) { im.__a = abstand(im); });
        schlange.sort(function (a, b) { return a.__a - b.__a; });
        if (!schlange.length) return;
      }
      var im = schlange.shift();
      if (im.__h || da(im)) continue;
      starte(im);
    }
  }
  W.addEventListener('scroll', function () { neu = true; }, { passive: true });
  /* für «Vorholen» unten: solange ein Kopfbild der nächsten Seite unterwegs ist, startet die Schlange nichts Fernes (es zählt wie ein nahes Foto);
     __bilderStand: steht der erste Bildschirm, wie viele nahe Fotos sind unterwegs, wie viele ferne stehen noch aus */
  W.__bilderNah = function (d) { nahLaeuft = Math.max(0, nahLaeuft + d); if (d < 0) weiter(); };
  W.__bilderStand = function () { return { erster: frei_, nah: nahLaeuft, fern: laeuft + schlange.filter(function (im) { return !im.__h && !da(im); }).length }; };

  /* ---------- was sich dem Fenster nähert: sofort ---------- */
  var gruppen = [], ziel = function (im) { return im.closest('.bruch,.band,.gangband,.polas') || im; };
  function fotos(el) { return el.tagName === 'IMG' ? [el] : [].slice.call(el.querySelectorAll('img[loading]')); }
  var wartet = [];
  function nahe(z) {
    if (z.classList.contains('bruch')) {
      var fi = z.querySelector('img'), an = function () { z.classList.add('nah'); };
      if (!fi || !fi.decode || z.classList.contains('nah')) an();
      else { starte(fi, true); var dec = function () { fi.decode().then(an, an); }; if (da(fi)) dec(); else { fi.addEventListener('load', dec, { once: true }); fi.addEventListener('error', an, { once: true }); } }
    }
    var hinten = [];
    fotos(z).forEach(function (im) {
      var sichtbar = z === im || (im.getBoundingClientRect().left < W.innerWidth * 1.25 && getComputedStyle(im).opacity !== '0');
      if (sichtbar && abstand(im) < W.innerHeight * .25) { starte(im, true); entpacke(im); }
      else if (!im.__h && !da(im)) { hinten.push(im); if (sichtbar) { entpackeSpaeter(im); bald.observe(im); } }
    });
    if (hinten.length) { schlange = hinten.concat(schlange.filter(function (im) { return hinten.indexOf(im) < 0; })); neu = true; weiter(); }
  }
  var bald = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; bald.unobserve(e.target); starte(e.target, true); entpacke(e.target); });
  }, { rootMargin: '25% 10% 25% 10%' });
  function entpackeSpaeter(im) { if (im.__e || !im.decode) return; im.addEventListener('load', function () { entpacke(im); }, { once: true }); }
  W.__bilderVor = function (im) {
    if (da(im)) { entpacke(im); return; }
    if (im.__h) { entpackeSpaeter(im); return; }
    if (schlange.indexOf(im) < 0) schlange.unshift(im);
    neu = true; entpackeSpaeter(im); bald.observe(im); weiter();
  };
  var gleich = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var z = e.target; gleich.unobserve(z);
      if (!frei_ && z.getBoundingClientRect().top >= W.innerHeight) { wartet.push(z); return; }
      nahe(z);
    });
  }, { rootMargin: '250% 25% 250% 25%' });   /* zweieinhalb Fensterhöhen voraus (GBR: 1,2): wer gleich nach dem Öffnen zügig scrollt, lief dem Lader sonst davon (gemessen 14.10.2026) */
  function anmelden(im) {
    melde(im);
    var z = ziel(im);
    if (z !== im) { if (gruppen.indexOf(z) > -1) return; gruppen.push(z); }
    gleich.observe(z);
  }
  alle.forEach(anmelden);
  /* Fenster: spätestens wenn der Abschnitt im Bild steht, ist sein Foto im Bild (noch unterwegs: mit dem weichen Abbild dahinter), nie eine leere dunkle Fläche */
  var imBild = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; imBild.unobserve(e.target); var fi = e.target.querySelector('img'); if (fi) hole(fi); e.target.classList.add('nah'); });
  }, { rootMargin: '10% 0px 10% 0px' });
  fenster.forEach(function (b) { imBild.observe(b); });
  /* später eingefügte Bilder (Kopien fürs Rundgang-Band, Fenster-Inhalte): auch anmelden und in die Schlange */
  if ('MutationObserver' in W) new MutationObserver(function (ms) {
    var neue = [];
    ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType !== 1) return; if (n.tagName === 'IMG') neue.push(n); else [].push.apply(neue, n.querySelectorAll ? n.querySelectorAll('img[loading="lazy"],img[data-src]') : []); }); });
    neue.forEach(function (im) { if (im.__m || !(im.loading === 'lazy' || gehalten(im))) return; alle.push(im); schlange.push(im); anmelden(im); neu = true; });
    if (neue.length) weiter();
  }).observe(doc.body || doc.documentElement, { childList: true, subtree: true });

  /* ---------- erst der erste Bildschirm, dann der Rest ---------- */
  function los() { if (frei_) return; frei_ = true; neu = true; wartet.splice(0).forEach(nahe); weiter(); }
  function erster() {
    var h = W.innerHeight, w = W.innerWidth;
    var vorn = [].slice.call(doc.images).filter(function (im) {
      if (da(im) || gehalten(im) || im.offsetParent === null || im.closest('.bruch')) return false;
      var r = im.getBoundingClientRect();
      return r.width > 40 && r.bottom > 0 && r.top < h && r.right > 0 && r.left < w;
    });
    if (!vorn.length) { los(); return; }
    var offen = vorn.length, eins = function () { if (--offen <= 0) los(); };
    vorn.forEach(function (im) {
      var f = function () { if (im.__v) return; im.__v = 1; eins(); };
      im.addEventListener('load', f, { once: true }); im.addEventListener('error', f, { once: true });
      if (da(im)) f();
    });
    setTimeout(los, 6000);
  }
  erster();
})();

/* ---------- Vorholen: das Kopfbild der nächsten Seite liegt bereit, bevor man sie öffnet ----------
   Das Kopfbild einer Seite wurde erst geholt, wenn man sie öffnete, und teilte sich die Leitung dann mit Stylesheet, Schriften und Skripten.
   Jetzt holt die Seite davor es schon:
   1. sofort für den Verweis, auf dem die Maus ruht, den man antippt oder mit der Tastatur erreicht;
   2. für jeden Verweis im Blick oder kurz davor (ausserhalb von Menü, Sprachwahl und Fuss), einer nach dem anderen;
   3. danach leise für die Verweise der Leiste oben (Restaurants, Karte, Shop …), denn dorthin geht es am häufigsten;
   Unter Maus oder Finger kommen alle Fotos des ersten Bildschirms, auf Vorrat (2. und 3.) nur das Kopfbild, höchstens MAX Seiten je Aufruf:
   mit allem lud ein Seitenaufruf 1,7 MB für andere Seiten mit (gemessen 14.10.2026).
   Welche Bilder eine Seite im ersten Bildschirm zeigt, steht in ihrem Kopf (<link rel="preload" as="image">, schreibt halte.py in die Online-Kopie):
   die Seite wird gelesen und ihr Kopf ausgewertet. Bestellt wird dasselbe Bild in derselben Grösse wie später auf der Seite; es liegt dann ein Jahr
   im Speicher des Browsers. Solange ein Kopfbild unterwegs ist, startet der Lader oben nichts Fernes. Kein Eingriff in den Scroll, keine Arbeit im Takt. */
(function () {
  'use strict';
  var doc = document, W = window, netz = navigator.connection || {};
  if (!W.fetch || !W.URL || netz.saveData || /2g/.test(netz.effectiveType || '')) return;
  var KARTE = /*KOEPFE*/{}/*KOEPFE*/;
  var wurzel = ((doc.currentScript || {}).src || '').split('assets/js/')[0];
  /* verlässt man die Seite, werden offene Abrufe sauber abgebrochen (Safari meldet einen vom Seitenwechsel gekappten Abruf sonst als Fehler in der Konsole) */
  var gelesen = {}, ab = W.AbortController ? new AbortController() : null;
  if (ab) W.addEventListener('pagehide', function () { try { ab.abort(); } catch (e) {} });
  var stand = {}, reihe = [], leiste = [], leiste2 = [], halte = [], laeuft = 0, gestartet = 0, MAX = 10, uhr = 0, runden = 0;
  function ziel(a) {
    try {
      if (!a || !a.href || a.hasAttribute('download')) return '';
      var u = new URL(a.href);
      if (u.origin !== location.origin || u.pathname === location.pathname) return '';
      if (!/\.html$/.test(u.pathname) && !/^\/(?:[a-z]{2}\/)?$/.test(u.pathname)) return '';
      return u.origin + u.pathname;
    } catch (e) { return ''; }
  }
  function attr(l, n) { var m = l.match(new RegExp('\\s' + n + '="([^"]*)"')); return m ? m[1].replace(/&amp;/g, '&') : ''; }
  function ganz(ss, basis) { return ss.split(',').map(function (k) { k = k.trim().split(/\s+/); k[0] = new URL(k[0], basis).href; return k.join(' '); }).join(', '); }
  function nah(d) { if (W.__bilderNah) W.__bilderNah(d); }
  function lage() { return W.__bilderStand ? W.__bilderStand() : { erster: doc.readyState === 'complete', nah: laeuft, fern: 0 }; }
  /* liste: [[srcset, sizes, media, href], …] mit Adressen bezogen auf basis */
  function bestelle(liste, basis, eilig, ende, alle) {
    var offen = 0;
    liste = liste.filter(function (e) { return !((e[2] && W.matchMedia && !W.matchMedia(e[2]).matches) || (!e[0] && !e[3])); });
    if (!alle) liste = liste.slice(0, 1);   /* auf Vorrat nur das Kopfbild; das zweite Foto des ersten Bildschirms erst, wenn Maus oder Finger auf dem Verweis liegen */
    liste.forEach(function (e) {
      var im = new Image(), f = function () { if (--offen <= 0) ende(); };
      offen++; halte.push(im);
      im.onload = im.onerror = f; im.decoding = 'async';
      if ('fetchPriority' in im) im.fetchPriority = eilig ? 'high' : 'low';   /* eilig: Verweis im Blick oder unter Maus/Finger; sonst Vorrat */
      if (e[0]) { im.sizes = e[1] || '100vw'; im.srcset = ganz(e[0], basis); }
      else im.src = new URL(e[3], basis).href;
    });
    if (!offen) ende();
  }
  function hole(adr, eilig, alle) {
    if (stand[adr] === 2 || (stand[adr] === 1 && !alle)) return; stand[adr] = alle ? 2 : 1;
    reihe = reihe.filter(function (a) { return a.__ziel !== adr; });
    laeuft++; gestartet++; nah(1);
    var zu = false, ende = function () { if (zu) return; zu = true; laeuft--; nah(-1); weiter(); };
    setTimeout(ende, 9000);
    var name = adr.slice(adr.lastIndexOf('/') + 1) || 'index.html';
    if (wurzel && KARTE[name]) { bestelle(KARTE[name], wurzel, eilig, ende, alle); return; }
    if (gelesen[adr]) { bestelle(gelesen[adr], adr, eilig, ende, alle); return; }   /* Kopf dieser Seite schon gelesen (erst nur das Kopfbild geholt): nicht noch einmal lesen */
    var wie = { credentials: 'same-origin' }; if (!eilig) wie.priority = 'low';
    if (ab) wie.signal = ab.signal;
    fetch(adr, wie).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
      var links = t.slice(0, Math.max(0, t.indexOf('</head>'))).match(/<link\b[^>]*\srel="preload"[^>]*>/g) || [];
      gelesen[adr] = links.filter(function (l) { return attr(l, 'as') === 'image'; }).map(function (l) { return [attr(l, 'imagesrcset'), attr(l, 'imagesizes'), attr(l, 'media'), attr(l, 'href')]; });
      bestelle(gelesen[adr], adr, eilig, ende, alle);
    }).catch(ende);
  }
  /* der Verweis, der dem Blick am nächsten ist: im Fenster zählt die Nähe zur Mitte, darunter und darüber der Abstand zum Fenster */
  function naechster(l) {
    var h = W.innerHeight, best = l[0], b = 1e9;
    l.forEach(function (a) { var r = a.getBoundingClientRect(), m = (r.top + r.bottom) / 2, w = r.top > h ? h + (r.top - h) * 2 : (r.bottom < 0 ? h - r.bottom * 3 : Math.abs(m - h / 2)); if (w < b) { b = w; best = a; } });
    return best;
  }
  function weiter() {
    clearTimeout(uhr);
    if (!(reihe.length && gestartet < MAX) && !leiste.length && !leiste2.length) return;
    var l = lage();
    if (laeuft < 1 && l.erster) {
      if (reihe.length && gestartet < MAX) { hole(naechster(reihe).__ziel); return; }   /* leise: die eigene Seite geht vor */
      /* die Leiste oben: leise, einer nach dem anderen, sobald kein nahes Foto der eigenen Seite mehr unterwegs ist; zuerst nur die Kopfbilder */
      leiste = leiste.filter(function (a) { return !stand[a.__ziel] && a.offsetParent !== null; });   /* am Handy steckt die Leiste im Menü: dann nichts auf Vorrat */
      if (leiste.length && l.nah - laeuft <= 0) { hole(leiste.shift().__ziel); return; }
      /* ist die eigene Seite ganz geladen, kommt für die Leiste auch das zweite Foto des ersten Bildschirms */
      if (!leiste.length && leiste2.length && doc.readyState === 'complete' && l.nah - laeuft <= 0 && !l.fern) {
        leiste2 = leiste2.filter(function (a) { return stand[a.__ziel] !== 2 && a.offsetParent !== null; });
        if (leiste2.length) { hole(leiste2.shift().__ziel, false, true); return; }
      }
    }
    if (++runden < 400) uhr = setTimeout(weiter, laeuft ? 1500 : 500);   /* höchstens ein paar Minuten nachsehen, dann Ruhe */
  }
  /* Verweise im Blick oder kurz davor */
  if ('IntersectionObserver' in W) {
    var blick = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = e.target, i = reihe.indexOf(a);
        if (stand[a.__ziel]) { blick.unobserve(a); return; }
        if (e.isIntersecting) { if (i < 0) reihe.push(a); }
        else if (i > -1) reihe.splice(i, 1);
      });
      weiter();
    }, { rootMargin: '0px 0px 150% 0px' });
    var melde = function () {
      [].forEach.call(doc.querySelectorAll('a[href]'), function (a) {
        if (a.__ziel || a.closest('.menue,.fuss,footer,.sprache,.menue__sprache,[hidden]')) return;
        var adr = ziel(a); if (!adr) return;
        a.__ziel = adr;
        if (a.closest('.nav')) { if (a.closest('.nav__links')) { leiste.push(a); leiste2.push(a); } return; }
        blick.observe(a);
      });
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', melde); else melde();
  }
  /* Maus ruht auf einem Verweis (nicht beim Scrollen: Safari meldet dann jeden Verweis, der unter dem Zeiger durchläuft), Finger, Tastatur: sofort */
  var ruhe = 0;
  doc.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return;
    var a = e.target.closest && e.target.closest('a[href]'), adr = ziel(a);
    clearTimeout(ruhe);
    if (!adr || stand[adr] === 2 || doc.documentElement.classList.contains('rollt')) return;
    ruhe = setTimeout(function () { hole(adr, true, true); }, 70);
  }, { passive: true });
  doc.addEventListener('pointerout', function () { clearTimeout(ruhe); }, { passive: true });
  var gleich = function (e) { var a = e.target.closest && e.target.closest('a[href]'), adr = ziel(a); if (adr) hole(adr, true, true); };
  doc.addEventListener('touchstart', gleich, { passive: true });
  doc.addEventListener('focusin', gleich);
})();
