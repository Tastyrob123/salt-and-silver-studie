/* Salt & Silver · Feed im Handy: Beitrag antippen öffnet ihn mit Ort und Text, der Pfeil führt zurück. */
(function () {
  var d = document, post = d.getElementById('post'), posts = {};
  (function hole(versuch) {   // bricht das Laden ab (schwache Leitung), nach zwei Sekunden noch einmal, sonst bleiben die Beiträge stumm
    fetch('feed.json').then(function (r) { if (!r.ok) throw r.status; return r.json(); }).then(function (j) { j.posts.forEach(function (p) { posts[p.n] = p; }); })
      .catch(function () { if (versuch < 3) setTimeout(function () { hole(versuch + 1); }, 2000); });
  })(1);
  d.addEventListener('click', function (ev) {
    var k = ev.target.closest('.ig-p');
    if (k) {
      var p = posts[+k.getAttribute('data-n')]; if (!p) return;
      d.getElementById('p-bild').src = 'posts/' + ('0' + p.n).slice(-2) + '.jpg';
      d.getElementById('p-ort').textContent = p.ort; d.getElementById('p-text').textContent = p.cap;
      post.hidden = false; post.scrollTop = 0;
      requestAnimationFrame(function () { post.classList.add('da'); });
      return;
    }
    if (ev.target.closest('#zurueck')) { post.classList.remove('da'); setTimeout(function () { post.hidden = true; }, 520); }
  });
})();
