/* Besuche (Robert 14.10.2026: «Mail, wenn die Website geöffnet wurde»): meldet je Aufruf einer Seite eine Zeile «pfad geraet» an den Dienst
   tasty-besuche, der Zeit und Land dazuschreibt und Robert eine Mail schickt (höchstens eine je Besucher und Stunde). Keine Kennung, kein Cookie,
   keine Adresse. Nur auf der Online-Adresse, nicht eingebettet, nicht in automatischen Browsern (Prüfläufe).
   Roberts eigene Geräte: einmal die Adresse mit ?ich öffnen, dann schweigt dieses Gerät (?ich=aus hebt es auf).
   Dienst und Auswertung: ~/Desktop/Website-Projekte/_Besuche/ (api/b.py, besuche.py). Abschalten = diesen Block löschen. */
(function () {
  try {
    var n = navigator, w = window, q = location.search;
    if (/[?&]ich=aus\b/.test(q)) localStorage.removeItem('tasty-ich');
    else if (/[?&]ich\b/.test(q)) localStorage.setItem('tasty-ich', '1');
    if (w.__besuch || !n.sendBeacon || n.webdriver || w.self !== w.top || location.hostname !== 'salt-and-silver-studie.vercel.app') return;
    if (localStorage.getItem('tasty-ich')) return;
    w.__besuch = 1;
    /* Empfänger (Robert 17.10.2026): ?f=<code> aus dem verschickten Link (besuche.py link), je Gerät gemerkt */
    var m = /[?&]f=([a-z0-9]{4,10})\b/.exec(q), f = m ? m[1] : (localStorage.getItem('tasty-f') || '');
    if (m) localStorage.setItem('tasty-f', f);
    var breit = function (px) { return !!(w.matchMedia && w.matchMedia('(max-width:' + px + 'px)').matches); };
    n.sendBeacon('https://tasty-besuche.vercel.app/api/b', location.pathname.slice(0, 120) + ' ' + (breit(700) ? 'handy' : breit(1060) ? 'tablet' : 'rechner') + (f ? ' ' + f : ''));
  } catch (e) {}
})();

/* Genaue Messung (Robert 17.10.2026): Kopie von ~/Desktop/Website-Projekte/_Besuche/verweil.js — dort ändern, dann hier ersetzen. */
/* Verweildauer (Robert 16.10.2026: «ganz genau aufzeichnen, wo sie sich angeschaut wurde und wie lange», «nur ich»).
   Misst je Seitenaufruf, wie lange welcher Abschnitt im Bild war, wie weit gescrollt wurde und worauf geklickt wurde, und schickt
   beim Verlassen EINEN Schnappschuss an tasty-besuche (privater Speicher, Abruf nur mit Roberts Schlüssel). Kein Cookie, keine Kennung,
   keine Eingaben, keine Texte der Besucher. Läuft nur online (vercel.app und tasty-studios.de), nicht eingebettet, nicht in automatischen Browsern.
   Eigene Geräte: einmal ?ich an die Adresse (wie bei besuch.js). Zeit zählt nur, solange der Tab sichtbar ist und in den letzten
   30 Sekunden etwas bewegt wurde (Scrollen, Tippen, Zeigen). Auswertung: ~/Desktop/Website-Projekte/_Besuche/besuche.py verweil.
   Abschalten = Script-Tag entfernen. Fühlt sich auf der Seite nichts an: ein Zähler alle 500 ms, ein Beobachter, ein Schicken am Ende. */
(function () {
  try {
    var w = window, n = navigator, d = document;
    if (w.__verweil || !n.sendBeacon || n.webdriver || w.self !== w.top || !w.IntersectionObserver) return;
    var host = location.hostname, ZIEL = w.__verweilZiel || 'https://tasty-besuche.vercel.app/api/b?w=1';
    if (!/(\.vercel\.app|(^|\.)tasty-studios\.de)$/.test(host) && !w.__verweilZiel) return;
    if (localStorage.getItem('tasty-ich')) return;
    w.__verweil = 1;
    /* Empfänger (Robert 17.10.2026: «eigener Link je Empfänger»): ?f=<code> aus dem verschickten Link, besuch.js merkt ihn sich je Gerät */
    var m = /[?&]f=([a-z0-9]{4,10})\b/.exec(location.search), f = m ? m[1] : (localStorage.getItem('tasty-f') || '');
    if (m) localStorage.setItem('tasty-f', f);

    var JETZT = function () { return Date.now(); };
    var id = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
    var breit = function (px) { return !!(w.matchMedia && w.matchMedia('(max-width:' + px + 'px)').matches); };
    var geraet = breit(700) ? 'handy' : breit(1060) ? 'tablet' : 'rechner';
    var start = JETZT(), zuletzt = start, regt = start, tiefe = 0;
    var aktiv = 0, abschnitte = {}, sichtbar = {}, klicks = [], gesendet = 0, gesendetAktiv = -1;

    /* Abschnitte: die äußersten section/header/footer/[data-abschnitt]; Name aus id, aria-label, erster Überschrift oder Reihenfolge */
    var kandidaten = [].slice.call(d.querySelectorAll('section, header, footer, [data-abschnitt]'));
    var liste = kandidaten.filter(function (e) {
      return !kandidaten.some(function (o) { return o !== e && o.contains(e); });
    });
    var benutzt = {};
    function name(e, i) {
      var t = e.getAttribute('data-abschnitt') || e.id || e.getAttribute('aria-label');
      if (!t) { var h = e.querySelector('h1, h2, h3'); t = h ? h.textContent : ''; }
      t = (t || '').replace(/\s+/g, ' ').trim().slice(0, 34) || e.tagName.toLowerCase();
      t = (i < 9 ? '0' : '') + (i + 1) + ' ' + t;   /* Nummer vorn: Reihenfolge von oben nach unten bleibt lesbar */
      if (benutzt[t]) t += ' (' + (++benutzt[t]) + ')'; else benutzt[t] = 1;
      return t;
    }
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (x) {
        var hoeheBild = w.innerHeight || 1;
        var teil = x.intersectionRect.height / Math.min(hoeheBild, Math.max(x.boundingClientRect.height, 1));
        /* «im Blick»: mindestens ein Drittel des Bildes ODER mehr als die Hälfte des (kleineren) Abschnitts */
        var drin = x.isIntersecting && (x.intersectionRect.height >= hoeheBild * 0.33 || teil >= 0.5);
        if (drin) sichtbar[x.target.__vn] = 1; else delete sichtbar[x.target.__vn];
      });
    }, { threshold: [0, 0.1, 0.25, 0.4, 0.5, 0.75, 1] });
    liste.forEach(function (e, i) { e.__vn = name(e, i); io.observe(e); });
    if (!liste.length) { sichtbar['00 Seite'] = 1; }

    function bewegt() { regt = JETZT(); }
    ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (ev) {
      w.addEventListener(ev, bewegt, { passive: true });
    });
    w.addEventListener('scroll', function () {
      var h = d.documentElement, max = (h.scrollHeight - (w.innerHeight || 0)) || 1;
      var p = Math.round(100 * Math.min(1, Math.max(0, (w.pageYOffset || h.scrollTop || 0) / max)));
      if (p > tiefe) tiefe = p;
    }, { passive: true });
    d.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest('a, button, [role=button]');
      if (!a || klicks.length >= 12) return;
      var t = (a.getAttribute('aria-label') || a.textContent || a.getAttribute('href') || '').replace(/\s+/g, ' ').trim().slice(0, 36);
      if (t) klicks.push(t);
    }, true);

    setInterval(function () {
      var t = JETZT(), dt = Math.min(t - zuletzt, 1500); zuletzt = t;
      if (d.visibilityState !== 'visible' || t - regt > 30000) return;
      aktiv += dt;
      for (var k in sichtbar) abschnitte[k] = (abschnitte[k] || 0) + dt;
    }, 500);

    function schick() {
      var a = Math.round(aktiv / 1000);
      if (a < 1 || a === gesendetAktiv || gesendet >= 3) return;   /* nichts Neues, oder schon dreimal: der Speicher ist knapp */
      gesendetAktiv = a; gesendet++;
      var ab = {}; Object.keys(abschnitte).forEach(function (k) { var s = Math.round(abschnitte[k] / 1000); if (s >= 1) ab[k] = s; });
      var nutz = JSON.stringify({ p: id, s: location.pathname.slice(0, 120), g: geraet, t: a, o: Math.round((JETZT() - start) / 1000), d: tiefe, a: ab, c: klicks, f: f });
      if (nutz.length > 3800) return;
      n.sendBeacon(ZIEL, nutz);
    }
    d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') schick(); });
    w.addEventListener('pagehide', schick);
  } catch (e) {}
})();

/* Salt & Silver — ein Takt, nativer Scroll, Bewegung nur über transform/opacity */
(function () {
  'use strict';
  var doc = document.documentElement;
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]nomotion/.test(location.search);
  try { sessionStorage.setItem('sus-da', '1'); } catch (e) {}

  /* Einblenden */
  var ziele = [].slice.call(document.querySelectorAll('[data-r]'));
  if (ruhig || !('IntersectionObserver' in window)) {
    ziele.forEach(function (el) { el.classList.add('da', 'nah'); });
  } else {
    /* Bilder erst zeigen, wenn sie fertig geladen und entpackt sind – sonst blitzen sie beim Einblenden auf.
       Geholt werden sie längst vorher (bilder.js); hier wird höchstens kurz gewartet, dahinter liegt die Vorschau. */
    var wennBereit = function (el, dann) {
      var offen = [].filter.call(el.querySelectorAll('img'), function (im) { return im.offsetParent !== null; }), n = offen.length, los = false;
      var fertig = function () { if (los) return; los = true; dann(); };
      if (!n) return fertig();
      var eins = function () { if (--n <= 0) fertig(); };
      offen.forEach(function (im) {
        var entpackt = function () { (im.decode ? im.decode() : Promise.resolve()).then(eins, eins); };
        /* online stehen Fotos unter dem ersten Bildschirm «gehalten» (data-src, Platzbild als src): fertig ist erst das echte Foto (bilder.js gibt es frei, sobald loading wechselt) */
        var gehalten = im.hasAttribute('data-src') || im.hasAttribute('data-srcset');
        if (!gehalten && im.complete && im.naturalWidth > 1) return entpackt();
        im.loading = 'eager';
        im.addEventListener('load', entpackt, { once: true });
        im.addEventListener('error', eins, { once: true });
      });
      setTimeout(fertig, 1500);
    };
    var zeigBild = function (el) { wennBereit(el, function () { el.classList.add('da'); }); };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('da'); io.unobserve(e.target);
        /* Waren kommen als Reihe: alle starten zusammen, die Staffel macht die Folge von links nach rechts */
        if ((e.target.classList.contains('ware') || e.target.classList.contains('kachel') || e.target.classList.contains('gk') || e.target.classList.contains('lk') || e.target.classList.contains('quer') || e.target.classList.contains('bk')) && e.target.parentElement) [].forEach.call(e.target.parentElement.children, function (k) { if (k.hasAttribute('data-r') && !k.classList.contains('da')) { k.classList.add('da'); io.unobserve(k); } });
        /* Reihe zum Wischen: was rechts aus dem Bild ragt, kommt mit, sonst sieht man nicht, dass es weitergeht */
        var reihe = e.target.parentElement;
        if (reihe && reihe.scrollWidth > reihe.clientWidth + 4) [].forEach.call(reihe.children, function (k) {
          if (k.hasAttribute('data-r') && !k.classList.contains('da')) { k.classList.add('da'); io.unobserve(k); }
        });
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.06 });
    /* sehr lange Blöcke (Rechtstexte) haben nie 6 % ihrer Höhe im Fenster: sie kommen, sobald ihre Oberkante im Bild ist */
    var hio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('da'); hio.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0 });
    /* große Bilder kommen früher: sobald die Oberkante unten ins Fenster rückt */
    var bio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { bio.unobserve(e.target); zeigBild(e.target); }
      });
    }, { rootMargin: '0px 0px 4% 0px', threshold: 0.01 });
    /* Fenster: der Satz steht fest in der Bildschirmmitte, der Ausschnitt wandert darüber. Der Satz startet erst,
       wenn die Oberkante des Ausschnitts ihn zu einem Drittel freigegeben hat – sonst ist er schon fertig, bevor man ihn sieht. */
    [].forEach.call(document.querySelectorAll('.bruch'), function (b) {
      var t = b.querySelector('.in'), fio = null;
      var lausche = function () {
        if (fio) fio.disconnect();
        var r = t.getBoundingClientRect(), linie = r.top + r.height * 0.68;
        fio = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting) return;
            fio.disconnect(); fio = null; window.removeEventListener('resize', lausche);
            [].forEach.call(b.querySelectorAll('[data-r]'), function (k) { k.classList.add('da'); });
          });
        }, { rootMargin: '0px 0px -' + Math.max(0, Math.round(window.innerHeight - linie)) + 'px 0px', threshold: 0 });
        fio.observe(b);
      };
      lausche();
      window.addEventListener('resize', lausche, { passive: true });
    });
    /* Dreiklang: alle drei Bilder starten gemeinsam, sobald der Block unten ins Bild kommt, und steigen nacheinander auf */
    var dio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        dio.unobserve(e.target);
        wennBereit(e.target, function () { [].forEach.call(e.target.querySelectorAll('[data-r]'), function (k) { k.classList.add('da'); }); });
      });
    }, { rootMargin: '0px 0px 6% 0px', threshold: 0.01 });
    [].forEach.call(document.querySelectorAll('.drei'), function (d) { dio.observe(d); });
    /* Das Setzen der Fotos (Zoom von 1,13 auf 1) startet erst, wenn man das Bild wirklich sieht:
       Oberkante gut ein Achtel im Fenster oder das Bild fast ganz im Blick. Sichtbar wird es vorher schon. */
    var setzeNah = function (e) { if (e.isIntersecting) { e.target.classList.add('nah'); nio.unobserve(e.target); gio.unobserve(e.target); } };
    var nio = new IntersectionObserver(function (es) { es.forEach(setzeNah); }, { rootMargin: '0px 0px -13% 0px', threshold: 0 });
    var gio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.intersectionRatio >= 0.85) setzeNah(e); }); }, { threshold: 0.85 });
    /* seit 10.10.2026 auch die Foto-Kacheln ohne eigenen Bild-Auftritt (Orte, Stellen, Mannschaft, Shop-Kopf), Robert: «da fehlt der Effekt auch» */
    [].forEach.call(document.querySelectorAll('[data-r="bild"],[data-r="schweb"],:is(.ortkachel,.stelle,.mannschaft__b,.bieten__fotos,.held)[data-r]'), function (el) {
      if (el.closest('.hero')) { el.classList.add('nah'); return; }
      nio.observe(el); gio.observe(el);
    });
    ziele.forEach(function (el) {
      if (el.closest('.hero')) { requestAnimationFrame(function () { el.classList.add('da'); }); }
      else if (!el.closest('.bruch') && !el.closest('.drei')) {
        if (el.getAttribute('data-r') === 'bild') bio.observe(el); else if (el.offsetHeight * 0.06 > window.innerHeight * 0.45) hio.observe(el); else io.observe(el);
      }
    });
  }

  /* Rechtsseiten: im Inhaltsfeld den Abschnitt markieren, der gerade gelesen wird */
  (function () {
    var feld = document.querySelector('.rechtfeld__inhalt');
    if (!feld || !('IntersectionObserver' in window)) return;
    var punkte = {}, jetzt = null;
    [].forEach.call(feld.querySelectorAll('a'), function (l) { punkte[l.getAttribute('href').slice(1)] = l; });
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || !punkte[e.target.id]) return;
        if (jetzt) jetzt.classList.remove('an');
        jetzt = punkte[e.target.id]; jetzt.classList.add('an');
      });
    }, { rootMargin: '-10% 0px -72% 0px' });
    Object.keys(punkte).forEach(function (id) { var h = document.getElementById(id); if (h) rio.observe(h); });
  })();

  /* Laufband: läuft nur, solange es im Bild ist */
  var zuege = [].slice.call(document.querySelectorAll('[data-laufband]'));
  if (zuege.length && !ruhig && 'IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('laeuft', e.isIntersecting); });
    }, { rootMargin: '80px 0px' });
    zuege.forEach(function (z) { lio.observe(z); });
  }

  /* Große Zahlen: hochzählen, sobald sie im Bild sind */
  var zahlen = [].slice.call(document.querySelectorAll('[data-zahl]'));
  if (zahlen.length && !ruhig && 'IntersectionObserver' in window) {
    var zio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        zio.unobserve(e.target);
        var el = e.target, ziel = +el.getAttribute('data-zahl'), nach = el.getAttribute('data-nach') || '';
        var von = ziel > 1000 ? ziel - 24 : 0, t0 = null, dauer = ziel > 1000 ? 2100 : 1500;
        if (ziel <= 3) return;
        function schritt(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / dauer), w = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(von + (ziel - von) * w) + nach;
          if (p < 1) requestAnimationFrame(schritt);
        }
        el.textContent = von + nach;
        setTimeout(function () { requestAnimationFrame(schritt); }, 250);
      });
    }, { threshold: 0.3 });
    /* Durchgang 23.10.2026 (Robert «ok»): Startwert schon vor dem Auftritt setzen, sonst steht die Endzahl kurz da und springt dann auf 0 */
    zahlen.forEach(function (z) { var ziel = +z.getAttribute('data-zahl'); if (ziel > 3) z.textContent = (ziel > 1000 ? ziel - 24 : 0) + (z.getAttribute('data-nach') || ''); zio.observe(z); });
  }

  /* Navigation */
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var an = doc.classList.toggle('offen');
      burger.setAttribute('aria-expanded', an);
      document.body.style.overflow = an ? 'hidden' : '';
    });
    [].forEach.call(document.querySelectorAll('.menue a'), function (a) {
      a.addEventListener('click', function () { doc.classList.remove('offen'); document.body.style.overflow = ''; });
    });
  }

  /* Tischwahl */
  var dlg = document.querySelector('dialog.tisch');
  if (dlg && dlg.showModal) {
    [].forEach.call(document.querySelectorAll('[data-tisch]'), function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        doc.classList.remove('offen'); document.body.style.overflow = '';
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.querySelector('.zu').addEventListener('click', function () { dlg.close(); });
  }

  /* Reiter */
  [].forEach.call(document.querySelectorAll('.tabs'), function (leiste) {
    var tabs = [].slice.call(leiste.querySelectorAll('.tab'));
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (o) {
          var an = o === t;
          o.setAttribute('aria-selected', an);
          var f = document.getElementById(o.getAttribute('aria-controls'));
          if (f) f.hidden = !an;
        });
      });
    });
  });

  /* Karte: Kategorien wechseln, Gerichte blättern, Laufbalken */
  function richte(g) {
    var band = g.querySelector('.gangband'), balken = g.querySelector('.laufbalken'), strich = balken.querySelector('i');
    var pf = g.querySelectorAll('.pfeile button');
    var weg = band.scrollWidth - band.clientWidth;
    var teil = band.scrollWidth ? Math.min(1, band.clientWidth / band.scrollWidth) : 1;
    strich.style.width = (teil * 100).toFixed(1) + '%';
    balken.style.visibility = weg > 4 ? 'visible' : 'hidden';
    var p = weg > 0 ? band.scrollLeft / weg : 0;
    strich.style.transform = 'translateX(' + (p * (balken.clientWidth * (1 - teil))).toFixed(1) + 'px)';
    pf[0].disabled = band.scrollLeft < 4; pf[1].disabled = band.scrollLeft > weg - 4;
  }
  [].forEach.call(document.querySelectorAll('.gang'), function (g) {
    var band = g.querySelector('.gangband'), frei = true;
    band.addEventListener('scroll', function () {
      if (!frei) return; frei = false;
      requestAnimationFrame(function () { frei = true; richte(g); });
    }, { passive: true });
    [].forEach.call(g.querySelectorAll('.pfeile button'), function (b) {
      b.addEventListener('click', function () {
        var k = band.firstElementChild; if (!k) return;
        var n = +band.getAttribute('data-schritt') || (band.clientWidth > 700 ? 2 : 1);
        band.scrollBy({ left: (+b.getAttribute('data-r')) * (k.offsetWidth + 20) * n, behavior: ruhig ? 'auto' : 'smooth' });
      });
    });
  });
  function richteAlle() { [].forEach.call(document.querySelectorAll('.gang.an'), function (g) { if (g.offsetParent !== null) richte(g); }); }
  [].forEach.call(document.querySelectorAll('.gruppe'), function (er) {
    var kn = [].slice.call(er.querySelectorAll('.unterreiter button')), gg = [].slice.call(er.querySelectorAll('.gang'));
    kn.forEach(function (b) {
      b.addEventListener('click', function () {
        kn.forEach(function (o) { o.classList.toggle('an', o === b); });
        gg.forEach(function (g) { var an = g.id === b.getAttribute('data-gang'); g.classList.toggle('an', an); if (an) richte(g); });
      });
    });
  });
  if (document.querySelector('.gang')) {
    [].forEach.call(document.querySelectorAll('.karten .tab'), function (t) { t.addEventListener('click', function () { requestAnimationFrame(richteAlle); }); });
    window.addEventListener('resize', richteAlle); window.addEventListener('load', richteAlle); richteAlle();
  }

  /* Band: mit der Maus ziehen (Blättern selbst bleibt nativ) */
  [].forEach.call(document.querySelectorAll('.band'), function (b) {
    var unten = false, x0 = 0, s0 = 0, weit = false;
    b.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      unten = true; weit = false; x0 = e.clientX; s0 = b.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!unten) return;
      var d = e.clientX - x0;
      if (Math.abs(d) > 4) { weit = true; b.classList.add('zieht'); }
      b.scrollLeft = s0 - d;
    });
    window.addEventListener('pointerup', function () { unten = false; b.classList.remove('zieht'); });
    b.addEventListener('click', function (e) { if (weit) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* Scroll-Takt: Navigation, Auftaktbild, Bühne */
  var heroBild = document.querySelector('.hero__bild');
  var hero = document.querySelector('.hero');
  var strecke = document.querySelector('.buehne__strecke');
  var haeuser = [].slice.call(document.querySelectorAll('.buehne .haus'));
  var bilder = [].slice.call(document.querySelectorAll('.buehne__bilder .polas'));
  var abzuege = bilder.map(function (b) { return [].slice.call(b.querySelectorAll('.pola')); });
  var liegt = bilder.map(function () { return 0; });
  var takte = [].slice.call(document.querySelectorAll('.buehne__takt i'));
  var breit = matchMedia('(min-width: 861px)');
  var schweb = [].slice.call(document.querySelectorAll('.schweb')), drei = document.querySelector('.drei');
  var sZiel = 0, sIst = 0, sLaeuft = false;
  function schwebe() {
    sIst += (sZiel - sIst) * 0.12;
    if (Math.abs(sZiel - sIst) < 0.15) { sIst = sZiel; sLaeuft = false; }
    for (var i = 0; i < schweb.length; i++) schweb[i].style.transform = 'translate3d(0,' + (sIst * (+schweb[i].getAttribute('data-tempo'))).toFixed(1) + 'px,0)';
    if (sLaeuft) requestAnimationFrame(schwebe);
  }
  var yAlt = window.scrollY, ziel = 0, ist = 0, laeuft = false, aktiv = -1;

  function setze(n) {
    if (n === aktiv) return;
    aktiv = n;
    haeuser.forEach(function (h, i) { h.classList.toggle('an', i === n); });
    bilder.forEach(function (b, i) { b.classList.toggle('an', i === n); });
    takte.forEach(function (t, i) { t.classList.toggle('an', i === n); });
  }
  if (haeuser.length) setze(0);
  /* der erste Stapel fliegt, sobald die Bühne ins Bild kommt */
  if (bilder.length) {
    if (ruhig || !('IntersectionObserver' in window)) lege(0, 5);
    else { var erst = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { erst.disconnect(); if (aktiv === 0) lege(0, 5); } }, { threshold: 0.25 }); erst.observe(document.querySelector('.buehne__bilder')); }
  }
  /* Abzüge: wie viele vom aktiven Stapel liegen, folgt dem Scrollweg. Kommen mehrere auf einmal, landen sie kurz nacheinander. */
  function lege(n, wieviel) {
    for (var i = 0; i < bilder.length; i++) {
      var soll = i === n ? wieviel : 0;
      if (soll === liegt[i]) continue;
      var neu = 0;
      for (var k = 0; k < abzuege[i].length; k++) {
        var an = k < soll, war = k < liegt[i];
        if (an && !war) { abzuege[i][k].style.transitionDelay = (i === n ? 0.25 + neu * 0.16 + (k === 4 ? 0.14 : 0) : 0) + 's'; neu++; }
        else if (i === n) abzuege[i][k].style.transitionDelay = '0s';
        else abzuege[i][k].style.transitionDelay = '';
        abzuege[i][k].classList.toggle('da', an);
      }
      liegt[i] = soll;
    }
  }
  /* Fotos der Abzüge vorab entpacken, damit das Hochfliegen nur noch Bewegung ist */
  if (bilder.length && 'IntersectionObserver' in window) {
    var vor = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      vor.disconnect();
      [].forEach.call(document.querySelectorAll('.buehne__bilder img'), function (b) {
        var entpacke = function () { if (b.decode) b.decode().catch(function () {}); };
        var wartet = b.hasAttribute('data-src') || b.hasAttribute('data-srcset') || !b.complete;   /* gehalten oder noch unterwegs: erst nach dem Laden entpacken */
        b.loading = 'eager';
        if (wartet) b.addEventListener('load', entpacke, { once: true }); else entpacke();
      });
    }, { rootMargin: '120% 0px' });
    vor.observe(strecke);
  }
  /* Handy: der Stapel je Restaurant fliegt ein, sobald er im Bild ist */
  var mpolas = [].slice.call(document.querySelectorAll('.polas--m'));
  if (mpolas.length) {
    if (ruhig || !('IntersectionObserver' in window)) mpolas.forEach(function (m) { m.classList.add('an'); });
    else {
      var mio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('an'); mio.unobserve(e.target); } });
      }, { threshold: 0.35 });
      mpolas.forEach(function (m) { mio.observe(m); });
    }
  }

  function lies() {
    var y = window.scrollY;
    if (nav && !doc.classList.contains('offen')) {
      if (y > 140 && y > yAlt + 6) nav.classList.add('weg');
      else if (y < yAlt - 6 || y < 140) nav.classList.remove('weg');
    }
    yAlt = y;
    if (heroBild && !ruhig) ziel = Math.min(y, hero.offsetHeight) * 0.16;
    if (drei && !ruhig && breit.matches) {
      var dr = drei.getBoundingClientRect(), vh = window.innerHeight;
      if (dr.bottom > -100 && dr.top < vh + 100) {
        /* von +70 px (kommt ins Bild) bis -70 px (verlässt es): die Spalten ziehen verschieden schnell nach oben */
        sZiel = Math.max(-1, Math.min(1, (dr.top + dr.height / 2 - vh / 2) / vh)) * 70;
        if (!sLaeuft && Math.abs(sZiel - sIst) > 0.15) { sLaeuft = true; requestAnimationFrame(schwebe); }
      }
    }
    if (strecke && breit.matches) {
      var r = strecke.getBoundingClientRect();
      var weg = r.height - window.innerHeight;
      var p = weg > 0 ? Math.min(1, Math.max(0, -r.top / weg)) : 0;
      var lage = p * haeuser.length * 0.999, hn = Math.min(haeuser.length - 1, Math.floor(lage));
      setze(hn);
      /* alle vier Abzüge des Restaurants fliegen kurz nacheinander hoch und bleiben nebeneinander liegen */
      if (r.top < window.innerHeight * 0.72) lege(hn, 5);
    }
  }
  function bild() {
    ist += (ziel - ist) * 0.12;
    if (Math.abs(ziel - ist) < 0.2) { ist = ziel; laeuft = false; }
    if (heroBild) heroBild.style.transform = 'translate3d(0,' + ist.toFixed(1) + 'px,0)';
    if (laeuft) requestAnimationFrame(bild);
  }
  var wartet = false;
  window.addEventListener('scroll', function () {
    if (wartet) return;
    wartet = true;
    requestAnimationFrame(function () {
      wartet = false;
      lies();
      if (heroBild && !ruhig && !laeuft && Math.abs(ziel - ist) > 0.2 && window.scrollY < hero.offsetHeight * 1.1) {
        laeuft = true; requestAnimationFrame(bild);
      }
    });
  }, { passive: true });
  lies();
  /* Formulare (Newsletter, Kooperation, Bewerbung, Widerruf): gehen ins Studio, Reiter „Eingang“ */
  [].forEach.call(document.querySelectorAll('form[data-nl]'), function (nl) {
    nl.addEventListener('submit', function (e) {
      e.preventDefault();
      var gut = nl.checkValidity(), f = nl.querySelector('[data-nl-fehler]') || document.querySelector('[data-nl-fehler]');
      var datei = nl.querySelector('input[type=file]');
      if (gut && datei && datei.files[0] && datei.files[0].size > 10 * 1024 * 1024) { gut = false; if (f) f.textContent = 'Die Datei ist größer als 10 MB.'; }
      if (f) f.hidden = gut;
      if (!gut) return;
      var kn = nl.querySelector('button[type=submit]'); if (kn) kn.disabled = true;
      var name = nl.getAttribute('data-formular') || 'nachricht';
      fetch('/studio/api/formular?f=' + encodeURIComponent(name) + '&seite=' + encodeURIComponent(location.pathname), { method: 'POST', body: new FormData(nl) })
        .then(function (r) { return r.ok; }).catch(function () { return false; })
        .then(function (ok) {
          if (kn) kn.disabled = false;
          if (!ok) { if (f) { f.textContent = 'Das hat gerade nicht geklappt. Bitte versuch es gleich noch einmal.'; f.hidden = false; } return; }
          nl.reset(); nl.hidden = true;
          var d = nl.nextElementSibling && nl.nextElementSibling.hasAttribute('data-nl-danke') ? nl.nextElementSibling : document.querySelector('[data-nl-danke]');
          if (d) { d.hidden = false; d.scrollIntoView({ block: 'center' }); }
        });
    });
  });
})();
