// Splash (Figma 486:5534): the Luck Corner logo draws itself on, a pen
// tracing each green letter along its stroke (trim paths), starting from the
// centre of the logo and reaching the letters on either side in turn; once
// they're all drawn the sticker fades in behind them, then the logo dips a
// touch and swells as the splash dissolves into Home.
//
// assets/splash/trace.json holds the letters' centre lines, traced from the
// logo's shapes: each a polyline, the width that covers its stroke, and when
// it's drawn on a 0..1 clock.
//
// Add ?dial to the address for DialKit's panel to tune the timings live.

(() => {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const holder = splash.querySelector('.splash--logo');
  const NS = 'http://www.w3.org/2000/svg';
  // (also when a second ? slips in, as in ?r=1?dial)
  const TUNING = /[?&]dial(?:[=&?]|$)/.test(location.search);

  // The timings (seconds) and curves
  const CFG = {
    run: 1.5,                    // the trim, first stroke to last
    ease: [0.45, 0, 0.55, 1],    // its curve: a gentle ease-in-out
    stick: 0.4,                  // the sticker fading in
    hold: 0.25,                  // sticker down, before it leaves
    out: 0.55,                   // the dip, swell and dissolve
    flap: 0.8,                   // the clover's two flaps, once it's drawn
    dip: 0.94,                   // how far the logo dips
    grow: 1.35,                  // how far it swells as it goes
  };
  function applyCss() {
    splash.style.setProperty('--stick', `${CFG.stick}s`);
    splash.style.setProperty('--out', `${CFG.out}s`);
    splash.style.setProperty('--flap', `${CFG.flap}s`);
    splash.style.setProperty('--dip', CFG.dip);
    splash.style.setProperty('--grow', CFG.grow);
  }
  applyCss();

  // cubic-bezier(x1, y1, x2, y2) at x, as CSS draws it
  function bezier([x1, y1, x2, y2], x) {
    const f = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (f(x1, x2, mid) < x) lo = mid; else hi = mid;
    }
    return f(y1, y2, (lo + hi) / 2);
  }

  let strokes = [];
  let svg = null;
  let raf = 0;
  let timers = [];
  let gone = false;

  function leave() {
    if (gone) return;
    gone = true;
    cancelAnimationFrame(raf);
    splash.classList.add('is-leaving');
    // tuning, it stays to be replayed; otherwise it's done with
    if (!TUNING) timers.push(setTimeout(() => splash.remove(), CFG.out * 1000 + 50));
  }
  // A tap skips it (tuning, a tap plays it again)
  splash.addEventListener('click', () => { if (TUNING) play(); else leave(); });

  function play() {
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    timers = [];
    gone = false;
    // straight back to the start: no sticker, no clover, nothing fading out
    splash.classList.add('is-reset');
    splash.classList.remove('is-leaving', 'is-stuck', 'is-drawing');
    void splash.offsetWidth;
    splash.classList.remove('is-reset');
    if (!svg) return;
    const letters = svg.querySelector('#letters');
    letters.setAttribute('mask', 'url(#splash-trim)');
    strokes.forEach((s) => {
      s.p.style.visibility = 'hidden';  // else its round cap shows as a dot before it starts
      s.p.setAttribute('stroke-dashoffset', s.len);
    });
    void splash.offsetWidth;
    splash.classList.add('is-drawing');
    const t0 = performance.now() + 250;
    const frame = (now) => {
      if (gone) return;
      const x = Math.min(1, Math.max(0, (now - t0) / 1000 / CFG.run));
      const t = bezier(CFG.ease, x);
      strokes.forEach((s) => {
        const k = Math.min(1, Math.max(0, (t - s.from) / (s.to - s.from)));
        s.p.style.visibility = k > 0 ? '' : 'hidden';
        s.p.setAttribute('stroke-dashoffset', (s.len * (1 - k)).toFixed(2));
      });
      if (x < 1) { raf = requestAnimationFrame(frame); return; }
      // all drawn: the letters exactly as designed, unmasked
      letters.removeAttribute('mask');
      // the sticker fades in behind straight away, then the clover comes in
      // and flaps its wings twice, like a butterfly, then on to the app
      splash.classList.add('is-stuck');
      // (tuning, it stays on the splash: Replay plays it again, Leave shows the exit)
      if (!TUNING) timers.push(setTimeout(leave, (CFG.stick + Math.max(CFG.hold, CFG.flap + 0.3)) * 1000));
    };
    raf = requestAnimationFrame(frame);
  }

  Promise.all([
    fetch('assets/splash/logo.svg?v=1').then((r) => r.text()),
    fetch('assets/splash/trace.json?v=4').then((r) => r.json()),
  ])
    .then(([text, lines]) => {
      holder.innerHTML = text;
      svg = holder.querySelector('svg');

      // The letters show only where the pen has been. Each stroke has its
      // turn on one shared clock, 0 to 1 ('s' to 'e'): every letter is one
      // run of joined strokes begun near the logo's middle, timed so the
      // runs finish out at the logo's edges
      const mask = document.createElementNS(NS, 'mask');
      mask.id = 'splash-trim';
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      svg.querySelector('defs').appendChild(mask);
      strokes = lines.map(({ d, w, s: from, e: to }) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', 'white');
        p.setAttribute('stroke-width', w + 1);  // the trace's width covers every edge; +1 for smoothing
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round');
        mask.appendChild(p);
        const len = p.getTotalLength();
        p.setAttribute('stroke-dasharray', `${len} ${len + 1}`);
        return { p, len, from, to };
      });
      butterfly();
      play();
      if (TUNING) tune();
    })
    .catch(leave);

  // The clover by "Corner" (the logo's shape stroke17) on a layer of its
  // own, so it can come in once the letters are drawn and flap: copies of
  // the sticker and the letters showing just the clover and the line that
  // hugs it, and the logo with that cut out. The cut follows the clover's
  // own outline, grown a little: enough for its line, not the sticker's
  // outermost edge, which stays put.
  function butterfly() {
    const letters = svg.querySelector('#letters');
    const sticker = svg.querySelector('#sticker');
    const d = svg.querySelector('#stroke17_splash').getAttribute('d');
    const area = (paint) => `<path d="${d}" fill="${paint}" stroke="${paint}" stroke-width="7" stroke-linejoin="round"/>`;
    svg.querySelector('defs').insertAdjacentHTML('beforeend',
      `<mask id="splash-clover-in" maskUnits="userSpaceOnUse" x="-20" y="-20" width="420" height="220">${area('white')}</mask>`
      + `<mask id="splash-clover-out" maskUnits="userSpaceOnUse" x="-20" y="-20" width="420" height="220">`
      + `<rect x="-20" y="-20" width="420" height="220" fill="white"/>${area('black')}</mask>`);
    const wrap = document.createElementNS(NS, 'g');
    wrap.setAttribute('mask', 'url(#splash-clover-out)');
    sticker.before(wrap);
    wrap.append(sticker, letters);
    const clover = document.createElementNS(NS, 'g');
    clover.setAttribute('class', 'splash--clover');
    const inner = document.createElementNS(NS, 'g');
    inner.setAttribute('mask', 'url(#splash-clover-in)');
    for (const id of ['#sticker', '#letters']) {
      const copy = document.createElementNS(NS, 'use');
      copy.setAttribute('href', id);
      inner.appendChild(copy);
    }
    clover.appendChild(inner);
    wrap.after(clover);
  }

  // DialKit (vendor/dialkit, MIT): a panel to tune the splash live
  function tune() {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'vendor/dialkit/styles.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'vendor/dialkit/browser.global.js';
    js.onload = () => {
      const { createDialRoot, createDialKit } = window.DialKit;
      createDialRoot();
      const kit = createDialKit('Splash', {
        replay: { type: 'action' },
        'see it leave': { type: 'action' },
        trim: {
          run: [CFG.run, 0.3, 4, 0.05],
          curve: { type: 'easing', duration: CFG.run, ease: CFG.ease },
        },
        sticker: { fade: [CFG.stick, 0, 1.5, 0.05], hold: [CFG.hold, 0, 3, 0.05] },
        clover: { flaps: [CFG.flap, 0.2, 2, 0.05] },
        leave: {
          duration: [CFG.out, 0.1, 2, 0.05],
          dip: [CFG.dip, 0.7, 1, 0.01],
          grow: [CFG.grow, 1, 2.5, 0.01],
        },
      }, {
        // kept in this browser across reloads (localStorage 'dialkit:splash')
        id: 'splash',
        persist: true,
        onAction: (path) => {
          if (path === 'replay') play();
          // the exit, then back to the drawn logo to tune it again
          if (path === 'see it leave') {
            leave();
            timers.push(setTimeout(() => {
              gone = false;
              splash.classList.remove('is-leaving');
            }, CFG.out * 1000 + 600));
          }
        },
      });
      kit.subscribe((v) => {
        CFG.run = v.trim.run;
        if (v.trim.curve && Array.isArray(v.trim.curve.ease)) CFG.ease = v.trim.curve.ease;
        CFG.stick = v.sticker.fade;
        CFG.hold = v.sticker.hold;
        CFG.flap = v.clover.flaps;
        CFG.out = v.leave.duration;
        CFG.dip = v.leave.dip;
        CFG.grow = v.leave.grow;
        applyCss();
      });
      // play it again with the saved values
      play();
    };
    document.head.appendChild(js);
  }
})();
