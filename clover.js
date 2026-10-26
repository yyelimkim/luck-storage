// Finding a four-leaf clover: a field of three-leaf clovers (Figma 522:282's,
// each with its dark shadow under it) three screens wide, scattered and
// overlapping at every angle. Swipe left and right to look through it; the
// one four-leaf is somewhere off to one side. A three-leaf, tapped, gives a
// little shake; the four-leaf lifts out of the field, and the luck is claimed.

const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const root = document.getElementById('clover');
const fieldEl = document.getElementById('field');
const foundEl = document.getElementById('found');
const NS = 'http://www.w3.org/2000/svg';

const SCREENS = 3;      // how many screens wide the field is
const GAP = 140;        // between clovers, about: some touching, with ground between
const SIZE = [0.88, 1.05];  // their scale, of the Figma clover (about 180 across), as big as drawn there
// Each clover's middle, where its leaves meet, in its own drawing
const MID = { three: [89, 97], four: [95, 95] };
const BOX = { three: [180, 194], four: [190, 191] };
const TOP = 80;   // the clovers' middles keep this far down, so none reaches the top edge

const rand = (a, b) => a + Math.random() * (b - a);
let svg = null;
let W = 0;      // the field's width
let pan = 0;    // how far it's panned (0 at its left edge, negative to the right)
let vel = 0;

// The two clovers as symbols, drawn as many times as needed
const symbols = Promise.all(['three', 'four'].map((name) =>
  fetch(`assets/clover/${name}.svg?v=1`).then((r) => r.text()).then((txt) => {
    const src = new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement;
    const sym = document.createElementNS(NS, 'symbol');
    sym.id = name;
    sym.setAttribute('viewBox', src.getAttribute('viewBox'));
    [...src.children].forEach((c) => sym.appendChild(document.importNode(c, true)));
    return sym;
  })));

function clover(name, x, y, rot, s) {
  const u = document.createElementNS(NS, 'use');
  u.setAttribute('href', `#${name}`);
  const [w, h] = BOX[name];
  u.setAttribute('width', w);
  u.setAttribute('height', h);
  const [mx, my] = MID[name];
  u.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s.toFixed(3)}) translate(${-mx} ${-my})`);
  if (name === 'four') u.dataset.four = '';
  return u;
}

// Lay the field out afresh: a jittered grid of three-leaf clovers, every
// other row shifted, in a shuffled order so they overlap any which way. The
// four-leaf goes somewhere in the left or the right screen, never the
// middle one it starts on, with nothing laid right over its middle.
let four = null;
function layout(defs) {
  const vw = innerWidth;
  const H = fieldEl.clientHeight;
  W = vw * SCREENS;
  svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  const d = document.createElementNS(NS, 'defs');
  defs.forEach((s) => d.appendChild(s.cloneNode(true)));
  svg.appendChild(d);

  // just out of sight to one side of the middle screen it starts on, so a
  // short swipe the right way brings it in
  const onLeft = Math.random() < 0.5;
  const fx = onLeft ? vw - rand(0.15, 0.45) * vw : 2 * vw + rand(0.15, 0.45) * vw;
  const fy = Math.max(TOP + 30, rand(0.3, 0.6) * H);
  const pts = [];
  for (let r = 0; r * GAP * 0.85 < H + GAP; r++) {
    for (let c = -1; c * GAP < W + GAP; c++) {
      const x = (c + (r % 2) * 0.5 + rand(-0.35, 0.35)) * GAP;
      const y = TOP + (r + rand(-0.3, 0.3)) * GAP * 0.85;
      if (y < TOP) continue;
      if (Math.hypot(x - fx, y - fy) < 120) continue;  // room round it, so it isn't lost in a clump
      pts.push([x, y]);
    }
  }
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  pts.forEach(([x, y]) => svg.appendChild(clover('three', x, y, rand(0, 360), rand(SIZE[0], SIZE[1]))));
  // the four-leaf over the rest, a touch bigger (turned and sized in a group
  // that's moved to its spot)
  const spot = document.createElementNS(NS, 'g');
  spot.setAttribute('transform', `translate(${fx.toFixed(1)} ${fy.toFixed(1)})`);
  four = clover('four', 0, 0, rand(0, 360), SIZE[1] * 1.08);
  spot.appendChild(four);
  svg.appendChild(spot);
  // and one three-leaf over it, off to one side, half burying a leaf or two
  const lean = rand(0, Math.PI * 2);
  const reach = rand(88, 102);
  svg.appendChild(clover('three', fx + Math.cos(lean) * reach, Math.max(TOP, fy + Math.sin(lean) * reach), rand(0, 360), SIZE[0]));
  fieldEl.replaceChildren(svg);
  pan = -(W - vw) / 2;  // starting in the middle
  vel = 0;
  place();
}
const minPan = () => innerWidth - W;
function place() { svg.style.transform = `translate3d(${pan.toFixed(1)}px, 0, 0)`; }

// --- Swiping through it --------------------------------------------------
let press = null;
let glide = 0;
root.addEventListener('pointerdown', (e) => {
  if (root.dataset.step !== 'look' || !svg) return;
  Sounds.unlock();
  stopHint();
  cancelAnimationFrame(glide);
  try { root.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ }
  press = { x: e.clientX, y: e.clientY, pan, t: performance.now(), lastX: e.clientX, lastT: performance.now(), moved: false, target: e.target };
  vel = 0;
});
root.addEventListener('pointermove', (e) => {
  if (!press) return;
  const dx = e.clientX - press.x;
  if (!press.moved && Math.hypot(dx, e.clientY - press.y) > 8) { press.moved = true; root.classList.add('is-dragging'); }
  if (!press.moved) return;
  let p = press.pan + dx;
  // past either end it gives, and no more
  if (p > 0) p *= 0.35;
  if (p < minPan()) p = minPan() + (p - minPan()) * 0.35;
  pan = p;
  place();
  const now = performance.now();
  vel = (e.clientX - press.lastX) / Math.max(1, now - press.lastT) * 16;  // px a frame
  press.lastX = e.clientX;
  press.lastT = now;
});
function release(e) {
  if (!press) return;
  const p = press;
  press = null;
  root.classList.remove('is-dragging');
  if (!p.moved) { tapped(p.target, p.x, p.y); return; }
  // let go, it glides on and settles, and springs back in from past an end
  (function coast() {
    vel *= 0.94;
    pan += vel;
    const lo = minPan();
    if (pan > 0) { pan += (0 - pan) * 0.2; vel *= 0.5; }
    if (pan < lo) { pan += (lo - pan) * 0.2; vel *= 0.5; }
    place();
    if (Math.abs(vel) > 0.2 || pan > 0.5 || pan < lo - 0.5) glide = requestAnimationFrame(coast);
  })();
}
root.addEventListener('pointerup', release);
root.addEventListener('pointercancel', release);

// --- Tapping one ---------------------------------------------------------
function tapped(target, x, y) {
  // on it, or near enough (between its leaves too), counts as finding it
  const r = four.getBoundingClientRect();
  if (Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < r.width * 0.36) { found(four); return; }
  const u = target.closest && target.closest('use');
  if (!u) return;
  if (u.dataset.four == null) {
    u.classList.remove('is-nope');
    void u.getBoundingClientRect();
    u.classList.add('is-nope');
    Sounds.tap();
    return;
  }
  found(u);
}
function found(u) {
  root.dataset.step = 'found';
  Sounds.chime();
  // lift it out of the field: the same clover, from where it lies to the
  // middle, turning and growing, with a glow round it
  const r = u.getBoundingClientRect();
  const m = u.getAttribute('transform').match(/rotate\(([-\d.]+)\) scale\(([-\d.]+)\)/);
  const rot = Number(m[1]);
  const s = Number(m[2]);
  const lift = document.createElementNS(NS, 'svg');
  const [w, h] = BOX.four;
  const [mx, my] = MID.four;
  lift.setAttribute('width', w);
  lift.setAttribute('height', h);
  lift.setAttribute('viewBox', `0 0 ${w} ${h}`);
  lift.innerHTML = '<use href="#four"></use>';
  lift.querySelector('use').setAttribute('width', w);
  lift.querySelector('use').setAttribute('height', h);
  // (its symbol is the field's, which stays, faded, behind it)
  Object.assign(lift.style, { left: `${-mx}px`, top: `${-my}px`, transformOrigin: `${mx}px ${my}px` });
  foundEl.replaceChildren(lift);
  u.style.visibility = 'hidden';
  const cx = innerWidth / 2;
  const cy = fieldEl.clientHeight * 0.48;
  const big = Math.min(1.1, (innerWidth * 0.55) / w);
  lift.animate([
    { transform: `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) rotate(${rot}deg) scale(${s})` },
    { transform: `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2 - 14}px) rotate(${rot}deg) scale(${s * 1.15})`, offset: 0.2 },
    { transform: `translate(${cx}px, ${cy}px) rotate(${rot + 40}deg) scale(${big})` },
  ], { duration: 1100, easing: 'cubic-bezier(0.3, 0.8, 0.2, 1)', fill: 'forwards' });
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 1700);
}

// --- The hand: a swipe across, one way then the other, till you start ----
let hand = null;
let hintTimer = setTimeout(showHint, 900);
function showHint() {
  hand = document.createElement('img');
  hand.className = 'clover--hand';
  hand.src = 'assets/candles/hand.svg';
  hand.alt = '';
  hand.style.left = `${innerWidth / 2 - 18}px`;
  hand.style.top = `${fieldEl.clientHeight * 0.55}px`;
  root.appendChild(hand);
  const at = (x, o, sc = 1) => ({ translate: `${x}px 0`, opacity: o, scale: sc });
  hand.animate([
    at(60, 0), at(60, 1, 1), at(60, 1, 0.88), at(-60, 1, 0.88), at(-60, 0, 1),
    at(-60, 0), at(-60, 1, 1), at(-60, 1, 0.88), at(60, 1, 0.88), at(60, 0, 1),
  ].map((k, i) => ({ ...k, offset: [0, 0.08, 0.14, 0.36, 0.44, 0.5, 0.58, 0.64, 0.86, 0.94][i] })),
  { duration: 3600, iterations: Infinity, easing: 'ease-in-out' });
}
function stopHint() {
  clearTimeout(hintTimer);
  if (hand) { hand.remove(); hand = null; }
}

// The sheet's Continue: a new field to look through
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  root.dataset.step = 'look';
  foundEl.replaceChildren();
  symbols.then(layout);
});

// Laid out for the field's size, and again whenever that changes (the
// sheet it's on settles into place after the page has loaded)
let laidFor = '';
let resizing = 0;
new ResizeObserver(() => {
  const size = `${innerWidth}x${fieldEl.clientHeight}`;
  if (size === laidFor || !fieldEl.clientHeight) return;
  clearTimeout(resizing);
  resizing = setTimeout(() => {
    if (root.dataset.step !== 'look') return;
    laidFor = `${innerWidth}x${fieldEl.clientHeight}`;
    symbols.then(layout);
  }, 120);
}).observe(fieldEl);
