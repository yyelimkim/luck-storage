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

  // A grape eaten: a cartoony "nom nom" — two quick mouthy chomps, each a
  // short buzz shaped like a voiced "nom", with a tiny click as teeth meet
  function eat() {
    const a = audio();
    const t = a.currentTime;
    const out = a.createGain();
    out.gain.value = 0.5;
    out.connect(a.destination);
    const nom = (at, pitch) => {
      const o = a.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(pitch, t + at);
      o.frequency.exponentialRampToValueAtTime(pitch * 0.8, t + at + 0.09);
      // the mouth: a vowel-ish band that closes as the "m" ends it
      const f = a.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 2.5;
      f.frequency.setValueAtTime(500, t + at);
      f.frequency.linearRampToValueAtTime(900, t + at + 0.03);
      f.frequency.exponentialRampToValueAtTime(320, t + at + 0.09);
      const g = a.createGain();
      g.gain.setValueAtTime(0.001, t + at);
      g.gain.exponentialRampToValueAtTime(0.4, t + at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + at + 0.1);
      o.connect(f).connect(g).connect(out);
      o.start(t + at);
      o.stop(t + at + 0.11);
      // the teeth
      const n = noise(a, 0.015);
      const hp = a.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2500;
      const ng = a.createGain();
      ng.gain.setValueAtTime(0.2, t + at);
      ng.gain.exponentialRampToValueAtTime(0.001, t + at + 0.015);
      n.connect(hp).connect(ng).connect(out);
      n.start(t + at);
    };
    const p = 150 + Math.random() * 30;
    nom(0, p);
    nom(0.12, p * 1.12);
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
  return { hit, swoosh, flip, claim, chime, stone, tap, eat, tick, rub, shimmer, unlock };
})();

// Every button, tab and link ticks when pressed (anything with its own
// sound opts out with data-silent)
addEventListener('click', (e) => {
  const el = e.target.closest('button, [role="button"], a');
  if (!el || el.disabled || el.closest('[data-silent]')) return;
  Sounds.tap();
}, true);
