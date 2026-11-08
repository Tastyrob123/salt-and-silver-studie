/* Salt & Silver im Chat (gast/bau.py). Bedienung aus dem Chat des Carlton-Europe, für Restaurants umgebaut: Tischmaske mit OpenTable.
   Nicht hier ändern: Texte und Tischmaske in gast/bau.py, alles andere in der Vorlage des Carlton. */
/* Chat (Vorlage Rezeption im Chat — Fenster unten rechts (und als Zimmermappe ganzseitig auf mappe.html).
   Fragt die Funktion /api/gast (Claude mit dem Wissen der Website, siehe _gast/gast.py); fällt sie aus, sucht das Fenster
   die passende Stelle aus «Gut zu wissen» (Hotelinformation A-Z). Die Buchungsmaske kommt, wenn die Funktion sie anfordert,
   und übergibt mit Daten und Gästen an «Zimmer buchen» (SimpleBooking), die Zahlung bleibt dort.
   Wissen und Zimmerkategorien schreibt gast.py hinein, nie von Hand ändern. Bewegung nur über transform und opacity. */
(function () {
  var WISSEN = /*WISSEN*/[{"t": "Wie kann ich reservieren?", "a": "Wir bieten mit OpenTable eine Echtzeit-Online Reservierung an. Du kannst hier bequem an deinem Wunschtag online reservieren und erhältst direkt die Bestätigung. Eine Reservierung per E-Mail (zentrale@saltandsilver.de) ist ebenfalls möglich.", "s": ["reservi"]}, {"t": "Wie kann ich für mehr als 10 Personen reservieren?", "a": "Für Reservierungen ab 10 Personen, schreib uns gerne eine Mail an zentrale@saltandsilver.de.", "s": ["persone", "reservi"]}, {"t": "Ein Restaurant exklusiv mieten?", "a": "Die Restaurants können exklusiv für Events / Veranstaltungen gemietet werden. Anfragen an: zentrale@saltandsilver.de.", "s": ["exklusi", "mieten"]}, {"t": "Wo liegt der Unterschied der drei Restaurants?", "a": "Salt & Silver Restaurant:Hier servieren wir unseren Gästen ein kreative Karte. Die Küche im Restaurant ist geprägt von kräftigen Feuer-Aromen, komplexer Würzigkeit und erfrischendem Säure-Schärfe Spiel. Unser Menü ändert und entwickelt sich ständig weiter. Wir sind immer auf der Suche nach den besten Zutaten der Saison und dem frischesten Fang des Tages – mit den dazu passenden Getränken. Wir bitten Sie also, uns zu vertrauen und sich für die Überraschungen zu öffnen, die wir für Sie vorbereitet haben. Bistro Crudo:Hier servieren wir Tacos, die wir gut finden, Ceviches, auf die wir stolz sein können und Bar-Food, das glücklich und durstig macht. Egal ob ein kurzer Snack oder ein voller Tisch mit vielen Freunden – das Bistro Crudo ist euer Wochenende-Bistro für kulinarische Weltreisen im Salt & Silver Style. Salt & Silver am Meer:In St. Peter-Ording arbeiten wir mit Rindern & Lämmern, die", "s": ["untersc", "unterschi"]}, {"t": "Wo befinden sich die Restaurants?", "a": "Das Hamburger Restaurant & Bistro Crudo hat seinen Standort in der St. Pauli Hafenstraße 136-140 in Hamburg. Das Salt & Silver am Meer befindet sich am Böhler Strand in St. Peter-Ording.", "s": ["adresse", "anfahrt", "befinde", "hafenstr", "wo seid"]}, {"t": "Wie sind die Öffnungszeiten?", "a": "Salt & Silver Hamburg:Montag bis Samstag: 18 – 24 Uhr Die Küche schließt um 21:30 Uhr. Bistro Crudo:Freitag & Samstag: 18 – 24 Uhr Die Küche schließt um 21:30 Uhr.  Salt & Silver am Meer: April bis Oktober, Mittwoch Ruhetag. 12 – 22 Uhr geöffnet Küchenpause von 15:30 – 17 Uhr Letzte Küchenbestellung 21 Uhr", "s": ["geöffne", "offen", "ruhetag", "uhrzeit", "öffnung"]}, {"t": "Wann hat der Kiosk in St. Peter-Ording geöffnet?", "a": "Der Kiosk hat bei Strandwetter von 12 – 17 Uhr geöffnet. An den anderen Tagen gibt es die Möglichkeit kleine Speisen und Getränke als Take-away oben im Restaurant zu erwerben.", "s": ["geöffne", "kios", "kiosk", "peter-o"]}, {"t": "Kartenzahlung? Kein Problem!", "a": "Du kannst bei uns mit folgenden Karten bezahlen: MasterCard/Visa/EC-Karte. ACHTUNG: In den beiden Hamburger Restaurants ist keine Bargeldzahlung möglich.", "s": ["bargeld", "bezahl", "ec-kart", "kartenz", "kreditk", "zahlen"]}, {"t": "Wo kann ich eure Speisekarte sehen?", "a": "Unsere Speisekarten findest du auf unserer Website: saltandsilver.de/restaurants", "s": ["karte", "menü", "speisek"]}, {"t": "Gibt es vegetarische/vegane Speisen?", "a": "Wir bieten eine Vielzahl an vegetarischen Speisen und einigen veganen an. Isst du jedoch ausschließlich vegan, gib uns doch gerne bei deiner Reservierung vorab Bescheid, damit sich die Küche optimal auf deine Wünsche vorbereiten kann.", "s": ["speisen", "vegan", "vegane", "vegetar"]}, {"t": "Ich habe eine Allergie/Einschränkungen im Essverhalten. Kann ich bei euch essen?", "a": "Schreibe uns gerne eine Mail an (zentrale@saltandsilver.de) oder füge deine Allergien direkt bei deiner Buchung hinzu.", "s": ["allergi", "einschr", "essverh", "gluten", "laktose", "unverträ"]}, {"t": "Gibt es Gutscheine?", "a": "Unsere Gutscheine für Hamburg und St. Peter-Ording kannst du über unseren Onlineshop erwerben. Du entscheidest: Direktversand per PDF oder eine Gutscheinkarte per Post. ACHTUNG: Die Gutscheine gelten jeweils für unsere Restaurants in Hamburg ODER St. Peter-Ording.", "s": ["gutsche"]}, {"t": "Können wir unseren Hund mitbringen?", "a": "In St. Peter-Ording und in den Hamburger Restaurants sind Hunde gern gesehen. Teile uns aber bitte vorher per Reservierung mit, wenn du einen Hund mitbringst. Bitte hab Verständnis dafür, dass wir im Falle eines vollen Restaurants und eines sehr großen Hundes nicht immer einen Tisch im Innenraum anbieten können.", "s": ["hund", "hunde", "mitbrin"]}, {"t": "Ist das Restaurant Barrierefrei?", "a": "In Hamburg ist die Terrasse Barrierefrei. Jedoch nicht die Toiletten.", "s": ["barrier", "rollator", "rollstu", "stufen"]}, {"t": "Wie fordere ich Bewirtungsbelege an?", "a": "Um einen Bewirtungsbeleg/ eine Rechnung zu erhalten, sende bitte eine Mail an mail@saltandsilver.de. Füge bitte Deinen Rechnungsbeleg aus dem Restaurant, sowie die Rechnungsadresse Deiner Firma der E-Mail hinzu. Unser Team sendet dir die Rechnung als PDF zu.", "s": ["bewirtu"]}]/*ENDE*/;
  var ZIMMER = /*ZIMMER*/{"de": [{"k": "hh", "bild": "terrasse-nacht", "alt": "Terrasse des Salt & Silver Restaurants am Abend", "name": "Salt & Silver Restaurant", "klein": "Montag – Samstag, ab 18 Uhr", "text": "St. Pauli Hafenstraße 136, Hamburg", "restref": "161784"}, {"k": "cr", "bild": "front140", "alt": "Das Bistro Crudo an der Hafenstraße", "name": "Bistro Crudo", "klein": "Freitag & Samstag, 18 – 23 Uhr", "text": "St. Pauli Hafenstraße 140, Hamburg", "restref": "418068"}, {"k": "am", "bild": "meer-sonne", "alt": "Der Pfahlbau am Böhler Strand in der Sonne", "name": "Salt & Silver am Meer", "klein": "12 – 22 Uhr, Mittwoch Ruhetag", "text": "Zum Böhler Strand, Sankt Peter-Ording", "restref": "269220"}], "en": [{"k": "hh", "bild": "terrasse-nacht", "alt": "Terrace of the Salt & Silver Restaurant in the evening", "name": "Salt & Silver Restaurant", "klein": "Montag – Samstag, ab 18 Uhr", "text": "St. Pauli Hafenstraße 136, Hamburg", "restref": "161784"}, {"k": "cr", "bild": "front140", "alt": "Bistro Crudo on Hafenstraße", "name": "Bistro Crudo", "klein": "Freitag & Samstag, 18 – 23 Uhr", "text": "St. Pauli Hafenstraße 140, Hamburg", "restref": "418068"}, {"k": "am", "bild": "meer-sonne", "alt": "The stilt house on Böhler Strand in the sun", "name": "Salt & Silver am Meer", "klein": "12 – 22 Uhr, Mittwoch Ruhetag", "text": "Zum Böhler Strand, Sankt Peter-Ording", "restref": "269220"}]}/*ENDEZ*/;
  /* Das Haus: Name, Kontakt, Gesicht der Rezeption, Buchung, Startkarten. Schreibt gast.py hinein (für jedes Haus der Familie eigen). */
  var HAUS = /*HAUS*/{"name": "Salt & Silver", "person": "Cozy & Jo", "foto": "assets/img/gast-sus.webp", "mail": "mail@saltandsilver.de", "zentrale": "zentrale@saltandsilver.de", "datenschutz": "datenschutz.html#ki-assistent", "art": "opentable", "einbetten": true, "zeichen": "<span class=\"gast__emblem\" aria-hidden=\"true\"></span>", "bilder": ["assets/img/terrasse-nacht-s.webp", "assets/img/hh-gericht-s.webp", "assets/img/meer-pano-s.webp", "assets/img/s-gutschein-hh-s.webp"], "karten": null, "vorM": null, "hund": null, "buchung": ""}/*ENDEH*/;
  var TEL = HAUS.tel;
  var FP = !!HAUS.fahrplan;   // Fassung «Fahrplan» (Robert 18.10.2026): nur die Maeder-Häuser; Salt & Silver baut aus derselben Vorlage ohne
  var MAPPE = !!document.querySelector('[data-mappe]');
  /* Sprache: die der Seite (de/en/fr). In der Zimmermappe die des Handys, weil der Gast dort direkt vom QR-Code kommt. */
  var SP = (document.documentElement.lang || 'de').slice(0, 2).toLowerCase();
  if (MAPPE) { var hl = (navigator.language || 'de').slice(0, 2).toLowerCase(); SP = hl === 'en' || hl === 'fr' ? hl : 'de'; }
  if (['de', 'en'].indexOf(SP) < 0) SP = 'en';
  // Wurzel der Website aus der Adresse dieses Skripts: stimmt auf Seiten in Unterordnern (en/, fr/, rezeption/) ebenso
  var BASIS = ((document.querySelector('script[src*="assets/js/gast.js"]') || {}).src || '').replace(/assets\/js\/gast\.js.*$/, '');
  var T = {
    de: { fragen: 'Frag Salt & Silver', rolle: 'Salt & Silver · antwortet sofort', neu: 'Neues Gespräch', zu: 'Schließen', frage: 'Deine Frage', feld: 'Frag uns etwas', feldM: 'Frag uns etwas',
      buchen: 'Tisch reservieren', senden: 'Senden', fuss: 'KI-Assistent von Salt & Silver. Verbindlich sind die Reservierung bei OpenTable und das Team.', datenschutz: 'Datenschutz', start1: 'Was können wir<br>für dich tun?', start2: 'Frag alles zu den drei Restaurants, der Karte und dem Shop.',
      karten: [['Tisch', 'In allen drei Häusern', 'Ich möchte einen Tisch reservieren.'], ['Die Karte', 'Vegetarisch und mehr', 'Was gibt es bei euch Vegetarisches?'], ['Am Meer', 'Saison und Zeiten', 'Wann hat das Salt & Silver am Meer geöffnet?'], ['Gutscheine', 'Kochbücher und Shop', 'Welche Gutscheine gibt es?']],
      vorM: [], grussM: '',
      hallo: 'Moin! Was können wir für dich tun?', gerne: 'Gerne. Wähl Restaurant, Tag und Uhrzeit, OpenTable zeigt dir die freien Tische.',
      mKopf: 'Dein Tisch', mText: 'Restaurant, Tag und Uhrzeit wählen, OpenTable zeigt die freien Tische.', an: 'Tag', ab: 'Uhrzeit', gaeste: 'Personen', person: ' Person', personen: ' Personen', hund: '', kat: 'Restaurant',
      uhr: ' Uhr', mehr: '10 oder mehr', los: 'Freie Tische', mFuss: 'Freie Tische und die Bestätigung kommen von OpenTable.', waehle: 'Wähl bitte zuerst ein Restaurant.',
      viele: 'Ab 10 Personen reserviert das Team für dich. Schreib einfach an zentrale@saltandsilver.de, mit Tag, Uhrzeit, Restaurant und Personenzahl.',
      nacht: '', naechte: '', bis: '', mitHund: '', mHund: '', offen: 'OpenTable ist in einem neuen Fenster offen.', offenHund: '', offenEnde: ' Wenn ich sonst noch helfen kann, bin ich hier.',
      keine: 'Dazu habe ich gerade keine sichere Antwort. Schreib dem Team gern an mail@saltandsilver.de.', quelle: 'Aus den häufigen Fragen: ', ort: 'de-DE', lang: 'de-DE', bTitel: 'Reservierung', bZurueck: 'Zurück zum Gespräch', bFenster: 'In neuem Fenster öffnen', bHinweis: 'Reservierung über OpenTable, mit sofortiger Bestätigung.' },
    en: { fragen: 'Ask Salt & Silver', rolle: 'Salt & Silver · replies instantly', neu: 'New conversation', zu: 'Close', frage: 'Your question', feld: 'Ask us anything', feldM: 'Ask us anything',
      buchen: 'Book a table', senden: 'Send', fuss: 'AI assistant of Salt & Silver. The OpenTable booking and the team are binding.', datenschutz: 'Privacy', start1: 'What can we<br>do for you?', start2: 'Ask anything about the three restaurants, the menu and the shop.',
      karten: [['Table', 'In all three places', 'I would like to book a table.'], ['The menu', 'Vegetarian and more', 'What vegetarian dishes do you have?'], ['By the sea', 'Season and hours', 'When is Salt & Silver am Meer open?'], ['Vouchers', 'Cookbooks and shop', 'What vouchers do you offer?']],
      vorM: [], grussM: '',
      hallo: 'Moin! What can we do for you?', gerne: 'Sure. Pick the restaurant, day and time, OpenTable shows you the free tables.',
      mKopf: 'Your table', mText: 'Pick restaurant, day and time, OpenTable shows the free tables.', an: 'Day', ab: 'Time', gaeste: 'Guests', person: ' guest', personen: ' guests', hund: '', kat: 'Restaurant',
      uhr: '', mehr: '10 or more', los: 'Free tables', mFuss: 'Free tables and the confirmation come from OpenTable.', waehle: 'Please pick a restaurant first.',
      viele: 'For 10 guests or more, the team books for you. Just write to zentrale@saltandsilver.de with day, time, restaurant and number of guests.',
      nacht: '', naechte: '', bis: '', mitHund: '', mHund: '', offen: 'OpenTable has opened in a new window.', offenHund: '', offenEnde: ' If I can help with anything else, I am here.',
      keine: 'I have no reliable answer to that right now. Feel free to write to the team at mail@saltandsilver.de.', quelle: '', ort: 'en-GB', lang: 'en-GB', bTitel: 'Booking', bZurueck: 'Back to the conversation', bFenster: 'Open in a new window', bHinweis: 'Booking through OpenTable, confirmed instantly.' }
  }[SP];
  if (HAUS.karten && HAUS.karten[SP]) T.karten = HAUS.karten[SP];
  if (HAUS.vorM && HAUS.vorM[SP]) T.vorM = HAUS.vorM[SP];
  var VORSCHLAG = MAPPE ? T.vorM : [T.karten[0][2], T.karten[1][2], T.buchen];
  var V = ((document.querySelector('script[src*="gast.js"]') || { src: '' }).src.split('v=')[1] || '');
  var BUCHUNG = document.documentElement.getAttribute('data-buchung') || HAUS.buchung;
  var ZI = (ZIMMER && ZIMMER[SP]) || (ZIMMER && ZIMMER.de) || ZIMMER;

  var css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = BASIS + 'assets/css/gast.css?v=' + V;
  document.head.appendChild(css);

  var CE = HAUS.zeichen || '<svg viewBox="87 0 112 68" aria-hidden="true" fill="currentColor"><use href="#ce"/></svg>';   // Zeichen des Hauses
  var KREUZ = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13"/></svg>';
  var PFEIL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  var HOCH = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4"/></svg>';
  var PLUS = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>';
  var NEU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2.5l2.5 2.5L6 12.5 3 13l.5-3z"/></svg>';
  /* Start im leeren Fenster: vier Karten, jede stellt eine Frage */
  // Startkacheln: echte Fotos des Hauses, Titel, Zeile, Frage an die Rezeption. Bildpfade ausgeschrieben, sonst nimmt online.py sie nicht mit
  var BILDER = HAUS.bilder;
  var KARTEN = T.karten.map(function (k, i) { return [k[0], k[1], k[2], BASIS + BILDER[i]]; });

  var knopf = null;
  if (!MAPPE) {
    knopf = document.createElement('button');
    knopf.className = 'gast-knopf' + (FP ? ' gast-knopf--fp' : '') + (FP && HAUS.knopfart === 'rund' ? ' gast-knopf--rund' : ''); knopf.type = 'button';   // rund: Kreis mit Zeichen (Carlton, Doldenhorn), sonst Knopf mit Schrift (Robert 18.10.2026)
    knopf.setAttribute('aria-label', T.fragen); knopf.setAttribute('aria-expanded', 'false');
    knopf.innerHTML = FP ? '<span class="gast-knopf__ce">' + CE + '<em>' + T.knopf + '</em></span><span class="gast-knopf__x">' + KREUZ + '<em>' + T.zu + '</em></span>'
      : '<span class="gast-knopf__ce">' + CE + '</span><span class="gast-knopf__x">' + KREUZ + '</span>';
  }

  var fen = document.createElement('section');
  fen.className = 'gast' + (MAPPE ? ' gast--seite' : '') + (FP ? ' gast--fp' : '') + (FP && HAUS.knopfart === 'rund' ? ' gast--rund' : '');
  fen.setAttribute('role', MAPPE ? 'region' : 'dialog'); fen.setAttribute('aria-label', T.fragen);
  fen.innerHTML =
    (FP ? '<header class="gast__kopf"><span class="gast__ce">' + CE + '</span><div><b>' + HAUS.name + '</b><span>' + HAUS.person + ' · ' + T.rolle.split(' · ').pop() + '</span></div>'
      : '<header class="gast__kopf"><span class="gast__foto"><img src="' + BASIS + HAUS.foto + '" alt="" width="240" height="240" decoding="async"><i aria-hidden="true"></i></span><div><b>' + HAUS.person + '</b><span>' + T.rolle + '</span></div>') +
    '<button type="button" class="gast__neu" aria-label="' + T.neu + '" title="' + T.neu + '">' + NEU + '</button>' +
    (MAPPE ? '' : '<button type="button" class="gast__zu" aria-label="' + T.zu + '">' + KREUZ + '</button>') + '</header>' +
    '<div class="gast__lauf" aria-live="polite"></div>' +
    '<form class="gast__feld"><label><span class="sr">' + T.frage + '</span><textarea rows="1" autocomplete="off" enterkeyhint="send" placeholder="' + (MAPPE ? T.feldM : T.feld) + '"></textarea></label>' +
    '<div class="gast__leiste"><button type="button" class="gast__plus" aria-label="' + T.buchen + '" title="' + T.buchen + '">' + PLUS + '</button>' +
    '<button type="submit" class="gast__send" aria-label="' + T.senden + '">' + HOCH + '</button></div></form>' +
    '<p class="gast__fuss">' + T.fuss + ' <a href="' + BASIS + (HAUS.datenschutz || 'datenschutz.html#ki-assistent') + '">' + T.datenschutz + '</a></p>';

  (document.querySelector('[data-mappe]') || document.body).appendChild(fen);
  if (knopf) {
    var dunkel = document.createElement('div');
    dunkel.className = 'gast-dunkel'; dunkel.setAttribute('aria-hidden', 'true');
    dunkel.addEventListener('click', function () { auf(false); });
    document.body.appendChild(dunkel);
    document.body.appendChild(knopf);
  }
  /* Nichts zeigen, bevor der Stil da ist: gast.css kommt erst mit diesem Skript, das Fenster blitzte sonst beim Seitenaufbau
     ungestylt auf (Robert 10.10.2026). Rückfall nach 4 s, falls das Laden des Stils scheitert. */
  var teile = [fen, knopf, typeof dunkel !== 'undefined' ? dunkel : null].filter(Boolean);
  /* Ohne Stil hat die dunkle Fläche Deckkraft 1; kommt gast.css erst nach dem ersten Bild, würde sie sonst mit ihrem Übergang
     von 1 auf 0 ausblenden: ein dunkles Aufflackern über der ganzen Seite bei jedem Seitenwechsel (Robert 10.10.2026, online gemessen). */
  teile.forEach(function (el) { el.style.visibility = 'hidden'; el.style.transition = 'none'; });
  var dunkelEl = typeof dunkel !== 'undefined' ? dunkel : null;
  if (dunkelEl) dunkelEl.style.opacity = '0';
  var stilDa = false;
  function zeigen() {
    if (stilDa) return; stilDa = true;
    teile.forEach(function (el) { el.style.visibility = ''; void el.offsetWidth; });
    if (dunkelEl) dunkelEl.style.opacity = '';
    teile.forEach(function (el) { void el.offsetWidth; el.style.transition = ''; });
  }
  css.addEventListener('load', zeigen); css.addEventListener('error', zeigen); setTimeout(zeigen, 4000);
  if (css.sheet) zeigen();
  /* Bilder der Startkacheln und das Gesicht vorab holen und entpacken, sobald die Seite ruht (und sofort, wenn die Maus zum Knopf
     kommt): sonst luden sie erst beim Öffnen des Chats (Robert 10.10.2026). */
  var vorab = false;
  function vorladen() {
    if (vorab) return; vorab = true;
    [BASIS + HAUS.foto].concat(KARTEN.map(function (k) { return k[3] + '?v=' + V; })).forEach(function (src) {
      var i = new Image(); i.decoding = 'async'; i.src = src; if (i.decode) i.decode().catch(function () {});
    });
  }
  if (document.readyState === 'complete') setTimeout(vorladen, 800); else addEventListener('load', function () { setTimeout(vorladen, 800); });
  if (knopf) { knopf.addEventListener('pointerenter', vorladen); knopf.addEventListener('focus', vorladen); }
  var lauf = fen.querySelector('.gast__lauf'), feld = fen.querySelector('.gast__feld textarea'), form = fen.querySelector('form');
  var offen = false, begruesst = false, beschaeftigt = false, verlauf = [];

  function auf(an) {
    offen = an;
    document.documentElement.classList.toggle('gast-offen', an);
    if (knopf) knopf.setAttribute('aria-expanded', String(an));
    if (an) {
      if (!begruesst) { begruesst = true; gruss(); }
      if (window.matchMedia('(hover:hover)').matches) setTimeout(function () { feld.focus({ preventScroll: true }); }, 350);
    }
  }
  if (knopf) {
    knopf.addEventListener('click', function () { auf(!offen); });
    fen.querySelector('.gast__zu').addEventListener('click', function () { auf(false); knopf.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && offen) auf(false); });
  } else {
    auf(true);
  }

  function runter() { lauf.scrollTop = lauf.scrollHeight; }
  function blase(wer, text) {
    var b = document.createElement('div');
    b.className = 'gast__b gast__b--' + wer;
    if (text) b.textContent = text;
    lauf.appendChild(b); runter();
    return b;
  }
  function absaetze(b, text) {
    // Antwort in Absätze und Listen: jede Zeile mit «- » wird ein Punkt, aufeinanderfolgende Punkte eine Liste.
    // «Stichwort: Angabe» am Zeilenanfang wird als Stichwort hervorgehoben. Fettdruck-Sterne und Zwischentitel-Sterne fallen weg.
    var ul = null, p = null;
    text.replace(/\*\*/g, '').split('\n').forEach(function (z) {
      z = z.trim();
      if (!z) { ul = null; p = null; return; }
      var punkt = /^[-•*]\s+/.test(z);
      var inhalt = z.replace(/^[-•*]\s+/, '');
      var el;
      if (punkt) {
        if (!ul) { ul = document.createElement('ul'); b.appendChild(ul); }
        p = null; el = document.createElement('li'); ul.appendChild(el);
      } else {
        ul = null;
        if (!p) { p = document.createElement('p'); b.appendChild(p); } else p.appendChild(document.createTextNode(' '));
        el = p;
      }
      var m = punkt && inhalt.match(/^([^:]{2,32}):\s+(.+)$/);
      if (m) { var st = document.createElement('b'); st.textContent = m[1]; el.appendChild(st); el.appendChild(document.createTextNode(' ')); var wert = document.createElement('span'); zeiten(wert, m[2]); el.appendChild(wert);
        if (/^(CHF\s*)?\d[\d.]*(\.–|\.\d{2})?(\s*(bis|–|-)\s*(CHF\s*)?\d[\d.]*(\.–|\.\d{2})?)?$/.test(m[2].trim())) el.className = 'gast__pz'; }   // Gericht und Preis: wie eine Karte
      else if (FP && !punkt && /^[^.!?]{2,40}:$/.test(inhalt)) { p.className = 'gast__zt'; p.appendChild(document.createTextNode(inhalt.slice(0, -1))); p = null; }
      else zeiten(el, inhalt);
    });
    // Eine Liste, in der mindestens die Hälfte der Zeilen Uhrzeiten trägt, wird zur dunklen Tafel
    b.querySelectorAll('ul').forEach(function (u) {
      var li = Array.prototype.slice.call(u.children), z = li.filter(function (x) { return x.querySelector('.gast__zeit'); }).length;
      if (z && z * 2 >= li.length) u.classList.add('gast__tafel');
    });
  }
  // Uhrzeiten (07:00, 8:00 – 22:00) und Beträge (29.00, 15.–) in Schreibmaschinenschrift; der Wortlaut bleibt unverändert
  function zeiten(el, text) {
    text.split(/(\b\d{1,2}:\d{2}(?:\s?[–-]\s?\d{1,2}:\d{2})?\b|\b\d{1,4}\.(?:\d{2}|–)(?![\d.]))/).forEach(function (t, i) {
      if (!t) return;
      if (i % 2) { var z = document.createElement('span'); z.className = /:/.test(t) ? 'gast__zeit' : 'gast__betrag'; z.textContent = t; el.appendChild(z); }
      else el.appendChild(document.createTextNode(t));
    });
  }
  function tippe(b, text, quelle, fertig) {
    // Wort für Wort, aber gleich in der fertigen Form (Absätze, Punkte, Stichworte): vorher lief erst Fliesstext durch
    // und sprang am Ende in die Liste um (Robert 10.10.2026)
    var w = text.split(' '), i = 0;
    (function weiter() {
      i++;
      b.innerHTML = ''; absaetze(b, w.slice(0, i).join(' ')); runter();
      if (i < w.length) return setTimeout(weiter, 14 + Math.random() * 20);
      if (quelle) { var q = document.createElement('small'); q.textContent = quelle; b.appendChild(q); }
      runter(); fertig && fertig();
    })();
  }
  function denkt() {
    var b = blase('haus'); b.classList.add('gast__b--denkt'); b.innerHTML = '<i></i><i></i><i></i>'; return b;
  }
  /* Zeichen und Bereiche zu den sechs Vorschlägen der Mappe (Reihenfolge wie T.vorM) */
  var MZ = ['<path d="M8 3.5c-1.4 1.4 1.4 2.8 0 4.2M12 2.8c-1.4 1.4 1.4 2.8 0 4.2M16 3.5c-1.4 1.4 1.4 2.8 0 4.2"/><path d="M4 12h16M5 12v7h14v-7M9 15.5h6"/>',
    '<path d="M4 17h16M5.5 17a6.5 6.5 0 0 1 13 0M12 10.5V8.8M10.6 8.8h2.8M3 20h18"/>',
    '<path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c-.8.8.8 1.7 0 2.5M11.5 3.5c-.8.8.8 1.7 0 2.5"/>',
    '<circle cx="16.5" cy="6.5" r="2.5"/><path d="M2.5 19l6-9 4 6 2.5-3.5 6.5 6.5z"/>',
    '<path d="M10.2 5.7a1.8 1.8 0 1 1 1.8 1.8v1.4"/><path d="M12 9l-9 7.5h18z"/>',
    '<path d="M4 16v-3l2-5h12l2 5v3zM4 16v2h3v-2M17 16v2h3v-2M4.5 13h15M10 5.5h4"/>'];
  var MF = ['wellness-2', 'z-superior', 'brot', 'herbst', 'z-signature-bad', 'haus-abend-eingang'];   // echte Fotos des Hauses je Kachel (Robert 18.10.2026 23:48), kleine Fassungen aus assets/img/k/
  var MB = { de: ['Wellness', 'Im Zimmer', 'Frühstück', 'Ausflüge', 'Wäsche', 'Unterwegs'],
    en: ['Wellness', 'In your room', 'Breakfast', 'Outings', 'Laundry', 'Getting around'],
    fr: ['Bien-être', 'En chambre', 'Petit-déjeuner', 'Excursions', 'Linge', 'Déplacements'] };
  function vorschlaege(liste) {
    var v = document.createElement('div'); v.className = 'gast__vor';
    liste.forEach(function (f) {
      var k = document.createElement('button'); k.type = 'button';
      var vi = MAPPE && liste === VORSCHLAG ? liste.indexOf(f) : -1;   // Mappe: Kachel mit Zeichen und Bereich (18.10.2026 20:33)
      if (vi > -1 && MZ[vi]) { k.innerHTML = (MF[vi] ? '<span class="gast__vf"><img src="' + BASIS + 'assets/img/k/' + MF[vi] + '.webp" alt="" width="480" height="320" decoding="async"></span>' : '') + '<i class="gast__vi"><svg viewBox="0 0 24 24" aria-hidden="true">' + MZ[vi] + '</svg></i><small></small><b></b>'; k.querySelector('small').textContent = (MB[SP] || MB.de)[vi] || ''; k.querySelector('b').textContent = f; }
      else { k.innerHTML = '<span></span>' + PFEIL; k.firstChild.textContent = f; }
      k.addEventListener('click', function () { v.remove(); frage(f); });
      v.appendChild(k);
    });
    lauf.appendChild(v); runter();
  }
  function start() {
    var st = document.createElement('div'); st.className = 'gast__start';
    st.innerHTML = FP ? '<h3>' + T.hallo + '</h3><div class="gast__karten"></div>' : '<span class="gast__start-ce">' + CE + '</span><h3>' + T.start1 + '</h3><p>' + T.start2 + '</p><div class="gast__karten"></div>';
    KARTEN.forEach(function (k, i) {
      var b = document.createElement('button'); b.type = 'button';
      if (FP && i === 0) b.className = 'gast__k--gross';
      b.innerHTML = '<span class="gast__k-bild"><img src="' + k[3] + '?v=' + V + '" alt="" decoding="async"></span><span class="gast__k-text"><b></b><span></span>' + (FP && i === 0 ? '<em><i></i>' + PFEIL + '</em>' : '') + '</span>';
      b.querySelector('b').textContent = k[0]; b.querySelector('.gast__k-text span').textContent = k[1]; b.setAttribute('aria-label', k[0] + ': ' + k[1]);
      if (FP && i === 0) b.querySelector('em i').textContent = k[2];
      b.addEventListener('click', function () { frage(k[2]); });
      st.lastChild.appendChild(b);
    });
    lauf.appendChild(st);
  }
  function gruss() {
    if (!MAPPE) return start();
    beschaeftigt = true;
    var b = denkt();
    setTimeout(function () {
      b.classList.remove('gast__b--denkt'); b.innerHTML = '';
      var t = T.grussM;
      tippe(b, t, '', function () { beschaeftigt = false; vorschlaege(VORSCHLAG); });
    }, 500);
  }

  /* ---- Festes Antwortbuch (Robert 19.10.2026 05:10: «feste Demo-Antworten in den Gäste-Chat»): assets/js/gast-antwortbuch.json, je Haus eigen.
     Dieselbe Zuordnung wie im Server (_gast/gast.py, buch_antwort). Antwortet die Funktion nicht innert «warten_ms» oder mit einem Fehler,
     antwortet das Fenster selbst daraus. Ohne die Datei bleibt alles wie vorher. ---- */
  var BUCH = null;
  try { fetch(BASIS + 'assets/js/gast-antwortbuch.json?v=' + V).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d && d.themen) BUCH = d; }).catch(function () {}); } catch (e) {}
  var EN_W = 'the is are do does can we you there what how when where our my have bring serve i much which would like order room until free get book cancel leave luggage breakfast dog parking please children welcome kids'.split(' ');
  var FR_W = 'le la les est vous nous avez quel quelle pour chien peut comment ou je une des puis-je y a-t-il quand combien'.split(' ');
  function kern(t) { return String(t).toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9'\- ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function hat(k, n) { var kk = kern(k); return !!kk && n.indexOf((k.charAt(0) === ' ' ? ' ' : '') + kk + (k.slice(-1) === ' ' ? ' ' : '')) > -1; }
  function buchSprache(f) {
    var w = kern(f).match(/[a-z'\-]+/g) || [], en = 0, fr = 0;
    w.forEach(function (x) { if (EN_W.indexOf(x) > -1) en++; if (FR_W.indexOf(x) > -1) fr++; });
    return en >= 2 ? 'en' : fr >= 2 ? 'fr' : SP;
  }
  function buchAntwort(f) {
    if (!BUCH) return null;
    var sp = buchSprache(f), n = ' ' + kern(f) + ' ', best = null, punkte = 0;
    BUCH.themen.forEach(function (t) {
      var p = 0;
      (t.s2 || []).forEach(function (k) { if (hat(k, n)) p += 2; });
      (t.s || []).forEach(function (k) { if (hat(k, n)) p += 1; });
      if (p > punkte) { punkte = p; best = t; }
    });
    if (best) return { text: best.a[sp] || best.a.de, maske: best.maske ? {} : null };
    var oft = (BUCH.oft || []).map(function (i) { return BUCH.themen.filter(function (t) { return t.id === i; })[0]; }).filter(Boolean);
    return { text: BUCH.ohne[sp] || BUCH.ohne.de, knoepfe: oft.map(function (t) { return t.q[sp] || t.q.de; }) };
  }

  /* ---- Rückfall ohne Funktion: die passende Stelle aus «Gut zu wissen» ---- */
  function norm(s) { return s.toLowerCase().replace(/[^a-zäöüéèà0-9\- ]/g, ' '); }
  function finde(f) {
    var n = ' ' + norm(f) + ' ', best = null, punkte = 0;
    WISSEN.forEach(function (w) {
      var p = 0;
      w.s.forEach(function (s) { if (n.indexOf(s) > -1) p += s.length > 4 ? 2 : 1; });
      if (n.indexOf(norm(w.t)) > -1) p += 3;
      if (p > punkte) { punkte = p; best = w; }
    });
    return best;
  }

  /* ---- Buchungsmaske im Gespräch ---- */
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function schoen(s) { var d = new Date(s + 'T12:00:00'); return isNaN(d) ? '' : d.toLocaleDateString(T.ort, { weekday: 'short', day: 'numeric', month: 'long' }); }
  function maske(m) {
    /* Tischmaske: Restaurant, Tag, Uhrzeit, Personen. «Freie Tische» öffnet OpenTable mit diesen Angaben im grossen Fenster.
       Die OpenTable-Nummer (restref) jedes Hauses kommt aus dem Fenster «Wo möchtest du sitzen?» der Seite, das pflegt das Studio. */
    m = m || {};
    var heute = new Date(), tag = m.datum && m.datum >= iso(heute) ? m.datum : iso(heute);
    var zeiten = []; for (var hh = 12; hh <= 22; hh++) { zeiten.push(('0' + hh).slice(-2) + ':00'); if (hh < 22) zeiten.push(('0' + hh).slice(-2) + ':30'); }
    var uhr = zeiten.indexOf(m.uhrzeit) > -1 ? m.uhrzeit : '19:00';
    var g = Math.min(10, Math.max(1, +m.personen || 2)), kat = m.haus || '';
    var k = document.createElement('div'); k.className = 'gast__maske';
    k.innerHTML =
      '<div class="gast__m-kopf"><b>' + T.mKopf + '</b><span>' + T.mText + '</span></div>' +
      '<div class="gast__m-zimmer" role="group" aria-label="' + T.kat + '">' +
        ZI.map(function (z) {
          return '<button type="button" class="gast__m-z" data-k="' + z.k + '" aria-pressed="' + (z.k === kat) + '">' +
            '<img src="' + BASIS + 'assets/img/' + z.bild + '-s.webp" alt="' + z.alt.replace(/"/g, '&quot;') + '" decoding="async">' +
            '<span><b>' + z.name + '</b><i>' + z.klein + '</i><em>' + z.text + '</em></span></button>';
        }).join('') +
      '</div>' +
      '<div class="gast__m-zeile">' +
        '<label><span>' + T.an + '</span><input type="date" name="an" min="' + iso(heute) + '" value="' + tag + '"></label>' +
        '<label><span>' + T.ab + '</span><select name="ab">' + zeiten.map(function (z) { return '<option' + (z === uhr ? ' selected' : '') + '>' + z + '</option>'; }).join('') + '</select></label>' +
        '<label><span>' + T.gaeste + '</span><select name="g">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return '<option value="' + n + '"' + (n === g ? ' selected' : '') + '>' + (n === 10 ? T.mehr : n + (n === 1 ? T.person : T.personen)) + '</option>'; }).join('') + '</select></label>' +
      '</div>' +
      '<div class="gast__m-fuss"><span class="gast__m-summe"></span><button type="button" class="kn gast__m-los">' + T.los + '<i>' + PFEIL + '</i></button></div>' +
      '<small>' + T.mFuss + '</small>';
    lauf.appendChild(k);
    var fan = k.querySelector('[name=an]'), fab = k.querySelector('[name=ab]'), fg = k.querySelector('[name=g]'), summe = k.querySelector('.gast__m-summe');
    var zs = Array.prototype.slice.call(k.querySelectorAll('.gast__m-z'));
    function gewaehlt() { var z = zs.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0]; return z ? z.getAttribute('data-k') : ''; }
    function zeige() {
      var z = ZI.filter(function (x) { return x.k === gewaehlt(); })[0];
      k.classList.remove('gast__maske--fehlt');
      summe.textContent = (z ? z.name + ' · ' : '') + schoen(fan.value) + ' · ' + fab.value + T.uhr + ' · ' + (fg.value === '10' ? T.mehr : fg.value + (fg.value === '1' ? T.person : T.personen));
    }
    [fan, fab, fg].forEach(function (x) { x.addEventListener('change', zeige); });
    zs.forEach(function (b) { b.addEventListener('click', function () { zs.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); zeige(); }); });
    k.querySelector('.gast__m-los').addEventListener('click', function () {
      var z = ZI.filter(function (x) { return x.k === gewaehlt(); })[0];
      if (!z) { k.classList.add('gast__maske--fehlt'); summe.textContent = T.waehle; return; }
      var t;
      if (fg.value === '10') {
        t = T.viele;
      } else {
        var rr = restref(z);
        buchung('https://www.opentable.de/booking/restref/availability?lang=' + T.lang + '&restRef=' + rr + '&dateTime=' + encodeURIComponent(fan.value + 'T' + fab.value) + '&partySize=' + fg.value);
        t = T.offenEnde.trim();
      }
      verlauf.push({ role: 'assistant', content: t });
      var b = blase('haus'); absaetze(b, t); runter();
    });
    zeige();
    fen.classList.add('gast--breit');
    setTimeout(function () { lauf.scrollTo({ top: Math.max(0, lauf.scrollTop + k.getBoundingClientRect().top - lauf.getBoundingClientRect().top - 12), behavior: 'smooth' }); }, 60);
  }
  function restref(z) {
    // Geltender Link aus dem Fenster «Wo möchtest du sitzen?» (gleiche Reihenfolge wie HAEUSER in build.py), sonst der Rückfall
    var a = document.querySelectorAll('.tisch__wahl a[href*="restref="]')[ZI.indexOf(z)];
    var m = a && a.getAttribute('href').match(/restref=(\d+)/);
    return m ? m[1] : z.restref;
  }

  /* ---- Buchung im grossen Fenster: das Buchungssystem des Hauses (SimpleBooking) mit Daten und Gästen, ohne die Seite zu verlassen.
     Bleibt es leer (Browser sperrt eingebettete Seiten), steht oben der Weg in ein neues Fenster. */
  var bf = null;
  function buchung(adr) {
    if (!bf) {
      bf = document.createElement('div');
      bf.className = 'gast-buchung'; bf.setAttribute('role', 'dialog'); bf.setAttribute('aria-label', T.bTitel);
      bf.innerHTML = '<div class="gast-buchung__rahmen"><header class="gast-buchung__kopf"><span class="gast__foto"><img src="' + BASIS + HAUS.foto + '" alt="" width="240" height="240"><i aria-hidden="true"></i></span>' +
        '<div><b>' + T.bTitel + '</b><span>' + T.bHinweis + '</span></div>' +
        '<a class="gast-buchung__neu" target="_blank" rel="noopener">' + T.bFenster + '</a><button type="button" class="kn kn--klein gast-buchung__zu">' + T.bZurueck + '</button></header>' +
        '<div class="gast-buchung__buehne"><div class="gast-buchung__lade"><i></i><i></i><i></i></div><iframe title="' + T.bTitel + '" allow="payment"></iframe></div></div>';
      document.body.appendChild(bf);
      bf.querySelector('.gast-buchung__zu').addEventListener('click', function () { zu(); });
      bf.addEventListener('click', function (e) { if (e.target === bf) zu(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.documentElement.classList.contains('gast-bucht')) zu(); });
      bf.querySelector('iframe').addEventListener('load', function () { bf.classList.add('geladen'); });
    }
    function zu() { document.documentElement.classList.remove('gast-bucht'); setTimeout(function () { feld.focus({ preventScroll: true }); }, 300); }
    bf.classList.remove('geladen');
    bf.querySelector('.gast-buchung__neu').href = adr;
    bf.querySelector('iframe').src = adr;
    requestAnimationFrame(function () { document.documentElement.classList.add('gast-bucht'); });
  }

  function frage(f) {
    if (beschaeftigt || !f.trim()) return;
    var alt = lauf.querySelector('.gast__vor'); if (alt) alt.remove();
    var st = lauf.querySelector('.gast__start'); if (st) st.remove();
    blase('gast', f.trim());
    if (/^\s*(hallo|hi|hey|moin|grüezi|guten (tag|morgen|abend)|servus)[\s!.]*$/i.test(f)) {
      beschaeftigt = true; var b0 = denkt();
      return setTimeout(function () { b0.classList.remove('gast__b--denkt'); b0.innerHTML = ''; tippe(b0, T.hallo, '', function () { beschaeftigt = false; }); }, 500);
    }
    verlauf.push({ role: 'user', content: f.trim() });
    beschaeftigt = true;
    var b = denkt();
    var fertig = false;
    function zeige(text, quelle, m, kn) {
      if (fertig) return; fertig = true; clearTimeout(frist);
      b.classList.remove('gast__b--denkt'); b.innerHTML = '';
      tippe(b, text, quelle, function () { beschaeftigt = false; if (m) maske(m); else if (kn && kn.length) vorschlaege(kn); });
    }
    function ausBuch() {   // Antwortbuch: nie ein Fehler, nie leer
      var x = buchAntwort(f);
      if (!x || fertig) return !!x;
      verlauf.push({ role: 'assistant', content: x.text });
      zeige(x.text, '', x.maske, x.knoepfe);
      return true;
    }
    var frist = setTimeout(function () { ausBuch(); }, (BUCH && BUCH.warten_ms) || 1200);
    fetch(BASIS + 'api/gast', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: verlauf.slice(-12), mappe: MAPPE, sprache: SP, heute: iso(new Date()) }) })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (a) {
        if (!a || !a.text) throw 0;
        if (fertig) return;
        verlauf.push({ role: 'assistant', content: a.text });
        zeige(a.text, '', a.maske, a.knoepfe);
      })
      .catch(function () {
        if (fertig || ausBuch()) return;
        if (/(reservier|tisch|table|book|sitzplatz|plätze|platz frei|platz für)/i.test(f)) {
          var t0 = T.gerne;
          verlauf.push({ role: 'assistant', content: t0 });
          return zeige(t0, '', {});
        }
        var w = finde(f);
        if (SP !== 'de') w = null;   // der Rückfall kennt nur den deutschen Wortlaut
        var t = w ? w.a : T.keine;
        verlauf.push({ role: 'assistant', content: t });
        zeige(t, w ? T.quelle + w.t : '');
      });
  }
  fen.querySelector('.gast__neu').addEventListener('click', function () {
    if (beschaeftigt) return;
    verlauf = []; lauf.innerHTML = ''; fen.classList.remove('gast--breit'); gruss(); feld.focus({ preventScroll: true });
  });
  fen.querySelector('.gast__plus').addEventListener('click', function () {
    if (beschaeftigt) return;
    var st = lauf.querySelector('.gast__start'); if (st) st.remove();
    var alt = lauf.querySelector('.gast__vor'); if (alt) alt.remove();
    var t = T.gerne;
    verlauf.push({ role: 'assistant', content: t });
    var b = blase('haus'); absaetze(b, t); maske({});
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = feld.value; feld.value = ''; hoehe();
    frage(f);
  });
  /* Chatfeld (Robert 15.10.2026): am rechten Rand bricht die Zeile um und das Feld wächst mit, bis fünf Zeilen. Enter sendet, Umschalt+Enter macht eine neue Zeile. */
  function hoehe() { feld.style.height = 'auto'; if (feld.value) feld.style.height = Math.min(feld.scrollHeight, 132) + 'px'; else feld.style.height = ''; }
  feld.addEventListener('input', hoehe);
  feld.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
})();
