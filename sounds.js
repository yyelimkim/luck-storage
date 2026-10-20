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

  // Luck added: a quick bright sparkle — four notes climbing (C, E, G, C),
  // each a short plucked triangle, the last ringing a little longer
  function chime() {
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

  // A button or tab pressed: a light, short tick
  function tap() {
    const a = audio();
    const t = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(700, t + 0.04);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 0.07);
  }

  const unlock = () => { audio(); };
  return { hit, swoosh, flip, chime, stone, tap, unlock };
})();

// Every button, tab and link ticks when pressed (anything with its own
// sound opts out with data-silent)
addEventListener('click', (e) => {
  const el = e.target.closest('button, [role="button"], a');
  if (!el || el.disabled || el.closest('[data-silent]')) return;
  Sounds.tap();
}, true);
