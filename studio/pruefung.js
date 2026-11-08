/* Prüfung · Studio · Salt & Silver.
   Die Kontrollinstanz des Studios. Läuft für sich: braucht weder studio.js noch studio.css, und auch nicht den Server.
   Was der Server nicht beantwortet, prüft sie von hier aus; das Lexikon steckt komplett in dieser Datei.
   Neue Fehlermeldung im Studio → Stichwort in pruefung.py (LEX_MUSTER) UND Eintrag hier im LEXIKON (gleiche id). */
(function () {
'use strict';
window.PRUEFUNG_GELADEN = true;

// ------------------------------------------------------------------ Lexikon: jede bekannte Fehlerquelle mit Sehen · Grund · Tun
var LEXIKON = [
  // Verbindung und Browser
  { id: 'server-aus', t: 'Das Studio antwortet nicht', s: 'Das Studio bleibt leer oder meldet „Keine Verbindung zum Studio“. Die Prüfung zeigt beim Punkt „Studio erreichbar“ Rot.',
    g: 'Am Rechner: Das Programm des Studios läuft nicht (Rechner neu gestartet, Fenster geschlossen). Online: Der Dienst, der die Probe rechnet, ist gerade nicht erreichbar oder startet neu.',
    d: 'Am Rechner: im Ordner des Studios „python3 studio.py“ starten, dann diese Seite neu laden. Online: eine Minute warten und neu prüfen. Bleibt es rot, an Robert schreiben (Bericht kopieren, unten).' },
  { id: 'offline', t: 'Kein Internet', s: 'Nichts lädt, die Prüfung meldet „Dieses Gerät ist offline“.', g: 'Das Gerät hat gerade keine Verbindung (WLAN aus, Flugmodus, Funkloch).', d: 'Verbindung herstellen, dann „Noch einmal prüfen“.' },
  { id: 'langsam', t: 'Das Studio ist langsam', s: 'Speichern dauert länger als zehn Sekunden, die Prüfung meldet lange Antwortzeiten.',
    g: 'Jede Änderung baut die Vorschau der ganzen Website neu. Online rechnet ein kleiner Dienst, der nach einer Pause erst aufwachen muss (das erste Speichern nach längerer Zeit dauert am längsten).',
    d: 'Nicht mehrfach klicken, die Antwort abwarten. Bleibt es dauerhaft langsam, die Prüfung laufen lassen und den Bericht schicken.' },
  { id: 'browser-alt', t: 'Browser zu alt', s: 'Knöpfe reagieren nicht, Ansichten bleiben leer.', g: 'Dem Browser fehlen Dinge, die das Studio braucht (zum Beispiel ein sehr altes Safari).', d: 'Browser aktualisieren oder einen aktuellen Chrome, Safari, Firefox oder Edge nehmen.' },
  { id: 'kekse-aus', t: 'Cookies sind abgeschaltet', s: 'Man wird immer wieder abgemeldet, in der Probe sind Änderungen nach dem Neuladen weg.',
    g: 'Das Studio merkt sich die Anmeldung (und in der Probe den Entwurf) in einem Cookie dieser Seite. Ohne Cookies geht das nicht.', d: 'Cookies für diese Adresse erlauben (Browser-Einstellungen, Datenschutz). Ein privates Fenster löscht sie beim Schließen.' },
  { id: 'speicher-aus', t: 'Browser-Speicher gesperrt', s: 'Die Prüfung kann Fehler der Oberfläche nicht mitschreiben.', g: 'Privates Fenster oder strenge Datenschutz-Einstellungen sperren den lokalen Speicher.', d: 'Nichts Dringendes. Das Studio funktioniert trotzdem, nur das Mitschreiben fehlt.' },
  { id: 'datei-geoeffnet', t: 'Seite als Datei geöffnet', s: 'Die Adresse beginnt mit „file://“, nichts lässt sich prüfen.', g: 'Die Prüfseite wurde direkt aus dem Ordner geöffnet statt über das Studio.', d: 'Das Studio starten und die Prüfung über die Adresse des Studios öffnen: …/studio/pruefung.html.' },
  { id: 'uhr', t: 'Uhrzeit weicht ab', s: 'Zeiten in „Verlauf“ und „Änderungen“ stimmen nicht, „vor 3 Std.“ obwohl gerade gespeichert.', g: 'Die Uhr dieses Geräts oder des Servers geht falsch.', d: 'In den Einstellungen des Geräts „Uhrzeit automatisch setzen“ einschalten.' },
  { id: 'host', t: 'Falsche Adresse', s: 'Meldung „Falscher Host“.', g: 'Das Studio nimmt aus Sicherheitsgründen nur Anfragen an seine eigene Adresse an (localhost). Ein Aufruf über einen anderen Namen wird abgewiesen.', d: 'Das Studio über http://localhost:… öffnen. Soll es über einen anderen Namen laufen, muss der beim Start erlaubt werden (SUS_HOSTS).' },
  { id: 'anfrage', t: 'Eingabe ließ sich nicht lesen', s: 'Meldung „Ungültige Anfrage“ oder „Die Eingabe ließ sich nicht lesen“.', g: 'Die Oberfläche hat etwas geschickt, das der Server nicht versteht. Meist ist eine alte Fassung des Studios im Browser zwischengespeichert, oder ein anderes Fenster hat dazwischen gespeichert.', d: 'Studio neu laden (Reparatur „Studio frisch laden“). Passiert es wieder, den Bericht schicken: der Fehler steht im Protokoll.', rep: 'neu-laden' },
  // Anmeldung
  { id: 'anmeldung', t: 'Anmeldung nötig oder Passwort falsch', s: 'Das Studio zeigt die Anmeldung, „Bitte anmelden“ oder „Das Passwort stimmt nicht“.', g: 'Die Anmeldung gilt zwölf Stunden. Danach, nach einem Passwortwechsel oder nach „Alle abmelden“ muss man sich neu anmelden.', d: 'Neu anmelden. Passwort vergessen: Robert bitten, den Zugang zurückzusetzen (Datei zugang.json im Datenordner löschen, dann legt der Nächste ein neues fest).' },
  { id: 'gesperrt', t: 'Zu viele Versuche', s: 'Meldung „Zu viele Versuche. Bitte in … Sekunden noch einmal.“', g: 'Nach fünf falschen Passwörtern sperrt das Studio diesen Anschluss kurz, damit niemand Passwörter durchprobieren kann.', d: 'Die angezeigten Sekunden warten, dann mit dem richtigen Passwort anmelden.' },
  { id: 'passwort-kurz', t: 'Passwort zu kurz', s: 'Meldung „Das Passwort braucht mindestens 10 Zeichen“.', g: 'Kurze Passwörter sind zu leicht zu erraten.', d: 'Ein längeres nehmen, gern ein Satz aus mehreren Wörtern.' },
  { id: 'zugang', t: 'Zugang schon eingerichtet oder offen', s: 'Meldung „Das Studio ist schon eingerichtet“ oder „gerade ohne Passwort offen“.', g: 'Ein Passwort kann nur einmal am Anfang festgelegt werden. Liegt im Datenordner die Datei „offen“, braucht das Studio gar keins.', d: 'Anmelden statt einrichten. Ändern geht unter „Zugang“.' },
  { id: 'offen', t: 'Studio ohne Passwort', s: 'Die Prüfung meldet „ohne Passwort offen“.', g: 'So gewollt, solange die Seite nur am eigenen Rechner läuft (Robert, 08.10.2026). Im Datenordner liegt dafür die Datei „offen“.', d: 'Nichts zu tun. Soll das Passwort wieder gelten: die Datei „offen“ im Ordner inhalt/ löschen.' },
  { id: 'zugang-kaputt', t: 'Passwort-Datei beschädigt', s: 'Niemand kommt mehr hinein, die Prüfung meldet die Passwort-Datei als beschädigt.', g: 'zugang.json lässt sich nicht lesen (abgebrochenes Speichern, von Hand bearbeitet).', d: 'Die Datei inhalt/zugang.json löschen. Beim nächsten Öffnen legt man ein neues Passwort fest. Inhalte gehen dabei nicht verloren.' },
  // Gespeicherte Inhalte
  { id: 'stand-kaputt', t: 'Gespeicherte Inhalte beschädigt', s: 'Meldung „Die gespeicherten Inhalte … sind beschädigt“, oder die Prüfung zeigt Stand bzw. Entwurf rot.',
    g: 'Die Datei mit dem Stand oder dem Entwurf lässt sich nicht lesen, etwa weil der Rechner mitten im Speichern ausging. Das Studio nimmt sie dann bewusst nicht als „leer“, sonst wäre beim nächsten Speichern alles weg.',
    d: 'Meist hat das Studio schon selbst die letzte Sicherung zurückgelegt (steht im Protokoll). Sonst: oben beim roten Punkt „Entwurf“ oder „Veröffentlichter Stand“ die Reparatur „Sicherung zurückholen“ drücken, sie gehört genau zu dieser Datei. Die beschädigte Fassung bleibt als Kopie liegen.' },
  { id: 'datei-fehlt', t: 'Datei noch nicht angelegt', s: 'Die Prüfung meldet Stand oder Entwurf als „noch nicht angelegt“.', g: 'Das Studio wurde noch nie geöffnet, oder der Datenordner ist neu.', d: 'Studio einmal öffnen, oder Reparatur „Neu bauen“.', rep: 'neubau' },
  { id: 'nicht-schreibbar', t: 'Studio kann nicht speichern', s: 'Speichern scheitert, die Prüfung meldet „kann nicht speichern“.', g: 'Der Datenordner ist schreibgeschützt, voll oder liegt auf einem getrennten Laufwerk.', d: 'Speicherplatz und Rechte des Ordners inhalt/ prüfen. Am Mac: Informationen → Freigabe & Zugriffsrechte → Lesen & Schreiben.' },
  { id: 'platz', t: 'Wenig Speicherplatz', s: 'Die Prüfung meldet wenig freien Platz.', g: 'Jede Veröffentlichung legt einen Stand im Verlauf ab, jedes Foto mehrere Größen.', d: 'Platz auf dem Rechner schaffen. Reparatur „Übrige Uploads löschen“ räumt nicht mehr gebrauchte Fotos weg.', rep: 'bilder-aufraeumen' },
  { id: 'verlauf-kaputt', t: 'Stand im Verlauf unlesbar', s: 'Ein früherer Stand fehlt im „Verlauf“.', g: 'Eine Datei im Ordner verlauf/ ist beschädigt.', d: 'Nichts Dringendes, alle anderen Stände gehen weiter. Die beschädigte Datei kann Robert aus dem Ordner nehmen.' },
  // Bauen und Vorschau
  { id: 'bau-fehler', t: 'Die Seite lässt sich nicht bauen', s: 'Meldung „Die Seite ließ sich nicht bauen …“ oder oben im Studio „Der Entwurf lässt sich gerade nicht bauen“.',
    g: 'Beim Zusammensetzen der Website aus euren Angaben ist etwas schiefgegangen. Eure letzte Änderung wurde dann nicht übernommen, der Entwurf steht wie davor.',
    d: 'Die letzte Änderung anders formulieren (sehr lange Texte kürzen, Sonderzeichen weglassen) und noch einmal speichern. Reparatur „Neu bauen“ versucht es mit dem gespeicherten Stand. Hilft beides nicht: Bericht an Robert.', rep: 'neubau' },
  { id: 'entwurf-fehlt', t: 'Vorschau fehlt', s: '„Entwurf ansehen“ oder der Vergleich zeigt „Nicht gefunden“.', g: 'Die Vorschau-Fassung der Website ist nicht (fertig) gebaut, etwa nach einem abgebrochenen Bau.', d: 'Reparatur „Neu bauen“.', rep: 'neubau' },
  { id: 'live-fehlt', t: 'Veröffentlichte Seite fehlt', s: 'Die Startseite der Website ist leer oder „Nicht gefunden“.', g: 'Die veröffentlichte Fassung wurde gelöscht oder ein Veröffentlichen brach mitten im Bau ab.', d: 'Reparatur „Website neu bauen“: baut die Website aus dem zuletzt veröffentlichten Stand.', rep: 'website-neu' },
  { id: 'live-alt', t: 'Website zeigt nicht den veröffentlichten Stand', s: 'Die Prüfung meldet, dass die Website nicht zum zuletzt veröffentlichten Stand passt.', g: 'Ein Veröffentlichen wurde unterbrochen (Rechner aus, Zeitüberschreitung). Der Stand ist gespeichert, die Website aber nicht fertig gebaut.', d: 'Reparatur „Website neu bauen“.', rep: 'website-neu' },
  { id: 'verwaist', t: 'Texte ohne Stelle', s: 'In „Änderungen“ steht ein Text, der auf der Seite nirgends auftaucht.', g: 'Die Stelle, an der der Text stand, wurde beim Weiterbauen der Website umgebaut. Die Änderung wirkt deshalb nirgends.', d: 'Reparatur „Texte ohne Stelle entfernen“, dann den Text an der neuen Stelle noch einmal ändern.', rep: 'aufraeumen' },
  { id: 'bild-fehlt', t: 'Bild fehlt', s: 'Auf der Seite ist an einer Stelle kein Bild, oder Meldung „Das neue Bild fehlt“.', g: 'Das hochgeladene Foto ist nicht (mehr) auf dem Rechner, etwa weil der Ordner aufgeräumt wurde oder das Hochladen abbrach.', d: 'Das Foto an dieser Stelle noch einmal hochladen.' },
  { id: 'bilder-uebrig', t: 'Übrige Uploads', s: 'Die Prüfung meldet hochgeladene Dateien, die nichts mehr braucht.', g: 'Fotos und Logos, die hochgeladen, dann aber wieder getauscht oder verworfen wurden. Sie stören nicht, belegen aber Platz und gehen beim Hochladen mit online.', d: 'Reparatur „Übrige Uploads löschen“. Fotos, die irgendein Stand im Verlauf noch nennt, bleiben.', rep: 'bilder-aufraeumen' },
  { id: 'nichts-offen', t: 'Nichts zu veröffentlichen', s: 'Meldung „Es gibt nichts zu veröffentlichen“.', g: 'Der Entwurf ist gleich dem, was schon auf der Website steht.', d: 'Nichts zu tun. Sieht die Website trotzdem alt aus: Prüfung laufen lassen, Punkt „Veröffentlichte Seite“.' },
  { id: 'veraltet', t: 'Eintrag gibt es nicht (mehr)', s: 'Meldungen wie „Diese Seite gibt es nicht“, „Dieses Produkt gibt es nicht“, „Die Stelle ist nicht bekannt“.', g: 'Die Ansicht im Browser ist älter als der Stand im Studio, etwa weil in einem zweiten Fenster gespeichert oder zurückgenommen wurde.', d: 'Studio neu laden (Reparatur „Studio frisch laden“) und die Änderung noch einmal machen.', rep: 'neu-laden' },
  // Eingaben
  { id: 'pflichtfeld', t: 'Pflichtangabe fehlt', s: 'Meldungen wie „Der Text darf nicht leer sein“, „Das Produkt braucht einen Namen“, „Dieses Feld darf nicht leer sein“.', g: 'Ohne diese Angabe würde auf der Website eine Lücke entstehen.', d: 'Das genannte Feld ausfüllen. Soll etwas verschwinden: ausblenden (Auge) statt leeren.' },
  { id: 'doppelt', t: 'Zwei Einträge heißen gleich', s: 'Meldung „Zwei Gerichte heißen gleich …“.', g: 'Die Karte erkennt Gerichte an ihrem Namen. Zwei gleiche Namen in einer Gruppe würden sich gegenseitig überschreiben.', d: 'Einen der beiden Namen anpassen, zum Beispiel mit Größe oder Beilage („… klein“).' },
  { id: 'zahl-format', t: 'Zahl nicht lesbar', s: 'Meldungen wie „Bitte eine Zahl eintragen“, „Der Preis muss eine Zahl sein“.', g: 'Im Feld steht etwas, das keine Zahl ist, oder eine Kommazahl, wo eine ganze Zahl gebraucht wird.', d: 'Nur die Zahl eintragen, zum Beispiel 36 oder 36,50. Ohne Euro-Zeichen, ohne Text.' },
  { id: 'link-format', t: 'Link nicht gültig', s: 'Meldung „Der Link muss mit https:// beginnen“.', g: 'Links nach draußen brauchen die volle Adresse.', d: 'Die Adresse im Browser kopieren und komplett einfügen, mit https:// vorne.' },
  { id: 'mail-format', t: 'E-Mail-Adresse nicht gültig', s: 'Meldung „Das ist keine gültige E-Mail-Adresse“.', g: 'Tippfehler, Leerzeichen oder fehlendes @.', d: 'Adresse prüfen: name@beispiel.de, ohne Leerzeichen.' },
  { id: 'datum', t: 'Datum fehlt', s: 'Meldung „Bitte ein Datum wählen“.', g: 'Beim Hinweis für Gäste ist „von“ oder „bis“ angefangen, aber kein Datum gewählt.', d: 'Datum über den Kalender wählen oder das Feld ganz leeren.' },
  { id: 'grenze', t: 'Grenze erreicht', s: 'Meldungen wie „Das Menü fasst höchstens zwölf Punkte“, „Mindestens ein Menüpunkt muss sichtbar bleiben“, „Mindestens eine Zahlungsart muss aktiv bleiben“.', g: 'Sonst bricht die Website: zu volles Menü, leeres Menü, Kasse ohne Bezahlweg.', d: 'Erst einen anderen Punkt herausnehmen bzw. einen anderen einschalten.' },
  { id: 'produkt-loeschen', t: 'Produkt lässt sich nicht löschen', s: 'Meldung „Nur selbst angelegte Produkte lassen sich löschen“.', g: 'Die Produkte, die von Anfang an im Shop stehen, gehören zum Grundgerüst.', d: 'Ausblenden (Sichtbarkeit) statt löschen.' },
  { id: 'datei-gross', t: 'Datei zu groß', s: 'Meldung „… ist größer als … MB“ oder „Zu groß“.', g: 'Fotos bis 30 MB, Logos bis 8 MB, PDFs bis 25 MB. Online liegt die Grenze schon bei etwa 4 MB.', d: 'Foto kleiner exportieren (lange Seite 3000 Pixel reicht), PDF verkleinern.' },
  { id: 'datei-art', t: 'Dateiart passt nicht', s: 'Meldungen wie „Die Datei ist kein Bild, das wir lesen können“, „Die Datei ist keine PDF“.', g: 'Erlaubt sind JPG, PNG und WebP für Fotos und Logos, PDF für Karten. HEIC (iPhone) geht nicht direkt.', d: 'Am iPhone: Kamera → Formate → „Maximale Kompatibilität“, oder das Foto vorher als JPG sichern.' },
  { id: 'formular', t: 'Formular der Website abgewiesen', s: 'Gäste bekommen „Zu viele Einsendungen“ oder „Leeres Formular“.', g: 'Schutz gegen Spam: höchstens 20 Einsendungen in zehn Minuten vom selben Anschluss, leere Formulare werden nicht angenommen.', d: 'Nichts zu tun. Gäste können es nach ein paar Minuten noch einmal schicken.' },
  { id: 'eingang-kaputt', t: 'Einsendung unlesbar', s: 'Die Prüfung meldet unlesbare Einsendungen.', g: 'Eine Datei im Ordner eingang/ ist beschädigt.', d: 'Robert Bescheid geben, die Datei lässt sich von Hand öffnen.' },
  { id: 'weiterleitung', t: 'Weiterleitung gescheitert', s: 'Im Eingang steht bei einer Einsendung „Weiterleitung: Fehler“.', g: 'Der Dienst, an den Einsendungen weitergehen (zum Beispiel Zapier oder Make), war nicht erreichbar oder hat abgelehnt. Adressen im eigenen Netz sind aus Sicherheitsgründen gesperrt.', d: 'Die Einsendung liegt trotzdem im Eingang. Adresse unter „Eingang → Weiterleitung“ prüfen.' },
  // Probe online
  { id: 'probe-grenze', t: 'In der Probe nicht möglich', s: 'Meldung „In der Probe-Fassung lassen sich keine eigenen Fotos hochladen“ oder „hat kein Passwort“.', g: 'Die Probe zeigt das Studio zum Ausprobieren. Sie hebt nichts dauerhaft auf, deshalb gehen Uploads und Passwort dort nicht.', d: 'Alles andere ausprobieren. Im echten Studio geht beides.' },
  { id: 'probe-voll', t: 'Die Probe ist voll', s: 'Meldung „Die Probe ist voll“, die Änderung ist zurückgenommen.', g: 'Die Probe speichert euren Entwurf im Browser (in Cookies). Dort ist nur begrenzt Platz.', d: 'Veröffentlichen (dann wird Platz frei) oder ein paar Änderungen zurücknehmen. Ganz neu anfangen: Reparatur „Probe neu beginnen“.', rep: 'kekse' },
  { id: 'kekse-gross', t: 'Probe-Speicher fast voll', s: 'Die Seite lädt online gar nicht mehr (Fehler 494 oder 431), oder die Prüfung meldet den Speicher fast voll.', g: 'Ist der Entwurf im Browser zu groß, weist der Dienst jede Anfrage ab, bevor das Studio sie sieht.', d: 'Reparatur „Probe neu beginnen“ (löscht nur eure Probe, nichts an der echten Website).', rep: 'kekse' },
  // Server und Technik
  { id: 'serverfehler', t: 'Unerwarteter Fehler', s: 'Meldung „Im Studio ist ein unerwarteter Fehler aufgetreten“.', g: 'Etwas, mit dem das Studio nicht gerechnet hat. Der genaue Ablauf steht im Fehlerprotokoll.', d: 'Prüfung laufen lassen, „Bericht kopieren“ und an Robert schicken. Oft hilft vorher „Neu bauen“.', rep: 'neubau' },
  { id: 'quelle-fehlt', t: 'Bauteile fehlen', s: 'Die Prüfung meldet fehlende Dateien des Studios.', g: 'Beim Kopieren oder Aufräumen ist ein Teil des Studios verloren gegangen.', d: 'Robert Bescheid geben. Die fehlenden Dateien liegen in seiner Sicherung.' },
  { id: 'studio-datei', t: 'Oberfläche lädt nicht vollständig', s: 'Das Studio ist ungestaltet, leer oder Knöpfe fehlen.', g: 'Eine Datei der Oberfläche (Skript, Gestaltung, Schrift) wurde nicht geladen.', d: 'Reparatur „Studio frisch laden“. Bleibt es so: die Prüfung zeigt, welche Datei fehlt.', rep: 'neu-laden' },
  { id: 'oberflaeche-fehler', t: 'Fehler in der Oberfläche', s: 'Ein Knopf tut nichts, eine Ansicht bleibt leer. Die Prüfung listet „Fehler der Oberfläche“.', g: 'Das Studio im Browser ist über etwas gestolpert. Es schreibt das mit, damit es sich nachvollziehen lässt.', d: 'Studio frisch laden. Taucht derselbe Fehler wieder auf: Bericht kopieren und an Robert schicken.', rep: 'neu-laden' },
  { id: 'python-alt', t: 'Python zu alt', s: 'Das Studio startet nicht oder bricht ab.', g: 'Das Studio braucht Python 3.9 oder neuer.', d: 'Python aktualisieren (python.org).' },
  { id: 'pillow-fehlt', t: 'Bildbearbeitung fehlt', s: 'Fotos lassen sich nicht hochladen, alles andere geht.', g: 'Die Bibliothek Pillow ist nicht installiert.', d: 'Im Terminal: python3 -m pip install Pillow, dann das Studio neu starten.' },
  { id: 'protokoll', t: 'Einträge im Fehlerprotokoll', s: 'Die Prüfung meldet Fehler der letzten 24 Stunden.', g: 'Das Studio schreibt jeden unerwarteten Fehler und jede Reparatur mit Zeit ins Protokoll.', d: 'Einträge ansehen (unten, „Fehlerprotokoll“). Ist alles wieder gut: Reparatur „Protokoll leeren“.', rep: 'protokoll-leeren' },
  { id: 'werkbank-datei', t: 'Datei der Werkbank fehlt', s: 'In der Werkbank fehlt ein Bild oder Film, oder ein Link führt ins Leere.', g: 'Die Datei ist beim letzten Hochladen nicht mitgekommen oder wurde umbenannt.', d: 'Robert Bescheid geben (Bericht kopieren), die Prüfung nennt die genaue Adresse.' },
  { id: 'seite-fehlt', t: 'Seite der Website fehlt', s: 'Eine Seite zeigt „Nicht gefunden“.', g: 'Die Seite wurde nicht gebaut oder gelöscht.', d: 'Am Rechner: Reparatur „Website neu bauen“. Online: Bericht an Robert.', rep: 'website-neu' },
  { id: 'anker', t: 'Sprungmarke fehlt', s: 'Ein Link innerhalb einer Seite springt nirgendwohin.', g: 'Der Abschnitt, auf den der Link zeigt, wurde umbenannt.', d: 'Robert Bescheid geben, die Prüfung nennt den Link.' },
  { id: 'unbekannt', t: 'Unbekannter Fehler', s: 'Eine Meldung, die in diesem Lexikon nicht steht.', g: 'Neu oder sehr selten.', d: 'Bericht kopieren und an Robert schicken. Er ergänzt das Lexikon.' }
];
var LEX = {};
LEXIKON.forEach(function (e) { LEX[e.id] = e; });

// ------------------------------------------------------------------ Reparaturen
var REP = {
  'neu-laden': { t: 'Studio frisch laden', d: 'Lädt das Studio ohne Zwischenspeicher neu. Ändert nichts an Inhalten.', hier: true },
  'neubau': { t: 'Neu bauen', d: 'Baut Entwurf und Vergleich aus dem gespeicherten Stand neu. Ändert nichts an Inhalten.' },
  'website-neu': { t: 'Website neu bauen', d: 'Baut die veröffentlichte Website aus dem zuletzt veröffentlichten Stand neu.' },
  'sicherung-zurueck': { t: 'Entwurf: Sicherung zurückholen', d: 'Ist der Entwurf beschädigt, kommt die letzte gute Fassung zurück. Ist er in Ordnung, geht er einen Speicherschritt zurück. Die ersetzte Fassung bleibt als Kopie.' },
  'stand-sicherung-zurueck': { t: 'Veröffentlichter Stand: Sicherung zurückholen', d: 'Holt die letzte gute Fassung des veröffentlichten Standes zurück und baut die Website daraus.' },
  'aufraeumen': { t: 'Texte ohne Stelle entfernen', d: 'Nimmt geänderte Texte aus dem Entwurf, die auf der Seite nirgends mehr stehen.' },
  'entwurf-leeren': { t: 'Entwurf verwerfen', d: 'Alle noch nicht veröffentlichten Änderungen zurücknehmen. Die Website bleibt, wie sie ist.' },
  'abmelden-alle': { t: 'Alle abmelden', d: 'Beendet jede Anmeldung, auf allen Geräten.' },
  'protokoll-leeren': { t: 'Protokoll leeren', d: 'Löscht das Fehlerprotokoll des Servers.' },
  'bilder-aufraeumen': { t: 'Übrige Uploads löschen', d: 'Löscht hochgeladene Fotos und Logos, die weder der Entwurf noch ein veröffentlichter Stand braucht.' },
  'kekse': { t: 'Probe neu beginnen', d: 'Löscht euren Probe-Entwurf in diesem Browser und beginnt mit dem Ausgangsstand. Die echte Website bleibt unberührt.', hier: true },
  'oberflaeche-leeren': { t: 'Mitschrift der Oberfläche leeren', d: 'Löscht die Liste der Fehler, die das Studio in diesem Browser mitgeschrieben hat.', hier: true }
};

// ------------------------------------------------------------------ Werkzeug
var $ = function (s, r) { return (r || document).querySelector(s); };
function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var FEHLERLOG = 'sus_studio_fehler';
var ZEITLIMIT = 15000;
var ergebnis = { hier: [], server: [], seite: [], start: 0, ende: 0, server_roh: null };
var laeuft = false;

function geh(url, opt) {
  opt = opt || {};
  var t0 = Date.now(), ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, opt.zeit || ZEITLIMIT);
  var init = { method: opt.method || 'GET', cache: 'no-store', credentials: 'same-origin', redirect: opt.redirect || 'follow' };
  if (ctrl) init.signal = ctrl.signal;
  if (opt.body !== undefined) { init.body = JSON.stringify(opt.body); init.headers = { 'Content-Type': 'application/json', 'X-Studio': '1' }; }
  return fetch(url, init).then(function (r) {
    clearTimeout(timer);
    var aus = { ok: r.ok, status: r.status, ms: Date.now() - t0, typ: r.headers.get('content-type') || '', datum: r.headers.get('date'), r: r, umgeleitet: r.redirected };
    if (opt.lesen === 'json') return r.json().then(function (j) { aus.json = j; return aus; }, function () { aus.json = null; return aus; });
    if (opt.lesen === 'text') return r.text().then(function (t) { aus.text = t; return aus; }, function () { aus.text = ''; return aus; });
    return aus;
  }, function (e) {
    clearTimeout(timer);
    return { ok: false, status: 0, ms: Date.now() - t0, err: e && e.name === 'AbortError' ? 'Zeitüberschreitung nach ' + Math.round((opt.zeit || ZEITLIMIT) / 1000) + ' s' : 'keine Verbindung' };
  });
}
function punkt(id, titel, stufe, text, lex, rep, liste) { return { id: id, titel: titel, stufe: stufe, text: text, lex: lex || '', rep: rep || '', liste: liste || null }; }
function lsLies(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
function lsWeg(k) { try { localStorage.removeItem(k); } catch (e) {} }
function meldung(t) {
  var d = document.createElement('div');
  d.className = 'meldung';
  d.setAttribute('role', 'status');
  d.textContent = t;
  document.body.appendChild(d);
  setTimeout(function () { d.remove(); }, 3600);
}

// ------------------------------------------------------------------ Prüfpunkte von hier aus
function pruefeHier() {
  var aus = [];
  var fehlt = [];
  if (typeof fetch !== 'function') fehlt.push('fetch');
  if (typeof Promise !== 'function') fehlt.push('Promise');
  if (typeof AbortController !== 'function') fehlt.push('AbortController');
  if (!(window.CSS && CSS.supports && CSS.supports('display', 'grid'))) fehlt.push('CSS Grid');
  if (typeof URLSearchParams !== 'function') fehlt.push('URLSearchParams');
  aus.push(fehlt.length ? punkt('browser', 'Browser', 'fehler', 'Es fehlt: ' + fehlt.join(', ') + '.', 'browser-alt')
    : punkt('browser', 'Browser', 'ok', (navigator.userAgent.match(/(Edg|Firefox|Chrome|Safari)\/[\d.]+/) || ['aktuell'])[0].replace('/', ' ') + ', kann alles, was das Studio braucht.'));
  aus.push(location.protocol === 'file:' ? punkt('adresse', 'Adresse', 'fehler', 'Die Seite ist als Datei geöffnet.', 'datei-geoeffnet')
    : punkt('adresse', 'Adresse', 'ok', location.host + ' (' + (location.protocol === 'https:' ? 'verschlüsselt' : 'am eigenen Rechner') + ')'));
  aus.push(navigator.onLine === false ? punkt('netz', 'Internet', 'fehler', 'Dieses Gerät ist offline.', 'offline') : punkt('netz', 'Internet', 'ok', 'Verbunden.'));
  aus.push(navigator.cookieEnabled === false ? punkt('kekse-an', 'Cookies', 'fehler', 'Cookies sind für diese Seite abgeschaltet.', 'kekse-aus') : punkt('kekse-an', 'Cookies', 'ok', 'Erlaubt.'));
  var lsOk = true;
  try { localStorage.setItem('sus_test', '1'); localStorage.removeItem('sus_test'); } catch (e) { lsOk = false; }
  aus.push(lsOk ? punkt('speicher', 'Browser-Speicher', 'ok', 'Verfügbar.') : punkt('speicher', 'Browser-Speicher', 'hinweis', 'Gesperrt (privates Fenster?).', 'speicher-aus'));
  var log = (lsLies(FEHLERLOG) || []).filter(function (x) { return x && x.zeit && Date.now() - new Date(x.zeit).getTime() < 7 * 864e5; });
  aus.push(log.length ? punkt('oberflaeche', 'Fehler der Oberfläche', 'hinweis', log.length + ' in den letzten sieben Tagen mitgeschrieben (Liste unten).', 'oberflaeche-fehler', 'oberflaeche-leeren')
    : punkt('oberflaeche', 'Fehler der Oberfläche', 'ok', 'Keine mitgeschrieben.'));
  return aus;
}

// ------------------------------------------------------------------ Studio und Server
function pruefeStudio(zeig) {
  var aus = [];
  return geh('/studio/api/status', { lesen: 'json' }).then(function (st) {
    var probe = !!(st.json && st.json.probe);
    ergebnis.probe = probe;
    if (st.status === 494 || st.status === 431) {
      aus.push(punkt('status', 'Studio erreichbar', 'fehler', 'Der Dienst weist jede Anfrage ab (Fehler ' + st.status + '): der Speicher der Probe im Browser ist zu groß.', 'kekse-gross', 'kekse'));
      return aus;
    }
    if (!st.ok || !st.json) {
      aus.push(punkt('status', 'Studio erreichbar', 'fehler', st.err ? 'Keine Antwort (' + st.err + ').' : 'Antwort ' + st.status + ' statt der erwarteten Auskunft.', st.err === 'keine Verbindung' && navigator.onLine === false ? 'offline' : 'server-aus'));
      return aus;
    }
    aus.push(punkt('status', 'Studio erreichbar', st.ms > 8000 ? 'hinweis' : 'ok', 'Antwort in ' + st.ms + ' ms' + (probe ? ' (Probe-Fassung online).' : '.') + (st.json.version ? ' Fassung ' + st.json.version + '.' : ''), st.ms > 8000 ? 'langsam' : ''));
    if (st.datum) {
      var ab = Math.abs(new Date(st.datum).getTime() - Date.now());
      aus.push(ab > 5 * 60000 ? punkt('uhr', 'Uhrzeit', 'hinweis', 'Dieses Gerät und der Server liegen ' + Math.round(ab / 60000) + ' Minuten auseinander.', 'uhr') : punkt('uhr', 'Uhrzeit', 'ok', 'Gerät und Server stimmen überein.'));
    }
    var angemeldet = !!st.json.angemeldet;
    zeig(aus);
    var dateien = ['/studio/index.html', '/studio/studio.js', '/studio/studio.css', '/assets/fonts/fonts.css', '/assets/logo/wortmarke.svg', '/assets/logo/emblem.png', '/assets/img/hero-l.webp'];
    return Promise.all(dateien.map(function (u) { return geh(u, { method: 'HEAD' }).then(function (r) { return { u: u, r: r }; }); })).then(function (rs) {
      var weg = rs.filter(function (x) { return !x.r.ok; });
      var falsch = rs.filter(function (x) { return x.r.ok && /\.js$/.test(x.u) && !/javascript/.test(x.r.typ); });
      aus.push(weg.length || falsch.length ? punkt('dateien', 'Dateien der Oberfläche', 'fehler', (weg.length + falsch.length) + ' von ' + dateien.length + ' laden nicht richtig.', 'studio-datei', 'neu-laden',
        weg.map(function (x) { return x.u + ' → ' + (x.r.status || x.r.err); }).concat(falsch.map(function (x) { return x.u + ' → falscher Typ ' + x.r.typ; })))
        : punkt('dateien', 'Dateien der Oberfläche', 'ok', 'Alle ' + dateien.length + ' laden.'));
      zeig(aus);
      if (!angemeldet) {
        aus.push(punkt('stand', 'Inhalte laden', 'hinweis', 'Nicht angemeldet: Inhalte und Vorschau prüft die Prüfung erst nach der Anmeldung im Studio.', 'anmeldung'));
        return aus;
      }
      return geh('/studio/api/stand', { lesen: 'json', zeit: 60000 }).then(function (s) {
        var j = s.json;
        if (!s.ok) {
          aus.push(punkt('stand', 'Inhalte laden', 'fehler', (j && j.fehler) || ('Antwort ' + (s.status || s.err) + '.'), (j && j.lex) || (s.status === 401 ? 'anmeldung' : 'server-aus')));
        } else {
          var noetig = ['seiten', 'felder', 'karte', 'shop', 'bilder', 'aenderungen', 'verlauf', 'listen', 'nav', 'hinweis', 'shopregeln', 'seo', 'eingang'];
          var fehlt = noetig.filter(function (k) { return !j || j[k] === undefined; });
          var leer = j && (!j.seiten || !j.seiten.length || !Object.keys(j.felder || {}).length);
          if (fehlt.length) aus.push(punkt('stand', 'Inhalte laden', 'fehler', 'Antwort unvollständig, es fehlt: ' + fehlt.join(', ') + '.', 'anfrage', 'neu-laden'));
          else if (leer) aus.push(punkt('stand', 'Inhalte laden', 'fehler', 'Inhalte sind leer: der Entwurf ist nicht gebaut.' + (j.fehler ? ' ' + j.fehler : ''), 'entwurf-fehlt', 'neubau'));
          else if (j.fehler) aus.push(punkt('stand', 'Inhalte laden', 'fehler', j.fehler, 'bau-fehler', 'neubau'));
          else aus.push(punkt('stand', 'Inhalte laden', s.ms > 8000 ? 'hinweis' : 'ok', j.seiten.length + ' Seiten, ' + Object.keys(j.karte).length + ' Kartengruppen, ' + Object.keys(j.shop).length + ' Produkte, ' + j.aenderungen.length + ' offene Änderung(en). ' + s.ms + ' ms.', s.ms > 8000 ? 'langsam' : ''));
        }
        zeig(aus);
        return Promise.all(['/entwurf/index.html', '/vorher/index.html'].map(function (u) { return geh(u, { method: 'GET', zeit: 60000 }); }));
      }).then(function (rs) {
        if (!rs) return aus;
        var namen = ['Vorschau (Entwurf)', 'Vergleich (vorher)'];
        rs.forEach(function (r, i) {
          var id = i ? 'vorher' : 'entwurf-seite';
          if (r.ok && /html/.test(r.typ)) aus.push(punkt(id, namen[i], 'ok', 'Lädt in ' + r.ms + ' ms.'));
          else aus.push(punkt(id, namen[i], 'fehler', 'Antwort ' + (r.status || r.err) + '.', r.status === 403 ? 'anmeldung' : 'entwurf-fehlt', r.status === 403 ? '' : 'neubau'));
        });
        if (probe) {
          return geh('/live/index.html', { method: 'GET', redirect: 'follow' }).then(function (r) {
            aus.push(r.ok ? punkt('live-probe', '„Website ansehen“ in der Probe', 'ok', r.umgeleitet ? 'Zeigt die echte Online-Seite (noch nichts veröffentlicht).' : 'Zeigt euren veröffentlichten Probe-Stand.')
              : punkt('live-probe', '„Website ansehen“ in der Probe', 'fehler', 'Antwort ' + (r.status || r.err) + '.', 'live-fehlt'));
            return aus;
          });
        }
        return aus;
      });
    });
  });
}

function pruefeServer() {
  return geh('/studio/api/pruefung', { lesen: 'json', zeit: 60000 }).then(function (r) {
    if (r.status === 494 || r.status === 431) return [punkt('server', 'Prüfung vom Server', 'fehler', 'Nicht erreichbar, der Probe-Speicher im Browser ist zu groß.', 'kekse-gross', 'kekse')];
    if (!r.ok || !r.json || !r.json.punkte) {
      return [punkt('server', 'Prüfung vom Server', 'fehler', r.err ? 'Keine Antwort (' + r.err + '). Die Punkte von hier aus gelten trotzdem.' : 'Antwort ' + r.status + '. Die Punkte von hier aus gelten trotzdem.', 'server-aus')];
    }
    ergebnis.server_roh = r.json;
    if (r.json.ms) {
      var ab = Math.abs(r.json.ms - Date.now());
      if (ab > 5 * 60000) r.json.punkte.push(punkt('uhr-server', 'Uhr des Servers', 'hinweis', 'Weicht ' + Math.round(ab / 60000) + ' Minuten von diesem Gerät ab.', 'uhr'));
    }
    return r.json.punkte;
  });
}

// ------------------------------------------------------------------ Website und Werkbank
var SEITEN = ['/index.html', '/restaurants.html', '/karte.html', '/hamburg.html', '/crudo.html', '/am-meer.html', '/ueber.html', '/kontakt.html', '/shop.html', '/warenkorb.html', '/kasse.html', '/jobs.html', '/presse.html', '/impressum.html', '/datenschutz.html', '/agb.html', '/en/index.html'];
var BEIGABEN = [['/werkbank/', 'Werkbank'], ['/werkbank/anleitung/', 'Anleitung'], ['/karten/index.html', 'Karten'], ['/sticker/index.html', 'Sticker'], ['/drucksachen/index.html', 'Drucksachen']];

function parallel(liste, n, f) {
  var i = 0, aus = new Array(liste.length);
  function weiter() {
    if (i >= liste.length) return Promise.resolve();
    var k = i++;
    return f(liste[k]).then(function (r) { aus[k] = r; return weiter(); });
  }
  var w = [];
  for (var j = 0; j < Math.min(n, liste.length); j++) w.push(weiter());
  return Promise.all(w).then(function () { return aus; });
}

function verweise(html, basis) {
  var doc = new DOMParser().parseFromString(html, 'text/html'), adr = {}, anker = [];
  var ids = {};
  Array.prototype.forEach.call(doc.querySelectorAll('[id]'), function (el) { ids[el.id] = 1; });
  Array.prototype.forEach.call(doc.querySelectorAll('[src],[href],[poster],[srcset],[data-src]'), function (el) {
    ['src', 'href', 'poster', 'data-src'].forEach(function (a) {
      var v = el.getAttribute(a);
      if (!v) return;
      if (v.charAt(0) === '#') {
        var ziel = v.slice(1);
        try { ziel = decodeURIComponent(ziel); } catch (e) { /* kaputt kodierte Marke: so prüfen, wie sie dasteht */ }
        if (ziel && !ids[ziel]) anker.push(v);
        return;
      }
      if (/^(mailto:|tel:|javascript:|data:|blob:)/i.test(v)) return;
      try { var u = new URL(v, basis); if (u.origin === location.origin) { u.hash = ''; adr[u.href] = 1; } } catch (e) {}
    });
    var ss = el.getAttribute('srcset');
    if (ss) ss.split(',').forEach(function (teil) {
      var v = teil.trim().split(/\s+/)[0];
      try { var u = new URL(v, basis); if (u.origin === location.origin) adr[u.href] = 1; } catch (e) {}
    });
  });
  return { adr: Object.keys(adr), anker: anker };
}

function pruefeSeite(zeig) {
  var aus = [];
  return parallel(SEITEN, 6, function (u) { return geh(u, { method: 'HEAD' }).then(function (r) { return { u: u, r: r }; }); }).then(function (rs) {
    var weg = rs.filter(function (x) { return !x.r.ok; });
    aus.push(weg.length ? punkt('website', 'Website', 'fehler', weg.length + ' von ' + SEITEN.length + ' Seiten laden nicht.', 'seite-fehlt', ergebnis.probe ? '' : 'website-neu', weg.map(function (x) { return x.u + ' → ' + (x.r.status || x.r.err); }))
      : punkt('website', 'Website', 'ok', 'Alle ' + SEITEN.length + ' Hauptseiten laden.'));
    zeig(aus);
    return parallel(BEIGABEN, 1, function (b) {
      return geh(b[0], { lesen: 'text' }).then(function (r) {
        if (!r.ok) { aus.push(punkt('b-' + b[1], b[1], 'fehler', 'Die Seite selbst lädt nicht (' + (r.status || r.err) + ').', 'werkbank-datei')); zeig(aus); return; }
        var v = verweise(r.text, new URL(b[0], location.href).href);
        return parallel(v.adr, 8, function (u) {
          return geh(u, { method: 'HEAD' }).then(function (x) { return x.status === 405 || x.status === 501 ? geh(u, { method: 'GET' }) : x; }).then(function (x) { return { u: u, r: x }; });
        }).then(function (rs2) {
          var kaputt = rs2.filter(function (x) { return !x.r.ok; });
          var liste = kaputt.map(function (x) { return x.u.replace(location.origin, '') + ' → ' + (x.r.status || x.r.err); }).concat(v.anker.map(function (a) { return 'Sprungmarke ' + a + ' fehlt'; }));
          aus.push(liste.length ? punkt('b-' + b[1], b[1], 'fehler', liste.length + ' von ' + (v.adr.length + v.anker.length) + ' Verweisen gehen ins Leere.', kaputt.length ? 'werkbank-datei' : 'anker', '', liste)
            : punkt('b-' + b[1], b[1], 'ok', 'Seite und alle ' + v.adr.length + ' Dateien und Verweise laden' + (v.anker.length ? '' : ', jede Sprungmarke trifft') + '.'));
          zeig(aus);
        });
      });
    }).then(function () { return aus; });
  });
}

// ------------------------------------------------------------------ Darstellung
var STUFE = { ok: 'In Ordnung', hinweis: 'Hinweis', fehler: 'Fehler', laeuft: 'Läuft' };
function zeile(p) {
  var lex = p.lex && LEX[p.lex] ? '<a href="#lex-' + h(p.lex) + '" data-lex="' + h(p.lex) + '">Was tun?</a>' : '';
  var rep = p.rep && REP[p.rep] && verfuegbar(p.rep) ? '<button type="button" data-rep="' + h(p.rep) + '">' + h(REP[p.rep].t) + '</button>' : '';
  return '<li class="punkt s-' + h(p.stufe) + '"><span class="punkt__d" role="img" aria-label="' + h(STUFE[p.stufe] || p.stufe) + '"></span>' +
    '<span class="punkt__t">' + h(p.titel) + '</span><span class="punkt__a">' + lex + rep + '</span><span class="punkt__x">' + h(p.text) + '</span>' +
    (p.liste && p.liste.length ? '<ul class="punkt__liste">' + p.liste.slice(0, 60).map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + (p.liste.length > 60 ? '<li>… und ' + (p.liste.length - 60) + ' weitere</li>' : '') + '</ul>' : '') + '</li>';
}
function verfuegbar(rep) {
  if (REP[rep] && REP[rep].hier) return rep !== 'kekse' || ergebnis.probe;
  var s = ergebnis.server_roh;
  if (!s) return false;
  if (rep === 'website-neu') return !s.probe;
  return (s.reparaturen || []).indexOf(rep) >= 0;
}
function block(id, titel, text, punkte) {
  var el = $('#' + id);
  if (!el) {
    el = document.createElement('section');
    el.className = 'blatt';
    el.id = id;
    $('#inhalt').appendChild(el);
  }
  el.innerHTML = '<h2>' + titel + '</h2>' + (text ? '<p>' + text + '</p>' : '') + '<ul class="punkte">' + (punkte.length ? punkte.map(zeile).join('') : zeile(punkt('x', 'Wird geprüft …', 'laeuft', ''))) + '</ul>';
}
function ampel() {
  var alle = ergebnis.hier.concat(ergebnis.studio, ergebnis.server, ergebnis.seite);
  var f = alle.filter(function (p) { return p.stufe === 'fehler'; }).length, w = alle.filter(function (p) { return p.stufe === 'hinweis'; }).length;
  var stufe = laeuft ? 'laeuft' : f ? 'fehler' : w ? 'hinweis' : 'ok';
  var titel = laeuft ? 'Prüft …' : f ? (f === 1 ? 'Ein Fehler' : f + ' Fehler') : w ? (w === 1 ? 'Ein Hinweis' : w + ' Hinweise') : 'Alles in Ordnung';
  var text = laeuft ? alle.length + ' Punkte bisher geprüft.' : f ? 'Bei jedem roten Punkt steht, was zu tun ist. Wo es geht, mit Knopf zur Reparatur.' : w ? 'Nichts kaputt. Die gelben Punkte sind zum Wissen, nicht zum Handeln.' : alle.length + ' Punkte geprüft, ' + Math.round((ergebnis.ende - ergebnis.start) / 100) / 10 + ' Sekunden.';
  $('#ampel').innerHTML = '<span class="ampel__licht s-' + stufe + '" role="img" aria-label="' + h(STUFE[stufe]) + '"></span><h2 class="ampel__titel">' + h(titel) + '</h2><p class="ampel__text">' + h(text) + '</p>' +
    '<div class="ampel__kn"><button class="kn" type="button" data-akt="nochmal"' + (laeuft ? ' disabled' : '') + '>Noch einmal prüfen</button>' +
    '<button class="kn kn--linie" type="button" data-akt="bericht"' + (laeuft ? ' disabled' : '') + '>Bericht kopieren</button><a class="kn kn--linie" href="./">Zum Studio</a></div>';
}

function reparaturenBlock() {
  var ids = Object.keys(REP).filter(verfuegbar);
  var el = $('#reparaturen') || document.createElement('section');
  el.className = 'blatt';
  el.id = 'reparaturen';
  el.innerHTML = '<h2>Reparaturen<em>.</em></h2><p>Jede Reparatur fragt einmal nach: erst klicken, dann noch einmal zum Bestätigen. Was sie ändert, steht im Protokoll.' +
    (ergebnis.server_roh ? '' : ' Der Server antwortet gerade nicht, deshalb stehen hier nur die Reparaturen, die dieser Browser selbst kann.') + '</p>' +
    ids.map(function (id) { return '<div class="rep" data-id="' + id + '"><div><b>' + h(REP[id].t) + '</b><span>' + h(REP[id].d) + '</span></div><button class="kn kn--linie" type="button" data-rep="' + id + '">Ausführen</button><div class="rep__erg" hidden></div></div>'; }).join('');
  if (!el.parentNode) $('#inhalt').appendChild(el);
}

function protokollBlock() {
  var log = (lsLies(FEHLERLOG) || []).slice().reverse();
  var srv = ergebnis.server_roh && ergebnis.server_roh.protokoll;
  var el = $('#protokoll') || document.createElement('section');
  el.className = 'blatt';
  el.id = 'protokoll';
  var teile = '<h2>Fehlerprotokoll<em>.</em></h2>';
  teile += '<p>Was der Server mitgeschrieben hat' + (srv === null ? ' (sichtbar nach der Anmeldung im Studio)' : '') + ' und was die Oberfläche in diesem Browser mitgeschrieben hat.</p>';
  var srvL = (srv || []).slice(0, 40), liL = log.slice(0, 40);
  teile += srvL.length ? '<ul class="prot">' + srvL.map(function (x) { return '<li><time>' + h(datum(x.zeit)) + '</time><div><b>' + h(x.art === 'reparatur' ? 'Reparatur' : 'Server') + '</b> · ' + h(x.text) + (x.lex && LEX[x.lex] && x.art === 'fehler' ? ' <a href="#lex-' + h(x.lex) + '" data-lex="' + h(x.lex) + '">Was tun?</a>' : '') + '</div>' + (x.extra ? '<pre>' + h(x.extra) + '</pre>' : '') + '</li>'; }).join('') + '</ul>' : '';
  teile += liL.length ? '<ul class="prot">' + liL.map(function (x) { return '<li><time>' + h(datum(x.zeit)) + '</time><div><b>Oberfläche</b> · ' + h(x.text) + (x.lex && LEX[x.lex] ? ' <a href="#lex-' + h(x.lex) + '" data-lex="' + h(x.lex) + '">Was tun?</a>' : '') + '</div>' + (x.wo ? '<pre>' + h(x.wo) + '</pre>' : '') + '</li>'; }).join('') + '</ul>' : '';
  if (!srvL.length && !liL.length) teile += '<p>Keine Einträge.</p>';
  el.innerHTML = teile;
  if (!el.parentNode) $('#inhalt').appendChild(el);
}
function datum(z) {
  var d = new Date(z);
  return isNaN(d) ? '' : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function lexikonBlock() {
  var el = $('#lexikon') || document.createElement('section');
  el.className = 'blatt lex';
  el.id = 'lexikon';
  el.innerHTML = '<h2>Lexikon<em>.</em></h2><p>Jede bekannte Fehlerquelle des Studios: woran man sie erkennt, woher sie kommt, was hilft. Funktioniert auch ohne Verbindung.</p>' +
    '<input class="lex__suche" type="search" placeholder="Suchen, zum Beispiel: Passwort, Bild, langsam" aria-label="Lexikon durchsuchen">' +
    LEXIKON.map(function (e) {
      return '<details id="lex-' + e.id + '" data-text="' + h((e.t + ' ' + e.s + ' ' + e.g + ' ' + e.d).toLowerCase()) + '"><summary>' + h(e.t) + '<small>' + h(e.id) + '</small></summary><dl>' +
        '<dt>Sehen</dt><dd>' + h(e.s) + '</dd><dt>Grund</dt><dd>' + h(e.g) + '</dd><dt>Tun</dt><dd>' + h(e.d) + (e.rep && REP[e.rep] ? ' <button type="button" class="kn kn--linie" data-rep="' + e.rep + '" style="min-height:34px;margin-top:8px">' + h(REP[e.rep].t) + '</button>' : '') + '</dd></dl></details>';
    }).join('');
  if (!el.parentNode) $('#inhalt').appendChild(el);
  $('.lex__suche', el).addEventListener('input', function (ev) {
    var q = ev.target.value.trim().toLowerCase();
    Array.prototype.forEach.call(el.querySelectorAll('details'), function (d) { d.hidden = q && d.getAttribute('data-text').indexOf(q) < 0; });
  });
}
function oeffneLex(id) {
  var d = document.getElementById('lex-' + id);
  if (!d) return;
  Array.prototype.forEach.call(document.querySelectorAll('.lex details.ziel'), function (x) { x.classList.remove('ziel'); });
  d.hidden = false;
  d.open = true;
  d.classList.add('ziel');
  d.scrollIntoView({ block: 'start' });
}

// ------------------------------------------------------------------ Bericht
function berichtText() {
  var z = [];
  z.push('Prüfung Studio Salt & Silver · ' + datum(new Date()) + ' · ' + location.host + (ergebnis.probe ? ' (Probe)' : ''));
  z.push('Browser: ' + navigator.userAgent);
  if (ergebnis.server_roh) z.push('Fassung Server: ' + ergebnis.server_roh.version);
  [['Von hier aus', ergebnis.hier], ['Studio', ergebnis.studio || []], ['Vom Server', ergebnis.server], ['Website & Werkbank', ergebnis.seite]].forEach(function (t) {
    z.push('', '## ' + t[0]);
    t[1].forEach(function (p) {
      z.push((p.stufe === 'ok' ? '[ok]     ' : p.stufe === 'hinweis' ? '[Hinweis]' : '[FEHLER] ') + ' ' + p.titel + ': ' + p.text + (p.lex ? ' (' + p.lex + ')' : ''));
      (p.liste || []).slice(0, 20).forEach(function (x) { z.push('           - ' + x); });
    });
  });
  var log = (lsLies(FEHLERLOG) || []).slice(-10);
  if (log.length) { z.push('', '## Oberfläche (letzte 10)'); log.forEach(function (x) { z.push(x.zeit + ' ' + x.text + (x.wo ? ' | ' + String(x.wo).split('\n')[0] : '')); }); }
  var srv = ergebnis.server_roh && ergebnis.server_roh.protokoll;
  if (srv && srv.length) { z.push('', '## Server-Protokoll (letzte 10)'); srv.slice(0, 10).forEach(function (x) { z.push(x.zeit + ' ' + x.art + ' ' + x.text); }); }
  return z.join('\n');
}
function kopiere(t) {
  function ersatz() {
    var ta = document.createElement('textarea');
    ta.value = t;
    ta.className = 'bericht';
    ta.setAttribute('readonly', '');
    var alt = $('#bericht-feld');
    if (alt) alt.remove();
    ta.id = 'bericht-feld';
    $('#ampel').appendChild(ta);
    ta.focus();
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    meldung(ok ? 'Bericht kopiert. Bitte an robert@tasty-studios.de schicken.' : 'Bericht markiert: mit Cmd/Strg + C kopieren.');
  }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { meldung('Bericht kopiert. Bitte an robert@tasty-studios.de schicken.'); }, ersatz);
  else ersatz();
}

// ------------------------------------------------------------------ Reparieren
var scharf = {};
function reparieren(id, knopf) {
  if (!scharf[id]) {
    scharf[id] = setTimeout(function () { scharf[id] = null; if (knopf.isConnected) { knopf.textContent = knopf.getAttribute('data-alt') || 'Ausführen'; knopf.classList.remove('sicher'); } }, 4000);
    knopf.setAttribute('data-alt', knopf.textContent);
    knopf.textContent = 'Wirklich? Noch einmal';
    knopf.classList.add('sicher');
    return;
  }
  clearTimeout(scharf[id]);
  scharf[id] = null;
  if (!verfuegbar(id)) {  // Knopf aus dem Lexikon, aber hier gerade nicht möglich (Server antwortet nicht, oder gilt nur am Rechner bzw. nur in der Probe)
    knopf.textContent = knopf.getAttribute('data-alt') || 'Ausführen';
    knopf.classList.remove('sicher');
    meldung(ergebnis.server_roh ? 'Diese Reparatur gibt es hier nicht.' : 'Der Server antwortet gerade nicht. Bitte erst „Noch einmal prüfen“.');
    return;
  }
  knopf.disabled = true;
  knopf.textContent = 'Läuft …';
  var erg = knopf.parentNode.querySelector('.rep__erg');
  function fertig(ok, text) {
    knopf.disabled = false;
    knopf.classList.remove('sicher');
    knopf.textContent = knopf.getAttribute('data-alt') || 'Ausführen';
    if (erg) { erg.hidden = false; erg.className = 'rep__erg' + (ok ? '' : ' f'); erg.textContent = text; }
    meldung(text);
  }
  if (id === 'neu-laden') { location.href = '/studio/?frisch=' + Date.now(); return; }
  if (id === 'oberflaeche-leeren') { lsWeg(FEHLERLOG); fertig(true, 'Mitschrift geleert.'); protokollBlock(); return; }
  if (id === 'kekse') {
    // Stand-Kekse auch von hier löschen: geht auch dann, wenn der Dienst wegen zu großer Kekse gar nicht mehr antwortet
    ['sus_zn', 'sus_z0', 'sus_z1', 'sus_z2', 'sus_z3', 'sus_z4', 'sus_z5', 'sus_z6', 'sus_z7'].forEach(function (k) { document.cookie = k + '=; Path=/; Max-Age=0; SameSite=Lax'; });
  }
  geh('/studio/api/reparieren', { method: 'POST', body: { tun: id }, lesen: 'json', zeit: 90000 }).then(function (r) {
    if (r.ok && r.json && r.json.satz) { fertig(true, r.json.satz); setTimeout(starte, 600); }
    else if (id === 'kekse' && (r.status === 494 || r.status === 431 || r.status === 0)) { fertig(true, 'Die Probe beginnt neu.'); setTimeout(starte, 600); }  // der Dienst war wegen der Kekse nicht erreichbar, die sind jetzt weg
    else fertig(false, (r.json && r.json.fehler) || (r.status === 401 ? 'Dafür bitte zuerst im Studio anmelden.' : 'Hat nicht geklappt (' + (r.status || r.err) + ').'));
  });
}

// ------------------------------------------------------------------ Ablauf
function starte() {
  if (laeuft) return;
  laeuft = true;
  ergebnis = { hier: [], studio: [], server: [], seite: [], start: Date.now(), ende: 0, server_roh: null, probe: false };
  var alt = $('#bericht-feld');
  if (alt) alt.remove();
  ampel();
  ergebnis.hier = pruefeHier();
  block('b-hier', 'Von hier aus<em>.</em>', 'Dieser Browser und diese Verbindung.', ergebnis.hier);
  block('b-studio', 'Studio<em>.</em>', 'Ob das Studio antwortet, seine Dateien lädt und die Inhalte liefert.', []);
  block('b-server', 'Vom Server<em>.</em>', 'Was nur der Server selbst sehen kann: gespeicherte Inhalte, Sicherungen, Bau, Protokoll.', []);
  block('b-seite', 'Website und Werkbank<em>.</em>', 'Jede Hauptseite, dazu Werkbank, Anleitung, Karten, Sticker und Drucksachen mit allen Bildern, Filmen und Verweisen.', []);
  if (!$('#lexikon')) lexikonBlock();  // steht schon da: nicht neu aufbauen, sonst klappt ein geöffneter Eintrag wieder zu
  var zeigS = function (p) { ergebnis.studio = p.slice(); block('b-studio', 'Studio<em>.</em>', 'Ob das Studio antwortet, seine Dateien lädt und die Inhalte liefert.', p); ampel(); };
  var zeigW = function (p) { ergebnis.seite = p.slice(); block('b-seite', 'Website und Werkbank<em>.</em>', 'Jede Hauptseite, dazu Werkbank, Anleitung, Karten, Sticker und Drucksachen mit allen Bildern, Filmen und Verweisen.', p); ampel(); };
  function sicher(pr, wo) { return pr.catch(function (e) { return [punkt(wo, 'Prüfung ' + wo, 'fehler', 'Der Prüfschritt selbst ist gescheitert: ' + (e && e.message), 'unbekannt')]; }); }
  sicher(pruefeStudio(zeigS), 'studio').then(function (p) {
    zeigS(p);
    return sicher(pruefeServer(), 'server');
  }).then(function (p) {
    ergebnis.server = p;
    block('b-server', 'Vom Server<em>.</em>', 'Was nur der Server selbst sehen kann: gespeicherte Inhalte, Sicherungen, Bau, Protokoll.', p);
    ampel();
    return sicher(pruefeSeite(zeigW), 'seite');
  }).then(zeigW).catch(function () {}).then(function () {
    laeuft = false;
    ergebnis.ende = Date.now();
    ampel();
    reparaturenBlock();
    protokollBlock();
    $('#inhalt').appendChild($('#lexikon'));  // Reihenfolge: Prüfbereiche, Reparaturen, Protokoll, Lexikon
    if (location.hash.indexOf('#lex-') === 0) oeffneLex(location.hash.slice(5));
  });
}

document.addEventListener('click', function (ev) {
  var t = ev.target;
  var a = t.closest && t.closest('[data-akt]');
  if (a) {
    if (a.getAttribute('data-akt') === 'nochmal') starte();
    if (a.getAttribute('data-akt') === 'bericht') kopiere(berichtText());
    return;
  }
  var r = t.closest && t.closest('[data-rep]');
  if (r) { ev.preventDefault(); reparieren(r.getAttribute('data-rep'), r); return; }
  var l = t.closest && t.closest('[data-lex]');
  if (l) { ev.preventDefault(); history.replaceState(null, '', '#lex-' + l.getAttribute('data-lex')); oeffneLex(l.getAttribute('data-lex')); }
});
addEventListener('hashchange', function () { if (location.hash.indexOf('#lex-') === 0) oeffneLex(location.hash.slice(5)); });

lexikonBlock();
if (location.hash.indexOf('#lex-') === 0) oeffneLex(location.hash.slice(5));
starte();
})();
