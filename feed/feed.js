/* Salt & Silver · Feed: ein Klick auf einen Beitrag spielt ihn gross hoch, mit Ort und Text. Pfeile und Tasten blättern, Escape schliesst. */
(function () {
  var d = document, gross = d.getElementById('gross'), posts = [], jetzt = 0;
  var $ = function (i) { return d.getElementById(i); };
  (function hole(versuch) {   // bricht das Laden ab (schwache Leitung), nach zwei Sekunden noch einmal, sonst spielt kein Beitrag hoch
    fetch('feed.json').then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(function (j) { posts = j.posts; })
      .catch(function () { if (versuch < 3) setTimeout(function () { hole(versuch + 1); }, 2000); });
  })(1);
  function zeig(i) {
    if (!posts.length) return;
    jetzt = (i + posts.length) % posts.length;
    var p = posts[jetzt], n = ('0' + p.n).slice(-2), bild = $('g-bild');
    bild.src = 'thumbs/' + n + '.webp';                        // steht sofort da
    var gr = new Image(); gr.onload = function () { if (posts[jetzt] === p) bild.src = gr.src; }; gr.src = 'posts/' + n + '.jpg';   // die grosse Fassung löst sie ab
    $('g-nr').textContent = 'Beitrag ' + p.n + ' von ' + posts.length; $('g-ort').textContent = p.ort; $('g-text').textContent = p.cap;
  }
  function auf(i) {
    if (!posts.length) return;   // Beiträge noch nicht geladen: kein leeres Grossfenster
    zeig(i); gross.hidden = false; d.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { gross.classList.add('da'); }); });
  }
  function zu() { gross.classList.remove('da'); d.documentElement.style.overflow = ''; setTimeout(function () { gross.hidden = true; }, 460); }
  $('raster').addEventListener('click', function (ev) { var k = ev.target.closest('.ig-p'); if (k) auf(+k.getAttribute('data-n') - 1); });
  gross.addEventListener('click', function (ev) {
    if (ev.target.closest('#vor')) return zeig(jetzt + 1);
    if (ev.target.closest('#zurueck')) return zeig(jetzt - 1);
    if (ev.target.closest('#zu') || ev.target === gross) zu();
  });
  d.addEventListener('keydown', function (ev) {
    if (gross.hidden) return;
    if (ev.key === 'Escape') zu(); else if (ev.key === 'ArrowRight') zeig(jetzt + 1); else if (ev.key === 'ArrowLeft') zeig(jetzt - 1);
  });

  /* ---------- Das Handy oben: Bildfolge aus Blender einmal abspielen, dann den echten Feed in den Bildschirm legen ---------- */
  var h = $('fe3');
  if (h) {
    var film = h.querySelector('.fe3__film'), e = h.querySelector('.fe3__e'), rahmen = null;
    var mass = function () { if (rahmen) rahmen.style.transform = 'scale(' + (e.clientWidth / 393) + ')'; };
    var lebendig = function () {
      if (rahmen || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;   // am Handy bleibt das Standbild, der ganze Feed steht darunter
      rahmen = d.createElement('iframe'); rahmen.title = 'Der Feed zum Scrollen';
      rahmen.addEventListener('load', function () { setTimeout(function () { rahmen.classList.add('da'); }, 200); });
      rahmen.src = e.getAttribute('data-seite'); mass(); e.appendChild(rahmen);
    };
    var steht = function () { h.classList.add('steht'); setTimeout(function () { h.classList.add('fest'); lebendig(); }, 420); };
    window.addEventListener('resize', mass);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { h.classList.add('ohne'); lebendig(); }
    else {
      var im = new Image(), fertig = false;
      var los = function () {
        if (fertig) return; fertig = true;
        film.style.setProperty('--film', 'url(' + film.getAttribute('data-film') + ')');
        film.addEventListener('animationend', steht, { once: true });
        h.classList.add('los');
      };
      im.onload = function () { (im.decode ? im.decode().then(los, los) : los()); };
      im.onerror = function () { h.classList.add('ohne'); lebendig(); };
      im.src = film.getAttribute('data-film');
      setTimeout(function () { if (!fertig) { fertig = true; h.classList.add('ohne'); lebendig(); } }, 6000);   // kommt die Bildfolge nicht, steht das Handy einfach da
    }
  }
})();
