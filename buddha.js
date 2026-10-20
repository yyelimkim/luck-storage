// Rubbing Buddha's belly (Figma 436:9042, 436:9128, 436:9189, 436:9248):
// 1. the Buddha; 2. up close, rub the belly round and round — three full
// circles — and it warms to a glow as the bar fills; 3. back out, the belly
// aglow and the halo blooming behind, and the luck is claimed.

const W = 321;
const H = 317;
const BELLY = [106 + 54, 155 + 30.5];  // the belly's middle, in the Buddha's units
const TURNS = 3;                       // full circles to fill the glow
const IN_SHEET = new URLSearchParams(location.search).has('sheet');

const root = document.getElementById('buddha');
const figure = document.getElementById('figure');
const belly = document.getElementById('belly');
const fill = document.getElementById('fill');
const progress = document.getElementById('progress');
const spark = document.getElementById('spark');

// Where the Buddha sits for each step, as in the frames (402 wide): its
// width there, and which point of it is at the middle of the screen
const PLACES = {
  intro: { w: 321, at: [W / 2, H / 2] },
  rub: { w: 520.9, at: BELLY },
  done: { w: 365, at: [W / 2, H / 2] },
};
function place() {
  const p = PLACES[root.dataset.step] || PLACES.intro;
  // the frames are 402 wide; up close it may run off the sides, as designed,
  // but otherwise it fits the screen
  let k = (p.w / W) * (innerWidth / 402);
  if (root.dataset.step !== 'rub') k = Math.min(k, (innerHeight - 140) / H, (innerWidth - 24) / W);
  const x = innerWidth / 2 - p.at[0] * k;
  const y = innerHeight / 2 - p.at[1] * k;
  figure.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
}
addEventListener('resize', place);
function step(name) { root.dataset.step = name; place(); }
place();
// 1 → 2: the Buddha a moment, then it comes up close by itself
setTimeout(() => step('rub'), 1300);

// 2: rubbing — the angle swept round the belly's middle adds up
let turned = 0;
let last = null;
let quarter = 0;
const done = () => root.dataset.step === 'done';
function centre() {
  const r = belly.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}
belly.addEventListener('pointerdown', (e) => {
  if (root.dataset.step !== 'rub') return;
  belly.setPointerCapture(e.pointerId);
  Sounds.unlock();
  const [cx, cy] = centre();
  last = Math.atan2(e.clientY - cy, e.clientX - cx);
  root.classList.add('is-rubbing');
});
belly.addEventListener('pointermove', (e) => {
  if (last === null || done()) return;
  const [cx, cy] = centre();
  const a = Math.atan2(e.clientY - cy, e.clientX - cx);
  let d = a - last;
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  last = a;
  turned += Math.abs(d);
  // a soft brush every quarter turn
  const q = Math.floor(turned / (Math.PI / 2));
  if (q > quarter) { quarter = q; Sounds.rub(); }
  const p = Math.min(1, turned / (TURNS * 2 * Math.PI));
  fill.style.width = `${p * 100}%`;
  progress.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  belly.style.setProperty('--glow', p.toFixed(3));
  if (p >= 1) finish();
});
const lift = () => { last = null; root.classList.remove('is-rubbing'); };
belly.addEventListener('pointerup', lift);
belly.addEventListener('pointercancel', lift);

// 3: back out, aglow, the halo blooming
function finish() {
  lift();
  belly.classList.add('is-full');
  root.classList.add('is-glowing');  // the sparkle comes up once it's all yellow
  setTimeout(() => step('done'), 500);
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 2600);
}

// The sheet's Continue starts over
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  turned = 0;
  quarter = 0;
  fill.style.width = '0';
  belly.style.setProperty('--glow', 0);
  belly.classList.remove('is-full');
  root.classList.remove('is-glowing');
  step('rub');
});
