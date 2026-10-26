// Small sounds for the rituals, made on the spot with Web Audio (no files):
// hit() a soft wooden knock, swoosh() a quick breath of air. Browsers only
// let sound start from a press or tap — not from a finger moving — so a
// swipe calls unlock() as the finger goes down, before its swoosh.
const Sounds = (() => {
  let ctx = null;
  const audio = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  // A burst of white noise, length s seconds
  const noise = (a, s) => {
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * s), a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buf;
    return src;
  };

  // A knock: a falling low tone with a short click of noise on top
  function hit(strength = 1) {
    const a = audio();
    const t = a.currentTime;
    const out = a.createGain();
    out.gain.value = 0.35 * strength;
    out.connect(a.destination);

    const osc = a.createOscillator();
    const og = a.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190 + Math.random() * 30, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.16);
    og.gain.setValueAtTime(1, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(og).connect(out);
    osc.start(t);
    osc.stop(t + 0.22);

    const n = noise(a, 0.05);
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    const ng = a.createGain();
    ng.gain.setValueAtTime(0.5, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.connect(bp).connect(ng).connect(out);
    n.start(t);
  }

  // A swoosh: noise swept through a band-pass, swelling and fading
  function swoosh(strength = 1) {
    const a = audio();
    const t = a.currentTime;
    const n = noise(a, 0.4);
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.3);
    const g = a.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * strength, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    n.connect(bp).connect(g).connect(a.destination);
    n.start(t);
  }

  // A card turning over: a short papery flick, swept from bright to soft
  function flip() {
    const a = audio();
    const t = a.currentTime;
    const n = noise(a, 0.18);
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(3200, t);
    bp.frequency.exponentialRampToValueAtTime(900, t + 0.16);
    const g = a.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
    n.connect(bp).connect(g).connect(a.destination);
    n.start(t);
  }

  // Luck received (Luck Claimed): a quick bright sparkle — four notes
  // climbing (C, E, G, C), each a short plucked triangle, the last ringing on
  function claim() {
    const a = audio();
    const t = a.currentTime;
    [[1046.5, 0, 0.18], [1318.5, 0.055, 0.18], [1568, 0.11, 0.2], [2093, 0.165, 0.5]].forEach(([f, d, len]) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t + d);
      g.gain.exponentialRampToValueAtTime(0.14, t + d + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, t + d + len);
      o.connect(g).connect(a.destination);
      o.start(t + d);
      o.stop(t + d + len + 0.02);
    });
  }

  // A breath blown out, soft and long: an airy "fffoo" that swells and
  // falls away, its rush sweeping down as the breath empties
  function blow(strength = 1) {
    const a = audio();
    const t = a.currentTime;
    const len = 1.1;
    const n = noise(a, len + 0.1);
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(1600, t);
    bp.frequency.exponentialRampToValueAtTime(500, t + len);
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3500, t);
    lp.frequency.exponentialRampToValueAtTime(900, t + len);
    const g = a.createGain();
    const peak = 0.22 * Math.min(1.3, strength);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.18);
    g.gain.setValueAtTime(peak * 0.85, t + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    n.connect(bp).connect(lp).connect(g).connect(a.destination);
    n.start(t);
  }

  // A bad dream caught: drawn in with a swirling rush that rises and
  // closes off, and a soft low bell as it's gone
  function capture() {
    const a = audio();
    const t = a.currentTime;
    const n = noise(a, 0.7);
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t + 0.35);
    bp.frequency.exponentialRampToValueAtTime(700, t + 0.6);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
    n.connect(bp).connect(g).connect(a.destination);
    n.start(t);
    [[523.3, 0.42], [392, 0.5]].forEach(([f, d]) => {
      const o = a.createOscillator();
      const og = a.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      og.gain.setValueAtTime(0.0001, t + d);
      og.gain.exponentialRampToValueAtTime(0.09, t + d + 0.02);
      og.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.7);
      o.connect(og).connect(a.destination);
      o.start(t + d);
      o.stop(t + d + 0.75);
    });
  }

  // Something springing up into being: a quick rising "boing" with a
  // soft click at its start
  function pop() {
    const a = audio();
    const t = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.12);
    o.frequency.exponentialRampToValueAtTime(700, t + 0.28);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 0.35);
    const n = noise(a, 0.02);
    const hp = a.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const ng = a.createGain();
    ng.gain.setValueAtTime(0.12, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
    n.connect(hp).connect(ng).connect(a.destination);
    n.start(t);
  }

  // A celebration (a perfect score): a quick "ta-da", two short notes up
  // into a bright held chord, with a sparkle of high bells on top
  function fanfare() {
    const a = audio();
    const t = a.currentTime;
    const out = a.createGain();
    out.gain.value = 0.5;
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    lp.connect(out).connect(a.destination);
    const note = (f, at, len, type = 'square', loud = 0.12) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(loud, t + at + 0.012);
      g.gain.setValueAtTime(loud, t + at + len * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + len);
      o.connect(g).connect(lp);
      o.start(t + at);
      o.stop(t + at + len + 0.02);
    };
    note(392, 0, 0.11);
    note(523.3, 0.12, 0.11);
    [523.3, 659.3, 784, 1046.5].forEach((f) => note(f, 0.25, 0.9, 'square', 0.07));
    [2093, 2637, 3136, 4186].forEach((f, i) => note(f, 0.3 + i * 0.07, 0.35, 'sine', 0.05));
  }

  // Luck counted (the clover lands in the count): subtle and low, two soft
  // round notes a fifth apart
  function chime() {
    const a = audio();
    const t = a.currentTime;
    [[392, 0], [587.3, 0.07]].forEach(([f, d]) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t + d);
      g.gain.exponentialRampToValueAtTime(0.07, t + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.45);
      o.connect(g).connect(a.destination);
      o.start(t + d);
      o.stop(t + d + 0.47);
    });
  }

  // A stone landing on stone: a low, dull thud with a gritty click
  function stone() {
    const a = audio();
    const t = a.currentTime;
    const out = a.createGain();
    out.gain.value = 0.45;
    out.connect(a.destination);
    const o = a.createOscillator();
    const og = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(130 + Math.random() * 20, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.14);
    og.gain.setValueAtTime(1, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.2);
    const n = noise(a, 0.06);
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 0.8;
    const ng = a.createGain();
    ng.gain.setValueAtTime(0.6, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    n.connect(bp).connect(ng).connect(out);
    n.start(t);
  }

  // A button pressed: a soft, creamy click — a muffled tick of noise for
  // the edge and a low round thump under it, quiet and gone in a blink
  function tap() {
    const a = audio();
    const t = a.currentTime;
    const out = a.createGain();
    out.gain.value = 0.55;
    out.connect(a.destination);
    // the tick: a few ms of noise, warm and dull through a low-pass
    const n = a.createBufferSource();
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * 0.02), a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
    n.buffer = buf;
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    lp.Q.value = 0.4;
    const ng = a.createGain();
    ng.gain.value = 0.22;
    n.connect(lp).connect(ng).connect(out);
    n.start(t);
    // the body: a round little thump
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.04);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.07);
  }

  // A grape eaten: a crunchy bite — a juicy pop as the skin gives, then a
  // crackle of tiny brittle grains (bright, uneven, close together), and a
  // second, smaller crunch as it's chewed
  function eat() {
    const a = audio();
    const t = a.currentTime;
    const out = a.createGain();
    out.gain.value = 0.55;
    out.connect(a.destination);
    // the pop of the skin
    const o = a.createOscillator();
    const og = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.05);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.35, t + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.07);
    // the crackle: a run of tiny grains, each its own pitch and loudness
    const crunch = (at, grains, span, loud) => {
      for (let i = 0; i < grains; i++) {
        const when = t + at + (i / grains) * span + Math.random() * (span / grains) * 0.8;
        const len = 0.004 + Math.random() * 0.01;
        const n = noise(a, len + 0.005);
        const bp = a.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1500 + Math.random() * 3000;
        bp.Q.value = 1.2 + Math.random() * 2;
        const g = a.createGain();
        const peak = loud * (0.4 + Math.random() * 0.6) * (1 - (i / grains) * 0.5);
        g.gain.setValueAtTime(peak, when);
        g.gain.exponentialRampToValueAtTime(0.0001, when + len);
        n.connect(bp).connect(g).connect(out);
        n.start(when);
      }
    };
    crunch(0.006, 14, 0.12, 0.9);
    crunch(0.19, 8, 0.08, 0.5);
  }


  // A clock's second ticking down: a tiny dry tick (a little lower on the tock)
  let tock = false;
  function tick() {
    const a = audio();
    const t = a.currentTime;
    const n = noise(a, 0.03);
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = (tock = !tock) ? 3200 : 2600;
    bp.Q.value = 6;
    const g = a.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    n.connect(bp).connect(g).connect(a.destination);
    n.start(t);
  }

  // A hand rubbing round: a soft, low brush of air
  function rub() {
    const a = audio();
    const t = a.currentTime;
    const n = noise(a, 0.25);
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = a.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    n.connect(lp).connect(g).connect(a.destination);
    n.start(t);
  }

  // A wish settling into place: a shiny rising "waaah" — a soft gliding
  // tone with a slow shimmer, sparkles twinkling over the top
  function shimmer() {
    const a = audio();
    const t = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    const lfo = a.createOscillator();
    const lg = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(440, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.9);
    lfo.frequency.value = 6;
    lg.gain.value = 12;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    o.connect(g).connect(a.destination);
    o.start(t); lfo.start(t);
    o.stop(t + 1.45); lfo.stop(t + 1.45);
    [1760, 2349, 2637, 3136].forEach((f, i) => {
      const s = a.createOscillator();
      const sg = a.createGain();
      const d = 0.35 + i * 0.12;
      s.type = 'triangle';
      s.frequency.value = f;
      sg.gain.setValueAtTime(0.001, t + d);
      sg.gain.exponentialRampToValueAtTime(0.05, t + d + 0.01);
      sg.gain.exponentialRampToValueAtTime(0.001, t + d + 0.35);
      s.connect(sg).connect(a.destination);
      s.start(t + d);
      s.stop(t + d + 0.37);
    });
  }

  const unlock = () => { audio(); };
  // Bad luck drawn into the eye: a dark breath pulled inwards, a low
  // filtered rush that falls in pitch and closes off
  function absorb() {
    const a = audio();
    const t = a.currentTime;
    const n = noise(a, 0.4);
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(1800, t);
    lp.frequency.exponentialRampToValueAtTime(160, t + 0.32);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    n.connect(lp).connect(g).connect(a.destination);
    n.start(t);
  }

  // The eye cracking: a sharp glassy snap, then a few ticks as the crack
  // runs; `big` for the last one, longer and louder
  function crack(big = false) {
    const a = audio();
    const t = a.currentTime;
    const out = a.createGain();
    out.gain.value = big ? 0.7 : 0.45;
    out.connect(a.destination);
    const snap = (at, len, loud, f) => {
      const n = noise(a, len + 0.01);
      const hp = a.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = f;
      hp.Q.value = 0.9;
      const g = a.createGain();
      g.gain.setValueAtTime(loud, t + at);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + len);
      n.connect(hp).connect(g).connect(out);
      n.start(t + at);
    };
    snap(0, 0.05, 1, 3200);
    const ticks = big ? 9 : 4;
    for (let i = 1; i <= ticks; i++) snap(0.03 + i * (big ? 0.035 : 0.03) + Math.random() * 0.015, 0.012, 0.35 * (1 - i / (ticks + 2)), 2500 + Math.random() * 3500);
    // a glassy ring under it
    const o = a.createOscillator();
    const og = a.createGain();
    o.type = 'sine';
    o.frequency.value = big ? 2300 : 2900;
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.05, t + 0.005);
    og.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.5 : 0.25));
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.6);
  }

  // The eye about to break, `s` seconds of it: a low hum swelling and
  // climbing as it glows, brighter as it goes, with a rattle that comes in
  // and quickens as it shakes harder; it stops dead for the break
  function surge(s = 2) {
    const a = audio();
    const t = a.currentTime;
    const out = a.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.35, t + s * 0.9);
    out.gain.setValueAtTime(0.35, t + s - 0.02);
    out.gain.linearRampToValueAtTime(0, t + s);
    out.connect(a.destination);
    // the hum: two slightly apart saws, rising, through an opening filter
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 4;
    lp.frequency.setValueAtTime(220, t);
    lp.frequency.exponentialRampToValueAtTime(2600, t + s);
    lp.connect(out);
    [0, 7].forEach((cents) => {
      const o = a.createOscillator();
      o.type = 'sawtooth';
      o.detune.value = cents;
      o.frequency.setValueAtTime(70, t);
      o.frequency.exponentialRampToValueAtTime(190, t + s);
      const g = a.createGain();
      g.gain.value = 0.25;
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(t + s + 0.05);
    });
    // the rattle: noise chopped faster and faster, from halfway in
    const n = noise(a, s);
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 1.2;
    const chop = a.createGain();
    chop.gain.value = 0;
    const lfo = a.createOscillator();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(9, t);
    lfo.frequency.exponentialRampToValueAtTime(32, t + s);
    const depth = a.createGain();
    depth.gain.setValueAtTime(0.0001, t);
    depth.gain.setValueAtTime(0.0001, t + s * 0.35);
    depth.gain.exponentialRampToValueAtTime(0.5, t + s);
    lfo.connect(depth).connect(chop.gain);
    n.connect(bp).connect(chop).connect(out);
    n.start(t);
    lfo.start(t);
    lfo.stop(t + s + 0.05);
  }

  // Rain, soft and steady, for as long as keep() says: a quiet hiss with
  // little drops pattering through it; it fades in, and out once keep()
  // turns false
  function rain(keep) {
    const a = audio();
    const t = a.currentTime;
    const out = a.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(1, t + 1.5);
    out.connect(a.destination);
    // the hiss: looped noise, its lows and harshest highs taken off
    const n = noise(a, 2);
    n.loop = true;
    const hp = a.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 700;
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5000;
    const hiss = a.createGain();
    hiss.gain.value = 0.016;
    n.connect(hp).connect(lp).connect(hiss).connect(out);
    n.start(t);
    // the drops: tiny bright ticks, a few at a time, never in step
    const drop = () => {
      const at = a.currentTime + Math.random() * 0.08;
      const d = noise(a, 0.02);
      const bp = a.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2500 + Math.random() * 4000;
      bp.Q.value = 3;
      const g = a.createGain();
      g.gain.setValueAtTime(0.006 + Math.random() * 0.01, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.018);
      d.connect(bp).connect(g).connect(out);
      d.start(at);
    };
    const timer = setInterval(() => {
      if (!keep()) {
        clearInterval(timer);
        const now = a.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        n.stop(now + 1.3);
        return;
      }
      if (Math.random() < 0.6) drop();
    }, 90);
  }

  // A petal plucked: the little snap as it comes away — a tight, bright
  // tick of noise over a short, dull pop, then a breath of air
  function pluck() {
    const a = audio();
    const t = a.currentTime;
    const out = a.createGain();
    out.gain.value = 0.5;
    out.connect(a.destination);
    const n = noise(a, 0.03);
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3600;
    bp.Q.value = 1.4;
    const ng = a.createGain();
    ng.gain.setValueAtTime(0.9, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
    n.connect(bp).connect(ng).connect(out);
    n.start(t);
    const o = a.createOscillator();
    const og = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.06);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.3, t + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.08);
    const air = noise(a, 0.25);
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1200;
    const ag = a.createGain();
    ag.gain.setValueAtTime(0.0001, t + 0.02);
    ag.gain.exponentialRampToValueAtTime(0.06, t + 0.07);
    ag.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    air.connect(lp).connect(ag).connect(out);
    air.start(t + 0.02);
  }

  return { hit, swoosh, flip, claim, chime, stone, tap, eat, tick, rub, shimmer, absorb, crack, surge, rain, fanfare, blow, capture, pop, pluck, unlock };
})();

// Every button, tab and link ticks when pressed (anything with its own
// sound opts out with data-silent)
addEventListener('click', (e) => {
  const el = e.target.closest('button, [role="button"], a');
  if (!el || el.disabled || el.closest('[data-silent]')) return;
  Sounds.tap();
}, true);
