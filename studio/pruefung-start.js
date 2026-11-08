/* Zeigt einen Hinweis, falls pruefung.js nicht geladen werden konnte (eigene Datei, weil das Studio keine Skripte im HTML erlaubt). */
if (!window.PRUEFUNG_GELADEN) { var x = document.getElementById('ohne-js'); if (x) x.hidden = false; var a = document.getElementById('ampel'); if (a) a.hidden = true; }
