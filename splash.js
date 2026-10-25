// Splash (Figma 486:5534): the Luck Corner logo draws itself on, a pen
// tracing each green letter along its stroke (trim paths), starting from the
// centre of the logo and reaching the letters on either side in turn; once
// they're all drawn the sticker fades in behind them, and the splash
// dissolves away to the app.
//
// assets/splash/trace.json holds the letters' centre lines, traced from the
// logo's shapes: each a polyline and the width that covers its stroke.

(() => {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const holder = splash.querySelector('.splash--logo');
  const NS = 'http://www.w3.org/2000/svg';
  const CENTRE = [182.5, 82.4];  // the logo's middle, in its own units
  const WAVE = 260;              // units/s: how fast the drawing spreads from the centre
  const PEN = 240;               // units/s: how fast each stroke is drawn (before easing)
  const RUN = 2.2;               // s: the drawing from first stroke to last, eased

  let gone = false;
  function leave() {
    if (gone) return;
    gone = true;
    splash.classList.add('is-leaving');
    setTimeout(() => splash.remove(), 700);
  }
  // A tap skips it
  splash.addEventListener('click', leave);

  Promise.all([
    fetch('assets/splash/logo.svg?v=1').then((r) => r.text()),
    fetch('assets/splash/trace.json?v=2').then((r) => r.json()),
  ])
    .then(([text, lines]) => {
      holder.innerHTML = text;
      const svg = holder.querySelector('svg');

      // The letters show only where the pen has been
      const mask = document.createElementNS(NS, 'mask');
      mask.id = 'splash-trim';
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      svg.querySelector('defs').appendChild(mask);
      // Each stroke starts where the pen reaches it: every letter is one
      // run of joined strokes, begun at its point nearest the logo's middle
      // ('root', how far that is) and followed along ('at', how far along)
      const strokes = lines.map(({ d, w, root, at }) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', 'white');
        p.setAttribute('stroke-width', w + 3);  // a touch wider than the stroke, so no edge is left out
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round');
        mask.appendChild(p);
        const len = p.getTotalLength();
        p.setAttribute('stroke-dasharray', `${len} ${len + 1}`);
        p.setAttribute('stroke-dashoffset', len);
        p.style.visibility = 'hidden';  // else its round cap shows as a dot before it starts
        return { p, len, delay: root / WAVE + at / PEN, dur: len / PEN };
      });
      svg.querySelector('#letters').setAttribute('mask', 'url(#splash-trim)');
      const total = Math.max(...strokes.map((s) => s.delay + s.dur));

      splash.classList.add('is-drawing');
      const t0 = performance.now() + 250;
      function frame(now) {
        if (gone) return;
        // the whole drawing eases out: quick at first, slowing to the end
        // (one clock for every stroke, so joined strokes still run on)
        const x = Math.min(1, (now - t0) / 1000 / RUN);
        const t = total * (1 - Math.pow(1 - x, 3));
        strokes.forEach((s) => {
          // at the pen's steady pace, so joined strokes run on unbroken
          const k = Math.min(1, Math.max(0, (t - s.delay) / s.dur));
          s.p.style.visibility = k > 0 ? '' : 'hidden';
          s.p.setAttribute('stroke-dashoffset', (s.len * (1 - k)).toFixed(2));
        });
        if (x < 1) { requestAnimationFrame(frame); return; }
        // all drawn: the sticker fades in behind, then on to the app
        splash.classList.add('is-stuck');
        setTimeout(leave, 1400);
      }
      requestAnimationFrame(frame);
    })
    .catch(leave);
})();
