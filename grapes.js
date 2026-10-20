// 12 Grapes at Midnight (Figma 436:8975): eat all twelve grapes before
// twelve seconds run out. The clock starts with the first grape; each one
// pops and is eaten; each second ticks. All twelve in time and the luck is
// claimed; out of time, the bunch fills back up for another try.

// The grapes in the 352 x 499 bunch: [cx, cy, r], drawn in Figma's order
const GRAPES = [
  [95.7, 313.9, 54.6], [167.9, 432.1, 50.3], [140.7, 354.9, 54.6], [210.7, 369.9, 54.6],
  [220.7, 307.9, 54.6], [72.2, 246.1, 54.6], [267.7, 255, 54.6], [90.6, 184.8, 54.6],
  [232.7, 167.3, 54.6], [158.6, 159.3, 54.6], [133.9, 267.4, 54.6], [203.7, 234.5, 54.6],
];
const SECONDS = 12;
const IN_SHEET = new URLSearchParams(location.search).has('sheet');

const root = document.getElementById('grapes');
const svg = document.getElementById('svg');
const fill = document.getElementById('fill');
const secs = document.getElementById('secs');
const hint = document.getElementById('hint');
const timer = document.querySelector('.timer');

const grapes = GRAPES.map(([cx, cy, r], i) => {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('class', 'grape');
  c.setAttribute('cx', cx);
  c.setAttribute('cy', cy);
  c.setAttribute('r', r);
  c.setAttribute('role', 'button');
  c.setAttribute('aria-label', `Grape ${i + 1}`);
  c.setAttribute('tabindex', '0');
  c.dataset.silent = '';  // it makes its own eating sound
  c.addEventListener('click', () => eat(c));
  c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); eat(c); } });
  svg.appendChild(c);
  return c;
});

// As big as fits: never wider than the screen, nor taller than what the
// timer and words leave
function fit() {
  const room = innerHeight - timer.offsetHeight - hint.offsetHeight - 2 * 28 - 40;
  const w = Math.min(260, innerWidth - 24, room * 352 / 499);
  root.style.setProperty('--w', `${Math.max(120, w)}px`);
}
addEventListener('resize', fit);
fit();

let eaten = 0;
let endAt = 0;
let raf = 0;
let lastShown = SECONDS;

function show(left) {
  fill.style.width = `${(left / SECONDS) * 100}%`;
  const whole = Math.ceil(left);
  if (whole !== lastShown) {
    lastShown = whole;
    secs.textContent = String(whole);
    if (whole > 0 && whole < SECONDS) Sounds.tick();  // each second going down
  }
  root.classList.toggle('is-hurry', left > 0 && left <= 3);
}

function run() {
  const left = Math.max(0, (endAt - performance.now()) / 1000);
  show(left);
  if (left <= 0) { timeUp(); return; }
  raf = requestAnimationFrame(run);
}

function eat(c) {
  if (root.dataset.step === 'done' || c.classList.contains('is-eaten')) return;
  if (root.dataset.step === 'ready') {
    // the first grape starts the clock
    root.dataset.step = 'eating';
    endAt = performance.now() + SECONDS * 1000;
    lastShown = SECONDS;
    raf = requestAnimationFrame(run);
  }
  c.classList.remove('is-back');
  c.classList.add('is-eaten');
  Sounds.eat();
  eaten++;
  const left = GRAPES.length - eaten;
  hint.classList.remove('is-missed');
  hint.textContent = left ? `${left} to go` : 'All twelve!';
  if (!left) win();
}

function win() {
  cancelAnimationFrame(raf);
  root.dataset.step = 'done';
  root.classList.remove('is-hurry');
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 900);
}

// Out of time: the bunch fills back up
function timeUp() {
  root.classList.remove('is-hurry');
  root.dataset.step = 'ready';
  hint.textContent = 'Time’s up! Tap a grape to try again';
  hint.classList.remove('is-missed');
  void hint.offsetWidth;
  hint.classList.add('is-missed');
  reset();
}
function reset() {
  eaten = 0;
  lastShown = SECONDS;
  fill.style.width = '100%';
  secs.textContent = String(SECONDS);
  grapes.forEach((g, i) => {
    if (!g.classList.contains('is-eaten')) return;
    g.classList.remove('is-eaten');
    g.style.animationDelay = `${i * 0.03}s`;
    g.classList.add('is-back');
  });
}

// The sheet's Continue sets out a fresh bunch
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  cancelAnimationFrame(raf);
  root.dataset.step = 'ready';
  hint.textContent = 'Tap a grape to start the clock';
  reset();
});
