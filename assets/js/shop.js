/* Salt & Silver — Shop: Warenkorb im Browser (localStorage), keine Übertragung, keine Speicherung von Formulardaten */
(function () {
  'use strict';
  var K = window.SUS_KATALOG || {};
  /* englische Fassung liegt in /en/: Texte aus dem Skript und der Weg zu den Bildern */
  var EN = document.documentElement.lang === 'en', WURZEL = EN ? '../' : '';
  var TX = { 'Gutscheinkarte per Post': 'Voucher card by post', 'PDF per E-Mail': 'PDF by e-mail', 'Weniger': 'Less', 'Mehr': 'More', 'Entfernen': 'Remove', 'entfällt': 'free' };
  function tx(t) { return EN && TX[t] ? TX[t] : t; }
  var VERSAND = (window.SUS_REGELN && window.SUS_REGELN.versand) || { DE: 7.99, EU: 15.49, WELT: 26.99 };
  var WELT = { CH: 1, GB: 1 };
  var doc = document;

  function lade() { try { return JSON.parse(localStorage.getItem('sus-korb')) || []; } catch (e) { return []; } }
  function sichere(k) { try { localStorage.setItem('sus-korb', JSON.stringify(k)); } catch (e) {} zeichne(); }
  function euro(n) { return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function preis(p) {
    var a = K[p.id]; if (!a) return 0;
    if (a.typ === 'gutschein') return +p.betrag || 0;
    if (a.v) { for (var i = 0; i < a.v.length; i++) if (a.v[i][0] === p.v) return a.v[i][1]; }
    return a.p || 0;
  }
  function zusatz(p) {
    var a = K[p.id]; if (!a) return '';
    if (a.typ === 'gutschein') return tx(p.art === 'post' ? 'Gutscheinkarte per Post' : 'PDF per E-Mail');
    return p.v ? (a.vn + ' ' + p.v) : '';
  }
  function schluessel(p) { return [p.id, p.v || '', p.betrag || '', p.art || ''].join('|'); }
  function stueck(k) { return k.reduce(function (s, p) { return s + p.m; }, 0); }
  function summe(k) { return k.reduce(function (s, p) { return s + preis(p) * p.m; }, 0); }
  function brauchtVersand(k) { return k.some(function (p) { var a = K[p.id]; return a && (a.typ !== 'gutschein' || p.art === 'post'); }); }
  function hatAlkohol(k) { return k.some(function (p) { return K[p.id] && K[p.id].alk; }); }
  function versand(k, land) {
    if (!k.length || !brauchtVersand(k)) return 0;
    if (!land || land === 'DE') return VERSAND.DE;
    return WELT[land] ? VERSAND.WELT : VERSAND.EU;
  }

  function hinein(p) {
    var k = lade(), s = schluessel(p), da = null;
    k.forEach(function (x) { if (schluessel(x) === s) da = x; });
    if (da) da.m = Math.min(24, da.m + p.m); else k.push(p);
    sichere(k);
  }
  function aendere(s, d) {
    var k = lade();
    k.forEach(function (x) { if (schluessel(x) === s) x.m = Math.max(0, Math.min(24, x.m + d)); });
    sichere(k.filter(function (x) { return x.m > 0; }));
  }

  function posten(p, fest) {
    var a = K[p.id]; if (!a) return '';
    var s = esc(schluessel(p)), z = zusatz(p);
    var menge = fest
      ? '<span class="posten__m">' + p.m + ' ×</span>'
      : '<span class="menge" data-s="' + s + '"><button type="button" data-d="-1" aria-label="' + tx('Weniger') + '">−</button><b>' + p.m + '</b><button type="button" data-d="1" aria-label="' + tx('Mehr') + '">+</button></span>';
    return '<li class="posten"><a href="' + a.url + '" class="posten__b"><img src="' + WURZEL + 'assets/img/' + a.img + '-s.webp" alt="" width="96" height="96"></a>' +
      '<div class="posten__t"><a href="' + a.url + '"><b>' + esc(a.n) + '</b></a>' + (z ? '<span>' + esc(z) + '</span>' : '') + menge + '</div>' +
      '<div class="posten__p"><span>' + euro(preis(p) * p.m) + '</span>' + (fest ? '' : '<button type="button" class="weg" data-s="' + s + '">' + tx('Entfernen') + '</button>') + '</div></li>';
  }

  function zeichne() {
    var k = lade(), n = stueck(k), zw = summe(k);
    [].forEach.call(doc.querySelectorAll('[data-korbzahl]'), function (e) { e.textContent = n; e.hidden = !n; });
    [].forEach.call(doc.querySelectorAll('[data-korbliste]'), function (e) {
      e.innerHTML = k.length ? k.map(function (p) { return posten(p, e.hasAttribute('data-fest')); }).join('') : '';
    });
    [].forEach.call(doc.querySelectorAll('[data-leer]'), function (e) { e.hidden = !!k.length; });
    [].forEach.call(doc.querySelectorAll('[data-voll]'), function (e) { e.hidden = !k.length; });
    var landFeld = doc.querySelector('select[name="land"]');
    var land = landFeld ? landFeld.value : 'DE';
    var vs = versand(k, land);
    [].forEach.call(doc.querySelectorAll('[data-zw]'), function (e) { e.textContent = euro(zw); });
    [].forEach.call(doc.querySelectorAll('[data-versand]'), function (e) { e.textContent = !k.length ? '–' : (vs ? euro(vs) : tx('entfällt')); });
    [].forEach.call(doc.querySelectorAll('[data-gesamt]'), function (e) { e.textContent = euro(zw + vs); });
    [].forEach.call(doc.querySelectorAll('[data-alk]'), function (e) {
      var an = hatAlkohol(k); e.hidden = !an;
      var c = e.querySelector('input'); if (c) c.required = an;
    });
    [].forEach.call(doc.querySelectorAll('[data-nurpost]'), function (e) {
      var an = brauchtVersand(k); e.hidden = !an;
      [].forEach.call(e.querySelectorAll('[data-pflicht]'), function (i) { i.required = an; });
    });
  }

  /* Mengen + Entfernen (überall, wo eine Liste steht) */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('.menge button');
    if (b) { aendere(b.parentNode.getAttribute('data-s'), +b.getAttribute('data-d')); return; }
    var w = e.target.closest('.weg');
    if (w) { aendere(w.getAttribute('data-s'), -99); }
  });

  /* Schublade */
  var lade_ = doc.querySelector('dialog.korb');
  function auf() { if (lade_ && lade_.showModal && !lade_.open) lade_.showModal(); }
  if (lade_) {
    [].forEach.call(doc.querySelectorAll('[data-korb-auf]'), function (b) {
      b.addEventListener('click', function (e) { if (!lade_.showModal) return; e.preventDefault(); auf(); });
    });
    lade_.addEventListener('click', function (e) { if (e.target === lade_ || e.target.closest('[data-korb-zu]')) lade_.close(); });
  }

  /* Produktseite */
  var kauf = doc.querySelector('form.kauf');
  if (kauf) {
    var id = kauf.getAttribute('data-id'), art = K[id];
    var anz = doc.querySelector('[data-anzeige]');
    function aktuell() {
      var v = kauf.querySelector('input[name="v"]:checked');
      var p = { id: id, m: Math.max(1, +(kauf.querySelector('[name="m"]') || {}).value || 1) };
      if (v) p.v = v.value;
      if (art.typ === 'gutschein') {
        p.betrag = Math.round(+kauf.querySelector('[name="betrag"]').value || 0);
        p.art = (kauf.querySelector('input[name="art"]:checked') || {}).value || 'pdf';
      }
      return p;
    }
    function zeig() { if (anz) { var p = aktuell(); anz.textContent = preis(p) ? euro(preis(p)) : '–'; } }
    kauf.addEventListener('input', zeig);
    [].forEach.call(kauf.querySelectorAll('[data-betrag]'), function (b) {
      b.addEventListener('click', function () { kauf.querySelector('[name="betrag"]').value = b.getAttribute('data-betrag'); zeig(); });
    });
    [].forEach.call(kauf.querySelectorAll('.stueck button'), function (b) {
      b.addEventListener('click', function () {
        var f = kauf.querySelector('[name="m"]'); f.value = Math.max(1, Math.min(24, (+f.value || 1) + (+b.getAttribute('data-d')))); zeig();
      });
    });
    kauf.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = aktuell();
      if (art.typ === 'gutschein' && !(p.betrag > 0)) { kauf.querySelector('[name="betrag"]').focus(); return; }
      hinein(p); auf();
    });
    zeig();
  }

  /* Bildwahl auf der Produktseite */
  [].forEach.call(doc.querySelectorAll('.daumen button'), function (b) {
    b.addEventListener('click', function () {
      var gross = doc.querySelectorAll('.schau__bild');
      [].forEach.call(gross, function (g, i) { var an = i === +b.getAttribute('data-i'); if (an) g.loading = 'eager';   /* gehaltenes Foto sofort freigeben (bilder.js) */ g.classList.toggle('an', an); });
      [].forEach.call(doc.querySelectorAll('.daumen button'), function (o) { o.setAttribute('aria-pressed', o === b); });
    });
  });

  /* Übersicht: zweites Foto beim Überfahren, wird erst dann geholt */
  if (window.matchMedia && matchMedia('(hover:hover)').matches) {
    [].forEach.call(doc.querySelectorAll('.ware[data-zwei]'), function (a) {
      a.addEventListener('pointerenter', function () {
        if (a.__z) return; a.__z = 1;
        var k = a.querySelector('.rahmen__k'), im = new Image();
        im.className = 'ware__zwei'; im.alt = ''; im.decoding = 'async';
        im.sizes = '(max-width:860px) 46vw, 31vw'; im.srcset = a.getAttribute('data-zwei');
        im.onload = function () { requestAnimationFrame(function () { im.classList.add('an'); }); };
        k.insertBefore(im, k.querySelector('.kerbe'));
      });
    });
  }

  /* Übersicht, Bühne: Fotos eines Stücks durchsehen, das große Foto kommt beim ersten Zeigen */
  [].forEach.call(doc.querySelectorAll('.held'), function (h) {
    var k = h.querySelector('.held__k'), kn = [].slice.call(h.querySelectorAll('.held__blick button'));
    function zeig(b) {
      var i = b.getAttribute('data-i'), im = k.querySelector('.held__bild[data-i="' + i + '"]');
      kn.forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
      function an() { [].forEach.call(k.querySelectorAll('.held__bild'), function (g) { g.classList.toggle('an', g === im); }); }
      if (im) {
        if (!im.hasAttribute('data-src') && !im.hasAttribute('data-srcset') && im.complete && im.naturalWidth > 1) an();
        else { im.loading = 'eager'; im.addEventListener('load', function () { if (b.getAttribute('aria-pressed') === 'true') requestAnimationFrame(an); }, { once: true }); }   /* gehalten: erst das echte Foto zeigen */
        return;
      }
      im = new Image(); im.className = 'held__bild'; im.setAttribute('data-i', i); im.alt = ''; im.decoding = 'async';
      im.sizes = '(max-width:860px) 92vw, 48vw';
      im.onload = function () { if (b.getAttribute('aria-pressed') === 'true') requestAnimationFrame(an); };
      im.srcset = b.getAttribute('data-gross');
      k.insertBefore(im, k.querySelector('.kerbe'));
    }
    kn.forEach(function (b) {
      b.addEventListener('click', function () { zeig(b); });
      b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') zeig(b); });
    });
  });

  /* Kasse */
  var kasse = doc.querySelector('form.kasse');
  if (kasse) {
    kasse.addEventListener('change', function (e) {
      if (e.target.name === 'land') zeichne();
      if (e.target.name === 'zahlung') {
        [].forEach.call(kasse.querySelectorAll('.zahlfeld'), function (f) {
          var an = f.getAttribute('data-fuer') === e.target.value; f.hidden = !an;
          [].forEach.call(f.querySelectorAll('input'), function (i) { i.required = an; });
        });
      }
    });
    kasse.addEventListener('submit', function (e) {
      e.preventDefault();
      var k = lade(); if (!k.length) return;
      var land = kasse.querySelector('select[name="land"]').value;
      var z = kasse.querySelector('input[name="zahlung"]:checked');
      /* Nur der Warenkorb wandert auf die nächste Seite. Namen, Adresse und Zahlungsdaten werden nirgends abgelegt. */
      var b = { k: k, zw: summe(k), vs: versand(k, land), zahlung: z ? z.getAttribute('data-name') : '', mail: brauchtVersand(k) ? 0 : 1 };
      var kn = kasse.querySelector('button[type=submit]'); if (kn) kn.disabled = true;
      /* Die Bestellung geht ins Studio (Eingang). Zahlungsdaten werden dort nicht abgefragt, der Zahlungsdienst ist noch nicht angeschlossen. */
      var fd = new FormData(kasse);
      fd.append('warenkorb', JSON.stringify(k.map(function (p) { var a = K[p.id] || {}; return { id: p.id, name: a.n || p.id, zusatz: zusatz(p), menge: p.m, einzel: preis(p) }; })));
      fd.append('zwischensumme', b.zw.toFixed(2)); fd.append('versand', b.vs.toFixed(2)); fd.append('gesamt', (b.zw + b.vs).toFixed(2));
      fetch('/studio/api/formular?f=bestellung&seite=' + encodeURIComponent(location.pathname), { method: 'POST', body: fd }).then(function (r) { return r.ok; }).catch(function () { return false; }).then(function (ok) {
        if (!ok) { if (kn) kn.disabled = false; var f = kasse.querySelector('[data-kasse-fehler]'); if (f) f.hidden = false; else alert('Die Bestellung konnte gerade nicht übermittelt werden. Bitte versuch es gleich noch einmal.'); return; }
        try { sessionStorage.setItem('sus-bestellung', JSON.stringify(b)); localStorage.removeItem('sus-korb'); } catch (er) {}
        location.href = 'danke.html';
      });
    });
  }

  /* Bestätigung */
  var danke = doc.querySelector('[data-danke]');
  if (danke) {
    var b = null; try { b = JSON.parse(sessionStorage.getItem('sus-bestellung')); } catch (e2) {}
    if (b && b.k && b.k.length) {
      danke.querySelector('[data-dliste]').innerHTML = b.k.map(function (p) { return posten(p, true); }).join('');
      danke.querySelector('[data-dzw]').textContent = euro(b.zw);
      danke.querySelector('[data-dversand]').textContent = b.vs ? euro(b.vs) : tx('entfällt');
      danke.querySelector('[data-dgesamt]').textContent = euro(b.zw + b.vs);
      danke.querySelector('[data-dzahlung]').textContent = b.zahlung || '–';
    } else { danke.querySelector('[data-dbox]').hidden = true; }
  }

  zeichne();
  window.addEventListener('storage', zeichne);
  window.addEventListener('pageshow', zeichne);
})();
