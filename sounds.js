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

  const unlock = () => { audio(); };
  return { hit, swoosh, unlock };
})();
