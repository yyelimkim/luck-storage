// Dreamcatcher (the card's own, Figma 234:1369): tap it to wake it and its
// hoop starts to spin, glowing. Then the bad dreams (Figma 529:450, 529:465,
// 529:455) drift in from the edges one at a time, wavering as they come,
// their faintness rising and falling, and each melts away as it reaches the
// web. With the last of them caught the glow fades, the hoop slows to a
// stop, and the luck is claimed.

const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const root = document.getElementById('dc');
const art = document.getElementById('art');
const hoop = document.getElementById('hoop');
const turn = document.getElementById('turn');
// the rim's layers, through the hoop's thickness
for (let z = -10; z <= 10; z += 1) {
  const rim = document.createElement('div');
  rim.className = 'dc--rim';
  rim.style.transform = `translateZ(${z}px)`;
  turn.insertBefore(rim, turn.querySelector('.dc--back'));
}
// and the strands, beads and feathers under it, a thickness of their own
turn.querySelectorAll('.dc--strand').forEach((s) => {
  for (const z of [-4, -3, -2, -1, 1, 2, 3, 4]) {
    const layer = s.cloneNode();
    layer.style.transform = `translateZ(${z}px)`;
    s.before(layer);
  }
});
const dreams = document.getElementById('dreams');

// The drawing as big as fits, its hoop a little above the middle of the
// room, its strands' tips just over the words, the string running up off
// the top
let k = 1;
function fit() {
  const room = innerHeight - 120 - 16;
  k = Math.min(1, (innerWidth - 48) / 308, room / 640);
  root.style.setProperty('--k', k.toFixed(3));
  root.style.setProperty('--top', `${(room + 4 - 732 * k).toFixed(1)}px`);
}
addEventListener('resize', fit);
fit();
// where the hoop's middle is on the screen, and how big it is there
function centre() {
  const r = hoop.getBoundingClientRect();
  // (its height: its width narrows as it turns)
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.height / 2 };
}

// The bad dreams, each from its own edge, one after another
const GHOSTS = [
  { src: 'ghost-1', w: 314.294, h: 419.094, from: [-0.35, -0.55], at: 500 },
  { src: 'ghost-2', w: 292.608, h: 380.768, from: [1.35, 0.15], at: 2100 },
  { src: 'ghost-3', w: 283.576, h: 374.592, from: [-0.35, 0.45], at: 3700 },
];
const SIZE = 0.42;   // of their drawn size, at the dreamcatcher's scale
let ghosts = [];
function release(g) {
  const img = document.createElement('img');
  img.className = 'dc--ghost';
  img.src = `assets/dreamcatcher/${g.src}.svg?v=1`;
  img.alt = '';
  const w = g.w * SIZE * k;
  const h = g.h * SIZE * k;
  Object.assign(img.style, { width: `${w}px`, height: `${h}px`, opacity: 0 });
  dreams.appendChild(img);
  const c = centre();
  ghosts.push({
    img, w, h,
    x: g.from[0] * innerWidth + (g.from[0] < 0.5 ? 0 : 0),
    y: c.y + g.from[1] * innerHeight * 0.5,
    t: 0,
    phase: Math.random() * Math.PI * 2,
    speed: 62 + Math.random() * 14,  // px a second
    state: 'drift',
  });
}

// --- Waking it ------------------------------------------------------------
let unpoint = () => {};
setTimeout(() => { if (root.dataset.step === 'tap') unpoint = pointAt(hoop); }, 900);
hoop.addEventListener('click', () => {
  if (root.dataset.step !== 'tap') return;
  unpoint();
  Sounds.unlock();
  Sounds.shimmer();
  root.dataset.step = 'catch';
  root.classList.add('is-awake');
  spinTo = 200;  // deg a second: a turn every couple of seconds
  GHOSTS.forEach((g) => timers.push(setTimeout(() => release(g), g.at)));
});
let timers = [];

// --- Every frame: the spin, and the dreams drifting in ----------------------
let spin = 0;
let spinV = 0;
let spinTo = 0;
let rest = null;  // where it comes to rest, once it's done
let caught = 0;
let last = performance.now();
function tick(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  // it turns over and over, front to back, when woken; once it's done it
  // slows and comes to rest facing us again
  if (rest === null) {
    spinV += (spinTo - spinV) * Math.min(1, dt * 1.2);
    spin += spinV * dt;
  } else {
    spin += (rest - spin) * Math.min(1, dt * 1.6);
  }
  // flat, at eye level: no perspective, so it narrows evenly to its edge
  turn.style.transform = `rotateY(${spin.toFixed(2)}deg)`;

  const c = centre();
  for (const g of ghosts) {
    if (g.state === 'gone') continue;
    g.t += dt;
    if (g.state === 'drift') {
      // on towards the hoop's middle...
      const dx = c.x - g.x;
      const dy = c.y - g.y;
      const d = Math.hypot(dx, dy) || 1;
      g.x += (dx / d) * g.speed * dt;
      g.y += (dy / d) * g.speed * dt;
      // ...wavering across its way, and its faintness coming and going
      const wave = Math.sin(g.t * Math.PI * 1.1 + g.phase) * 14;
      const bob = Math.sin(g.t * Math.PI * 0.8 + g.phase * 2) * 6;
      const px = g.x + (-dy / d) * wave;
      const py = g.y + (dx / d) * wave + bob;
      const fade = Math.min(1, g.t / 0.8);
      const op = fade * (0.8 + 0.14 * Math.sin(g.t * 1.9 + g.phase) + 0.06 * Math.sin(g.t * 4.3));
      const tilt = Math.sin(g.t * 1.3 + g.phase) * 6;
      g.img.style.opacity = op.toFixed(3);
      g.img.style.transform = `translate(${(px - g.w / 2).toFixed(1)}px, ${(py - g.h / 2).toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)`;
      // near enough the web, it melts away into it
      if (d < c.r * 1.05) dissolve(g, px, py, op, c);
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function dissolve(g, x, y, op, c) {
  g.state = 'gone';
  Sounds.capture();
  const from = `translate(${(x - g.w / 2).toFixed(1)}px, ${(y - g.h / 2).toFixed(1)}px)`;
  const to = `translate(${(x + (c.x - x) * 0.4 - g.w / 2).toFixed(1)}px, ${(y + (c.y - y) * 0.4 - g.h / 2).toFixed(1)}px)`;
  g.img.animate([
    { transform: `${from} scale(1)`, opacity: op, filter: 'blur(0)' },
    { transform: `${to} scale(0.45)`, opacity: 0, filter: 'blur(6px)' },
  ], { duration: 750, easing: 'cubic-bezier(0.4, 0, 0.7, 0.4)', fill: 'forwards' });
  caught++;
  if (caught === GHOSTS.length) setTimeout(calm, 800);
}

// All caught: the glow goes out, the hoop winds down, the luck is claimed
function calm() {
  root.classList.add('is-calm');
  root.dataset.step = 'done';
  rest = (Math.ceil(spin / 360) + 1) * 360;  // on round, to facing us
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 1600);
}

// The sheet's Continue: asleep again
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  timers.forEach(clearTimeout);
  timers = [];
  ghosts.forEach((g) => g.img.remove());
  ghosts = [];
  caught = 0;
  spin = 0; spinV = 0; spinTo = 0; rest = null;
  root.classList.remove('is-awake', 'is-calm');
  root.dataset.step = 'tap';
});
