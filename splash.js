// Splash (Figma 486:5534): the Luck Corner logo draws itself on, its green
// letters trimmed open from the centre of the logo outward, reaching each
// letter in turn on either side; once they're all drawn the sticker behind
// them is stuck down, and the splash lifts away to the app.

(() => {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const holder = splash.querySelector('.splash--logo');
  const NS = 'http://www.w3.org/2000/svg';
  const CENTRE = [182.5, 82.4];  // the logo's middle, in its own units
  const SPREAD = 0.75;           // s for the trim to travel from the centre to the far ends
  const DRAW = [0.55, 1.1];      // s for a letter to draw itself, shortest to longest
  const MASK_W = 18;             // wide enough to cover the thickest stroke from its edge
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  let gone = false;
  function leave() {
    if (gone) return;
    gone = true;
    splash.classList.add('is-leaving');
    setTimeout(() => splash.remove(), 700);
  }
  // A tap skips it
  splash.addEventListener('click', leave);

  fetch('assets/splash/logo.svg?v=1')
    .then((r) => r.text())
    .then((text) => {
      holder.innerHTML = text;
      const svg = holder.querySelector('svg');
      const letters = svg.querySelector('#letters');

      // Every outline of the letters, one by one, as a stroke in a mask:
      // trimmed open both ways from its point nearest the logo's middle
      const mask = document.createElementNS(NS, 'mask');
      mask.id = 'splash-trim';
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      svg.querySelector('defs').appendChild(mask);
      const shapes = [...svg.querySelectorAll('#letters > use, #letters > path:not([mask])')];
      const outlines = [];
      shapes.forEach((el) => {
        const d = el.tagName === 'use'
          ? svg.querySelector(el.getAttribute('xlink:href') || el.getAttribute('href')).getAttribute('d')
          : el.getAttribute('d');
        d.split(/(?=M)/).forEach((part) => {
          const p = document.createElementNS(NS, 'path');
          p.setAttribute('d', part);
          p.setAttribute('fill', 'none');
          p.setAttribute('stroke', 'white');
          p.setAttribute('stroke-width', MASK_W);
          p.setAttribute('stroke-linecap', 'round');
          mask.appendChild(p);
          const len = p.getTotalLength();
          // its point nearest the middle, where its trim starts
          let at = 0;
          let near = Infinity;
          for (let s = 0; s <= len; s += 2) {
            const q = p.getPointAtLength(s);
            const dist = Math.hypot(q.x - CENTRE[0], q.y - CENTRE[1]);
            if (dist < near) { near = dist; at = s; }
          }
          p.setAttribute('stroke-dasharray', `0 ${len + 1}`);
          outlines.push({ p, len, at, near });
        });
      });
      letters.setAttribute('mask', 'url(#splash-trim)');

      const far = Math.max(...outlines.map((o) => o.near));
      const longest = Math.max(...outlines.map((o) => o.len));
      outlines.forEach((o) => {
        o.delay = (o.near / far) * SPREAD;
        o.dur = DRAW[0] + (DRAW[1] - DRAW[0]) * Math.sqrt(o.len / longest);
      });
      const total = Math.max(...outlines.map((o) => o.delay + o.dur));

      // The trim: a dash centred on its start point, opening both ways
      // round the closed outline (wrapping past the path's own start)
      function trim(o, k) {
        const half = (o.len / 2) * k;
        if (k >= 1) { o.p.removeAttribute('stroke-dasharray'); return; }
        const a = o.at - half;
        const b = o.at + half;
        let dash;
        if (a >= 0 && b <= o.len) dash = [0, a, b - a, o.len];
        else if (a < 0) dash = [b, o.len + a - b, -a, o.len];
        else dash = [b - o.len, a - (b - o.len), o.len - a, o.len];
        o.p.setAttribute('stroke-dasharray', dash.map((n) => Math.max(0, n).toFixed(2)).join(' '));
      }

      splash.classList.add('is-drawing');
      const t0 = performance.now() + 250;
      function frame(now) {
        if (gone) return;
        const t = (now - t0) / 1000;
        outlines.forEach((o) => trim(o, ease(Math.min(1, Math.max(0, (t - o.delay) / o.dur)))));
        if (t < total) { requestAnimationFrame(frame); return; }
        // all drawn: the sticker goes down behind, then on to the app
        splash.classList.add('is-stuck');
        setTimeout(leave, 1400);
      }
      requestAnimationFrame(frame);
    })
    .catch(leave);
})();
