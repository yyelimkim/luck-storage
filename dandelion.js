// A dandelion wish (Figma 234:2052): a hand holds up a dandelion clock,
// a few seeds already drifting off. Make your wish, then blow: a swipe left
// to right across the screen. The wind tips the dandelion over to the right
// from where it's held, its twelve seeds lift off and float away on the
// breeze, the yellow of its head fading as they go, and the camera follows
// them along to the right till the last has floated out of sight.

const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const root = document.getElementById('dl');
const world = document.getElementById('world');
const art = document.getElementById('art');
const form = document.getElementById('wish-form');
const input = document.getElementById('wish');
const send = document.getElementById('send');
const DIR = 'assets/dandelion/';

// A layer: its box in the drawing, and inside it (centred, turned `rot`)
// either one of Figma's drawings at its own size, or a plain shape
function part(p) {
  const [x, y, w, h] = p.box;
  const el = document.createElement('div');
  el.className = `part ${p.cls || ''}`;
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  const inner = document.createElement(p.src ? 'img' : 'div');
  if (p.src) { inner.src = `${DIR}${p.src}.svg?v=1`; inner.alt = ''; inner.draggable = false; }
  const [iw, ih] = p.inner || [w, h];
  Object.assign(inner.style, { width: `${iw}px`, height: `${ih}px` }, p.style || {});
  if (p.rot) inner.style.rotate = `${p.rot}deg`;
  el.appendChild(inner);
  return el;
}

// Where it's held: the dandelion tips over about this point
const PIVOT = [222, 470];
const HEAD = [250.3, 174.45];  // the head's middle
const SEED = [26.1357, 62.2061];

let stem;
let head;
let glow;
function build() {
  art.replaceChildren();
  const add = (p) => { const el = part(p); art.appendChild(el); return el; };
  // the glow behind the head (it goes where the head goes)
  glow = add({ box: [120.3, 45.3, 259.1, 259.1], style: { borderRadius: '50%', background: '#54bcb7' } });
  // the hand: the middle fingers behind the stem, the hand over it
  add({ box: [208.2, 368.2, 149.6, 349.3], inner: [151.122, 350.79], src: 'finger-1' });
  add({ box: [189.7, 319.9, 149.6, 349.3], inner: [151.122, 350.79], src: 'finger-2' });
  stem = add({ box: [178.3, 239.0, 103.2, 365.2], inner: [75.3489, 360.39], rot: 4.5, src: 'stem' });
  add({ box: [0, 272.9, 379.1, 540.1], inner: [379.131, 540.125], src: 'hand' });
  add({ box: [140.6, 379.4, 106.3, 106.1], inner: [76.2203, 74.963], rot: -141.7, src: 'nail-1' });
  add({ box: [303.9, 267.0, 93.0, 92.7], inner: [68.6847, 67.7097], rot: 150.7, src: 'nail-2' });
  add({ box: [0, 272.9, 379.1, 540.1], inner: [380.632, 541.625], src: 'hand-line' });
  add({ box: [244.7, 437.7, 13.5, 14.0], inner: [12.5038, 6.97534], rot: -131.3, src: 'line-1' });
  add({ box: [231.5, 421.6, 10.2, 10.8], inner: [10.745, 4.13515], rot: -131.3, src: 'line-2' });
  add({ box: [238.3, 455.8, 9.3, 5.8], inner: [8.74849, 3.25789], rot: -162.2, src: 'line-3' });
  add({ box: [287.0, 574.2, 63.0, 21.0], style: { background: '#ebed9e' } });
  // the head: its yellow, its seeds, and the bare white middle they leave
  head = document.createElement('div');
  head.className = 'part dl--head';
  Object.assign(head.style, { left: '152.7px', top: '77.7px', width: '194.302px', height: '194.302px' });
  head.innerHTML = `<img class="dl--rings" src="${DIR}rings.svg?v=1" alt="" style="position:absolute;inset:0;width:100%;height:100%">
    <img class="dl--seeds" src="${DIR}seeds.svg?v=1" alt="" style="position:absolute;inset:0;width:100%;height:100%">
    <svg viewBox="0 0 194.302 194.302" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible"><circle cx="97.6" cy="96.75" r="29.85" fill="#F0F0F0" stroke="#272727" stroke-width="1.5"/></svg>`;
  art.appendChild(head);
  // all three turn about where it's held
  [stem, head, glow].forEach((el) => {
    el.style.transformOrigin = `${PIVOT[0] - parseFloat(el.style.left)}px ${PIVOT[1] - parseFloat(el.style.top)}px`;
  });
  seeds = [];
}

// A seed in the air, by its middle and its turn
let seeds = [];
function seed(cx, cy, rot) {
  const img = document.createElement('img');
  img.className = 'dl--seed';
  img.src = `${DIR}seed.svg?v=1`;
  img.alt = '';
  img.draggable = false;
  Object.assign(img.style, { left: `${-SEED[0] / 2}px`, top: `${-SEED[1] / 2}px`, width: `${SEED[0]}px`, height: `${SEED[1]}px` });
  art.appendChild(img);
  const s = { img, x: cx, y: cy, rot, moving: false, gone: false };
  place(s);
  return s;
}
function place(s) { s.img.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) rotate(${(s.rot + (s.sway || 0)).toFixed(1)}deg)`; }

// As big as fits: the head and the hand that holds it above the words
let k = 1;
function fit() {
  k = Math.min(1, (innerWidth * 0.98) / 397, (innerHeight - 120 - 50) / 600);
  root.style.setProperty('--k', k.toFixed(3));
}
addEventListener('resize', fit);

// --- The wish ------------------------------------------------------------
input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  Sounds.unlock();
  input.blur();
  root.dataset.step = 'blow';
  setTimeout(showHint, 600);
});

// --- The hand: a swipe across the head, left to right, till you blow ------
let hint = null;
function showHint() {
  if (root.dataset.step !== 'blow') return;
  const r = art.getBoundingClientRect();
  hint = document.createElement('img');
  hint.className = 'dl--hint';
  hint.src = 'assets/candles/hand.svg';
  hint.alt = '';
  hint.style.left = `${r.left + HEAD[0] * k - 18}px`;
  hint.style.top = `${r.top + (HEAD[1] + 30) * k}px`;
  root.appendChild(hint);
  const at = (x, o, sc = 1) => ({ translate: `${x}px 0`, opacity: o, scale: sc });
  hint.animate([at(-110, 0), at(-110, 1), at(-110, 1, 0.88), at(110, 1, 0.88), at(110, 0)]
    .map((f, i) => ({ ...f, offset: [0, 0.12, 0.2, 0.7, 0.85][i] })),
  { duration: 2000, iterations: Infinity, easing: 'ease-in-out', delay: 200 });
}
function stopHint() { if (hint) { hint.remove(); hint = null; } }

// --- Blowing: a swipe to the right ----------------------------------------
let press = null;
root.addEventListener('pointerdown', (e) => {
  if (root.dataset.step !== 'blow') return;
  press = { x: e.clientX, y: e.clientY, t: performance.now() };
});
root.addEventListener('pointermove', (e) => {
  if (!press) return;
  const dx = e.clientX - press.x;
  if (dx > 70 && dx > Math.abs(e.clientY - press.y)) {
    const speed = dx / Math.max(60, performance.now() - press.t);  // px a ms
    press = null;
    blow(Math.min(1.4, 0.7 + speed * 0.5));
  }
});
const lift = () => { press = null; };
root.addEventListener('pointerup', lift);
root.addEventListener('pointercancel', lift);

// The wind: the dandelion tips over to the right and springs back a little
// short of upright, and the seeds go, the outer ones first
let tilt = 0;
let tiltV = 0;
let tiltTo = 0;
let cam = 0;
let camV = 0;
const CAM_FOLLOW = 1500;  // ms the camera follows them for
let blownAt = 0;
function blow(strength) {
  stopHint();
  root.dataset.step = 'gone';
  Sounds.blow(strength);
  blownAt = performance.now();
  tiltV = 70 * strength;   // deg a second, a gust
  tiltTo = 9;              // and it stays leaning in the breeze
  // the twelve on the head, where they are with it tipped, lift off one by one
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const th = (i * 30 * Math.PI) / 180;
      const [px, py] = [HEAD[0] + Math.sin(th) * 54.1, HEAD[1] - Math.cos(th) * 54.1];
      const a = (tilt * Math.PI) / 180;
      const dx = px - PIVOT[0];
      const dy = py - PIVOT[1];
      const s = seed(PIVOT[0] + dx * Math.cos(a) - dy * Math.sin(a), PIVOT[1] + dx * Math.sin(a) + dy * Math.cos(a), i * 30 + tilt);
      s.sway = 0;
      launch(s, strength);
      seeds.push(s);
    }, 30 + ((i + 3) % 12) * 22 + Math.random() * 20);  // from the right side round, quickly
  }
}
function launch(s, strength) {
  s.moving = true;
  // scattered: some caught hard by the gust, some lightly, some lifting,
  // some dipping before they rise
  s.vx = rand(170, 580) * strength;   // the gust, easing off to the breeze
  s.breeze = rand(140, 420);           // each at its own pace, so they spread out wide
  s.vy = rand(-110, 70);               // spread up and down, but kept in the frame
  s.rise = rand(-22, -4);
  s.bob = rand(8, 16);     // a slight wave up and down as they go
  s.freq = rand(0.5, 0.9);
  s.phase = rand(0, Math.PI * 2);
  s.spin = rand(-50, 50);
  s.lie = rand(70, 110);  // they float lying on the wind, fluff first
  s.t = 0;
}
const rand = (a, b) => a + Math.random() * (b - a);

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (blownAt) {
    // the lean, a springy one
    tiltV += (60 * (tiltTo - tilt) - 5 * tiltV) * dt;
    tilt += tiltV * dt;
    const turn = `rotate(${tilt.toFixed(2)}deg)`;
    stem.style.transform = turn;
    head.style.transform = turn;
    glow.style.transform = turn;
    // the seeds on the breeze
    let inSight = 0;
    const r = art.getBoundingClientRect();
    for (const s of seeds) {
      if (!s.moving || s.gone) continue;
      s.t += dt;
      s.vx += (s.breeze - s.vx) * Math.min(1, dt * 0.9);
      s.vy += (s.rise - s.vy) * Math.min(1, dt * 0.6);
      s.x += s.vx * dt;
      // the wave: its height, and a little tilt with it
      const w = s.t * s.freq * Math.PI * 2 + s.phase;
      s.y += s.vy * dt + Math.cos(w) * s.bob * s.freq * Math.PI * 2 * dt;
      s.rot += ((s.lie - (s.rot % 360)) * 0.6 + s.spin * 0.2) * dt;
      s.sway = Math.sin(w) * 9;
      place(s);
      const sx = r.left + s.x * k;
      const sy = r.top + s.y * k;
      if (sx - 30 > innerWidth || sx < -60 || sy < -60) { s.gone = true; s.img.remove(); } else inSight++;
    }
    // the camera follows them for a moment and a half, at their own pace,
    // then stops, and they blow on out of the frame
    // (it keeps the middle of them a little left of the middle of the
    // screen, so they've room to scatter on ahead)
    const since = now - blownAt;
    // as the camera stops, the words: in the middle, over the seeds going
    if (since > CAM_FOLLOW && !root.classList.contains('is-wind')) root.classList.add('is-wind');
    const flying = seeds.filter((s) => s.moving && !s.gone);
    if (since < CAM_FOLLOW && flying.length) {
      const mid = flying.reduce((sum, s) => sum + s.x, 0) / flying.length;
      const want = (art.offsetLeft + 198.5) + (mid - 198.5) * k - innerWidth * 0.42;
      camV += ((want - cam) * 7 - camV) * Math.min(1, dt * 6);
    } else {
      camV -= camV * Math.min(1, dt * 9);
    }
    cam += camV * dt;
    world.style.transform = `translate3d(${(-cam).toFixed(1)}px, 0, 0)`;
    if (!inSight && seeds.length >= 12 && root.dataset.step === 'gone') finish();
  }
  requestAnimationFrame(tick);
}

function finish() {
  root.dataset.step = 'done';
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 700);
}

function start() {
  root.dataset.step = 'wish';
  input.value = '';
  send.disabled = true;
  root.classList.remove('is-wind');
  tilt = 0; tiltV = 0; tiltTo = 0; cam = 0; camV = 0; blownAt = 0;
  world.style.transform = '';
  stopHint();
  build();
  fit();
}
// The sheet's Continue: a new dandelion, and a new wish
addEventListener('message', (e) => { if (e.data === 'luck-continue') start(); });
start();
requestAnimationFrame(tick);
