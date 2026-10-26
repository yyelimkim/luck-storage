// Evil Eye (Figma 519:247): hung on a string as the pollock charm is (charm.js
// does the dropping, swinging, hitting and dragging). Its string is the
// pollock's, in the eye's dark brown, threaded down to the knot on top.
// Each hit knocks bad luck into the eye (it swings less than the fish), and a
// crack runs further across it. Full, it stops swinging and rises, glowing,
// shakes harder and harder, and breaks into pieces; everything hung on it
// falls away.

// Each layer's box in the 221 x 647 frame (the Figma group's own bounds)
window.CHARM = {
  dir: 'evileye',
  parts: [
    // the string, straight, its end tucked under the knot (the pollock's
    // string, its knot spot on the eye's)
    { src: 'string', string: true, box: [78.33, -71.0, 46.193, 260.124], inner: [39.235, 259.162], rot: -1.54, inset: '-0.29% -1.91%', fish: false },
    // the beads, the little eye and the tassel's strands, each swinging on its own (below)
    { src: 'tail', box: [76.652, 388.215, 54, 259], inner: [54, 259], rot: 0, inset: '0' },
    { src: 'eye', box: [1.122, 147.497, 218, 246], inner: [218, 246], rot: 0, inset: '0' },
    // the knot, on its own so it can fall with the rest when the eye breaks
    { src: 'knot', box: [1.122, 147.497, 218, 246], inner: [218, 246], rot: 0, inset: '0' },
  ],
  // the fish's string at its own length; only its last stretch shows, the
  // rest (and its looped top) lost in the fade above
  pin: [98.8, -69.7],
  fit: [20, 647],
  say: 'Bad Luck',
  clover: false,
  claimAfter: 4100,  // once it's stilled, risen, shaken, broken and the pieces have fallen
  hit: 0.8,          // a gentler swing than the fish's
  // a stiffer cord than the fish's: it barely gives when it catches, and
  // settles at once
  taut: [5000, 120],
  whip: 4,
  start: 0.5,
};

// (in its own scope: charm.js shares the page's names)
(() => {
// The cracks run out from the knot's side of the eye and across it, a
// stretch with each hit (in the frame's units; the eye's middle is 109, 285)
const CRACKS = [
  'M150 196L141 222L150 241L137 259',
  'M137 259L121 266L128 284',
  'M128 284L105 296L93 318L99 340',
  'M99 340L75 352L60 371L33 379',
  'M99 340L111 362L104 384M150 241L174 249L199 268',
];
const NS = 'http://www.w3.org/2000/svg';
const crackSvg = document.createElementNS(NS, 'svg');
crackSvg.setAttribute('class', 'eye--cracks');
crackSvg.setAttribute('viewBox', '0 0 221 647');
crackSvg.setAttribute('aria-hidden', 'true');
const runs = CRACKS.map((d) => {
  const pair = ['is-edge', ''].map((cls) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('pathLength', '1');
    if (cls) p.classList.add(cls);
    crackSvg.appendChild(p);
    return p;
  });
  return pair;
});
// over the eye, swinging with it
let fish;
let eye;
let tail;
let knot;
addEventListener('DOMContentLoaded', () => {
  fish = document.getElementById('fish');
  fish.appendChild(crackSvg);
  const part = (name) => fish.querySelector(`img[src$="/${name}.svg"]`).closest('.part');
  eye = part('eye');
  tail = part('tail');
  knot = part('knot');
  hangChain();
});

// The beads, the little eye and the tassel are strung one under the other
// from the eye's bottom: each hangs from the one above on its own joint,
// swinging a beat behind it and looser the further down, with the slightest
// sway of its own. Each joint's pivot is the top of what hangs from it (in
// the tail's 54 x 259 units).
const LINKS = [
  { at: [33.9, 0.9], take: [0] },          // the top bead
  { at: [34.1, 21.9], take: [1] },         // the big bead
  { at: [31.3, 51.9], take: [2] },         // the small bead
  { at: [28.0, 70.9], take: [4, 5, 6, 7] }, // the little eye
  { at: [25.5, 114.2], take: [3] },        // the bead the tassel hangs from
].map((l, i) => ({ ...l, a: 0, va: 0, k: 34 - i * 4, c: 2.6 - i * 0.2, drag: 0.03 + i * 0.012, loose: 0.3 + i * 0.08 }));

// The tassel as strings: each strand is warped every frame, bending more
// towards its end. It hangs straight down whatever way the eye has swung,
// trails behind the swing, and springs back past straight a little,
// each strand at its own pace. At rest it's exactly the drawing.
const TOP = 123;   // where the strands come out of the little bead (the tail's units)
const LEN = 135;   // their length
let strands = [];
const NUM = /-?\d*\.?\d+(?:e-?\d+)?/g;
function hangChain() {
  const img = tail.querySelector('img');
  const load = (url) => fetch(url).then((r) => r.text()).then((t) => new DOMParser().parseFromString(t, 'image/svg+xml').documentElement);
  Promise.all([load(img.src), load(img.src.replace('/tail.svg', '/tassel.svg'))]).then(([beadSvg, tasselSvg]) => {
    const svg = document.importNode(beadSvg, true);
    svg.style.cssText = 'display:block;width:100%;height:100%;overflow:visible';
    const circles = [...svg.querySelectorAll('circle')];
    // each link a group inside the one above, so they turn on each other
    let into = svg;
    LINKS.forEach((l) => {
      l.g = document.createElementNS(NS, 'g');
      into.appendChild(l.g);
      l.take.forEach((i) => l.g.appendChild(circles[i]));
      into = l.g;
    });
    // the strands come out from under the last bead and the little eye
    const last = LINKS[LINKS.length - 1].g;
    const paths = [...tasselSvg.querySelectorAll('path')].map((p) => document.importNode(p, true));
    paths.reverse().forEach((p) => last.prepend(p));
    paths.reverse();
    LINKS[3].g.prepend(last);
    img.replaceWith(svg);
    strands = paths.map((p, i) => ({
      p,
      rest: p.getAttribute('d'),
      cmds: p.getAttribute('d').match(/[A-Za-z][^A-Za-z]*/g).map((c) => [c[0], (c.slice(1).match(NUM) || []).length]),
      nums: p.getAttribute('d').match(NUM).map(Number),
      b: 0, vb: 0,
      k: 55 + i * 9,          // each its own stiffness
      c: 3.2 + (i % 2) * 0.8, // and damping
      drag: 9 + i * 1.5,      // how far it trails per rad/s of swing
    }));
    requestAnimationFrame(swingChain);
  });
}
let lastT = performance.now();
function swingChain(now) {
  const dt = Math.min(0.032, (now - lastT) / 1000);
  lastT = now;
  const m = window.charmMotion ? window.charmMotion() : null;
  if (m && tail.getAnimations().length === 0) {
    let turned = m.theta + m.phi;     // how far the eye has turned from upright
    const spin = m.omega + m.omegaPhi;
    LINKS.forEach((l, i) => {
      // back towards hanging straight down (as far as its string lets it),
      // dragged behind the swing, and a slow breath of sway of its own
      const idle = Math.sin(now / (1300 + i * 170) + i) * 0.012;
      const want = -turned * l.loose - spin * l.drag + idle;
      l.va += (l.k * (want - l.a) - l.c * l.va) * dt;
      l.a = Math.max(-0.35, Math.min(0.35, l.a + l.va * dt));
      l.g.setAttribute('transform', `rotate(${(l.a * 180 / Math.PI).toFixed(3)} ${l.at[0]} ${l.at[1]})`);
      turned += l.a;
    });
    strands.forEach((st) => {
      // where its end wants to be, across, in the last bead's units:
      // straight down the screen, and dragged back against the swing
      const target = -Math.sin(turned) * LEN * 0.55 - spin * st.drag;
      st.vb += (st.k * (target - st.b) - st.c * st.vb) * dt;
      st.b = Math.max(-45, Math.min(45, st.b + st.vb * dt));
      if (Math.abs(st.b) < 0.05 && Math.abs(st.vb) < 0.05) {
        if (st.p.getAttribute('d') !== st.rest) st.p.setAttribute('d', st.rest);
        return;
      }
      let j = 0;
      const out = st.cmds.map(([c, n]) => {
        const xs = [];
        for (let q = 0; q < n; q += 2) {
          const x = st.nums[j++];
          const y = st.nums[j++];
          const u = Math.max(0, Math.min(1, (y - TOP) / LEN));
          // bends more towards the end, and rises a touch as it swings out
          xs.push(`${(x + st.b * u * u).toFixed(2)} ${(y - Math.abs(st.b) * 0.15 * u * u * u).toFixed(2)}`);
        }
        return c + xs.join(' ');
      });
      st.p.setAttribute('d', out.join(''));
    });
  }
  requestAnimationFrame(swingChain);
}

// The glow (the eye's own blue) and the shake, once the bar is full. The
// shake is the fish's `translate`, apart from the swing's transform.
let tremble = null;
function glow(k) {
  fish.style.filter = k ? `drop-shadow(0 0 ${(4 + k * 5).toFixed(1)}px var(--v2-blue)) drop-shadow(0 0 ${(k * 2).toFixed(1)}px var(--ui-white))` : '';
}
function shake(px, ms, iterations = Infinity) {
  if (tremble) tremble.cancel();
  tremble = px ? fish.animate([
    { translate: '0 0' }, { translate: `${px}px ${-px * 0.4}px` }, { translate: `${-px * 0.8}px ${px * 0.5}px` },
    { translate: `${px * 0.6}px ${px * 0.3}px` }, { translate: `${-px}px ${-px * 0.3}px` }, { translate: '0 0' },
  ], { duration: ms, iterations }) : null;
}
// Full: the swing dies away, it rises up its string as it starts to glow,
// then shakes faster and harder, burning brighter, till it breaks
const STILL = 700;
const RISE = 800;
const SHAKE = 1300;
function buildUp() {
  window.charmHold(0);
  setTimeout(() => {
    window.charmHold(26);
    Sounds.surge((RISE + SHAKE) / 1000);
    const t0 = performance.now();
    (function ramp(now) {
      const u = Math.min(1, (now - t0) / (RISE + SHAKE));
      glow(u * u * 10);
      if (u < 1) requestAnimationFrame(ramp);
    })(t0);
    [[0.6, 110], [1.5, 85], [3, 65], [5, 50], [7.5, 40]].forEach(([px, ms], i) => setTimeout(() => shake(px, ms), RISE * 0.6 + i * (SHAKE / 5)));
    // broken, the empty string falls straight again
    setTimeout(() => { shake(0); shatter(); Sounds.crack(true); window.charmHold(null); }, RISE + SHAKE);
  }, STILL);
}

// Broken: the eye in jagged pieces round its middle (108, 138 in its own
// 218 x 246), each flung out a little, then falling and turning away; the
// beads and tassel drop with them
const MID = [108.2, 137.7];
const CUTS = 7;
let shards = [];
function rand(a, b) { return a + Math.random() * (b - a); }
function shatter() {
  const box = eye.getBoundingClientRect();  // only to know it's laid out
  if (!box.width) return;
  const start = rand(0, Math.PI * 2);
  const angles = Array.from({ length: CUTS }, (_, i) => start + (i + rand(0.2, 0.8)) * (Math.PI * 2 / CUTS));
  // a jagged point partway along each cut, so the pieces aren't clean wedges
  const kink = angles.map((a) => { const r = rand(35, 70); return [MID[0] + Math.cos(a + rand(-0.25, 0.25)) * r, MID[1] + Math.sin(a + rand(-0.25, 0.25)) * r]; });
  const centre = [MID[0] + rand(-8, 8), MID[1] + rand(-8, 8)];
  angles.forEach((a, i) => {
    const b = angles[(i + 1) % CUTS] + (i === CUTS - 1 ? Math.PI * 2 : 0);
    const R = 140;  // well past the rim
    const pts = [centre, kink[i]];
    for (let k = 0; k <= 4; k++) { const t = a + (b - a) * k / 4; pts.push([MID[0] + Math.cos(t) * R, MID[1] + Math.sin(t) * R]); }
    pts.push(kink[(i + 1) % CUTS]);
    const piece = eye.cloneNode(true);
    piece.classList.add('eye--shard');
    piece.style.clipPath = `polygon(${pts.map(([x, y2]) => `${x.toFixed(1)}px ${y2.toFixed(1)}px`).join(',')})`;
    const mid = (a + b) / 2;
    const out = [Math.cos(mid) * rand(18, 34), Math.sin(mid) * rand(18, 34)];
    const spin = rand(-70, 70);
    // turn about the piece's own middle
    piece.style.transformOrigin = `${(MID[0] + Math.cos(mid) * 60).toFixed(1)}px ${(MID[1] + Math.sin(mid) * 60).toFixed(1)}px`;
    eye.after(piece);
    piece.animate([
      { translate: '0 0', rotate: '0deg', opacity: 1 },
      { translate: `${out[0]}px ${out[1]}px`, rotate: `${spin * 0.15}deg`, opacity: 1, offset: 0.18 },
      { translate: `${out[0] * 2.2}px ${out[1] + 820}px`, rotate: `${spin}deg`, opacity: 1 },
    ], { duration: 1300, easing: 'cubic-bezier(0.35, 0, 0.75, 0.45)', fill: 'forwards', delay: rand(0, 60) });
    shards.push(piece);
  });
  eye.style.visibility = 'hidden';
  crackSvg.style.visibility = 'hidden';
  // the glow goes out as it breaks
  fish.animate([{ filter: fish.style.filter }, { filter: 'drop-shadow(0 0 0 transparent)' }], { duration: 500, fill: 'forwards' });
  // and all that hung on it, the knot and the beads and tassel, falls too
  [[tail, 18, 0], [knot, -40, 30]].forEach(([el, spin, delay]) => el.animate([
    { translate: '0 0', rotate: '0deg' },
    { translate: '0 -10px', rotate: `${spin * 0.2}deg`, offset: 0.15 },
    { translate: `${spin * 0.3}px 900px`, rotate: `${spin}deg` },
  ], { duration: 1300, easing: 'cubic-bezier(0.4, 0, 0.8, 0.5)', fill: 'forwards', delay }));
}
function mend() {
  shards.forEach((p) => p.remove());
  shards = [];
  if (!eye) return;
  eye.style.visibility = '';
  crackSvg.style.visibility = '';
  [tail, knot, fish].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  tremble = null;
  glow(0);
}

addEventListener('charm-hit', (e) => {
  const n = e.detail;
  runs.forEach((pair, i) => pair.forEach((p) => p.classList.toggle('is-run', i < n)));
  if (!n) { mend(); return; }
  const last = n === CRACKS.length;
  setTimeout(() => Sounds.crack(), 60);
  // the bar's full: it builds, and it breaks
  if (last) setTimeout(buildUp, 250);
});
})();
