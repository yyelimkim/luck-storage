// Pig Dreams (Figma 537:957, 537:1248): three pigs hide behind three hills,
// as in whack-a-mole. Each pops up for a moment, now and then, and ducks
// back down; tap it while it's up to catch it, and it flies up to its place
// at the top. They're quicker to duck with each one caught. With all three
// caught the view rises to the sky: a sun like a coin comes up, and a line
// about the dream sits in the middle of it.

const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const root = document.getElementById('pg');
const world = document.getElementById('world');
const caughtRow = document.getElementById('caught');
const DIR = 'assets/pig/';

// A drawing at its box in the scene (the design's frame)
function img(src, [x, y, w, h], cls = '') {
  const el = document.createElement('img');
  el.src = `${DIR}${src}.svg?v=1`;
  el.alt = '';
  el.draggable = false;
  if (cls) el.className = cls;
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  return el;
}

// The pigs, back to front, each behind its own hill, and how far each
// ducks down to be out of sight
const PIGS = [
  { src: 'pig-3', box: [266, 349, 97, 95], drop: 110, slot: [58, 57] },
  { src: 'pig-2', box: [133, 432, 75, 69], drop: 85, slot: [50, 46] },
  { src: 'pig-1', box: [50, 553, 97, 94], drop: 110, slot: [49, 48] },
];
const HILLS = [
  ['hill-back', [-129, 331, 582.14, 570.72]],
  ['hill-mid', [-15, 447, 627.84, 455.8]],
  ['hill-front', [-108, 616, 580.31, 320.55]],
];

let k = 1;
function fit() {
  k = innerWidth / 402;
  root.style.setProperty('--k', k.toFixed(4));
}
// Where the sun sits in the scene so that, risen to, it's just under the row
// of pigs at the top; and the line just under it
const SUN_TOP = 92;  // px down the screen
function sunY() {
  const top = innerHeight - 874 * k + 311 * k;  // the scene's top on the screen, once risen
  return (SUN_TOP - top) / k;
}
function placeQuote() {
  document.querySelector('.pg--quote').style.top = `${SUN_TOP + 164 * k + 26}px`;
}
addEventListener('resize', fit);

function build() {
  world.replaceChildren(
    img('cloud', [-9, 182, 162.45, 69.18], 'pg--cloud is-left'),
    img('cloud', [265, 240, 162.45, 69.18], 'pg--cloud is-right'),
    img('cloud', [215, 8, 162.45, 69.18], 'pg--cloud is-right'),   // the sky's, for the end
    img('coin', [119, sunY(), 164, 164], 'pg--sun'),
  );
  PIGS.forEach((p, i) => {
    const [x, y, w, h] = p.box;
    p.el = document.createElement('div');
    p.el.className = 'pg--pig';
    p.el.setAttribute('role', 'button');
    p.el.setAttribute('aria-label', 'A pig');
    Object.assign(p.el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, transform: `translateY(${p.drop}px)` });
    p.el.appendChild(img(p.src, [0, 0, w, h]));
    p.el.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(p); });
    world.appendChild(p.el);
    world.appendChild(img(...HILLS[i]));
    p.up = false;
    p.caught = false;
  });
  // the row at the top: front pig first, as the design's
  caughtRow.replaceChildren();
  [...PIGS].reverse().forEach((p) => {
    p.slotEl = document.createElement('img');
    p.slotEl.className = 'pg--slot';
    p.slotEl.src = `${DIR}${p.src}.svg?v=1`;
    p.slotEl.alt = '';
    Object.assign(p.slotEl.style, { width: `${p.slot[0] * k}px`, height: `${p.slot[1] * k}px` });
    caughtRow.appendChild(p.slotEl);
  });
}

// --- Popping up and ducking down -------------------------------------------
let timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const rand = (a, b) => a + Math.random() * (b - a);
let caughtCount = 0;
function hold() { return Math.max(320, 640 - caughtCount * 150 + rand(-70, 70)); }  // ms up
function pop(p, ms = hold()) {
  if (p.caught || root.dataset.step !== 'catch' || demo) return;
  p.el.getAnimations().forEach((a) => a.cancel());
  p.up = true;
  p.el.animate([{ transform: `translateY(${p.drop}px)` }, { transform: 'translateY(-6px)', offset: 0.75 }, { transform: 'translateY(0)' }],
    { duration: 220, easing: 'cubic-bezier(0.3, 0.8, 0.4, 1)', fill: 'forwards' });
  later(() => {
    if (p.caught) return;
    p.up = false;
    p.el.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${p.drop}px)` }],
      { duration: 200, easing: 'cubic-bezier(0.5, 0, 0.8, 0.5)', fill: 'forwards' });
    later(() => pop(p), rand(900, 2300));
  }, 220 + ms);
}

// --- Catching one --------------------------------------------------------
function tap(p) {
  if (demo || !p.up || p.caught || root.dataset.step !== 'catch') return;
  Sounds.unlock();
  Sounds.chime();
  p.caught = true;
  caughtCount++;
  // it leaps up out of its hill and flies to its place at the top
  const from = p.el.getBoundingClientRect();
  const to = p.slotEl.getBoundingClientRect();
  const fly = document.createElement('img');
  fly.className = 'pg--fly';
  fly.src = `${DIR}${p.src}.svg?v=1`;
  Object.assign(fly.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  root.appendChild(fly);
  p.el.classList.add('is-caught');
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const sc = to.width / from.width;
  fly.animate([
    { transform: 'translate(0, 0) scale(1) rotate(0)' },
    { transform: `translate(${dx * 0.3}px, ${dy * 0.35 - 60}px) scale(1.1) rotate(-12deg)`, offset: 0.35 },
    { transform: `translate(${dx}px, ${dy}px) scale(${sc}) rotate(0)` },
  ], { duration: 750, easing: 'cubic-bezier(0.4, 0, 0.3, 1)', fill: 'forwards' }).finished.then(() => {
    fly.remove();
    p.slotEl.classList.add('is-in');
    if (caughtCount === PIGS.length) later(toSky, 500);
  });
}

// All three: up to the sky, the coin sun rising, the line in the middle
function toSky() {
  root.dataset.step = 'done';
  root.classList.add('is-sky');
  later(() => Sounds.shimmer(), 1500);
  if (IN_SHEET) later(() => parent.postMessage('luck-claimed', '*'), 4600);
}

function start() {
  timers.forEach(clearTimeout);
  timers = [];
  caughtCount = 0;
  root.dataset.step = 'catch';
  root.classList.remove('is-sky');
  fit();
  build();
  placeQuote();
  // the hand shows how once the sheet's up (or straight away, on its own)
  if (IN_SHEET) waitingToShow = true; else showHow();
}
let waitingToShow = false;
addEventListener('message', (e) => {
  if (e.data === 'luck-shown' && waitingToShow) { waitingToShow = false; showHow(); }
});

// Before it starts, once: the front pig comes up, the hand taps it, and it
// ducks away; then the game begins
let demo = false;
function showHow() {
  demo = true;
  const p = PIGS[2];
  later(() => {
    p.el.animate([{ transform: `translateY(${p.drop}px)` }, { transform: 'translateY(-6px)', offset: 0.75 }, { transform: 'translateY(0)' }],
      { duration: 260, easing: 'cubic-bezier(0.3, 0.8, 0.4, 1)', fill: 'forwards' });
  }, 600);
  later(() => {
    const r = p.el.getBoundingClientRect();
    const hand = document.createElement('img');
    hand.src = 'assets/candles/hand.svg';
    hand.alt = '';
    Object.assign(hand.style, { position: 'fixed', zIndex: 6, width: '54px', pointerEvents: 'none', left: `${r.left + r.width / 2 - 18}px`, top: `${r.top + r.height / 2 - 2}px` });
    root.appendChild(hand);
    hand.animate([
      { opacity: 0, translate: '22px 26px', scale: 1 },
      { opacity: 1, translate: '0 0', scale: 1, offset: 0.35 },
      { opacity: 1, translate: '0 0', scale: 0.86, offset: 0.55 },
      { opacity: 1, translate: '0 0', scale: 1, offset: 0.7 },
      { opacity: 0, translate: '10px 14px', scale: 1 },
    ], { duration: 1300, easing: 'ease-in-out', fill: 'forwards' }).finished.then(() => hand.remove());
    // as the finger presses, the pig ducks away, quick
    later(() => {
      Sounds.unlock();
      p.el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px) scale(1.05, 0.95)', offset: 0.25 }, { transform: `translateY(${p.drop}px)` }],
        { duration: 300, easing: 'cubic-bezier(0.5, 0, 0.8, 0.5)', fill: 'forwards' });
    }, 720);
  }, 1100);
  // then they all take their turns
  later(() => {
    demo = false;
    pop(PIGS[2]);
    later(() => pop(PIGS[1]), 1200);
    later(() => pop(PIGS[0]), 2200);
  }, 3300);
}
// The sheet's Continue: the pigs back behind their hills
addEventListener('message', (e) => { if (e.data === 'luck-continue') start(); });
start();
