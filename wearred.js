// Wearing Red (Figma 529:685): a figure in white shorts and blue shoes. Swipe
// across the shorts or the shoes (or tap the arrows either side of them) to
// try the next pair on — the one on slides away and the next slides in, the
// plain white base (529:846) always under the bottoms so they're never bare.
// In red bottoms and red shoes, it's done.

const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const root = document.getElementById('wr');
const fig = document.getElementById('fig');
const DIR = 'assets/red/';

// A drawing at its box in the figure (the Figma box, the export a touch
// bigger for its line, so centred on it)
function img(src, [x, y, w, h], [ew, eh] = [w, h]) {
  const el = document.createElement('img');
  el.src = `${DIR}${src}.svg?v=1`;
  el.alt = '';
  el.draggable = false;
  Object.assign(el.style, { left: `${x - (ew - w) / 2}px`, top: `${y - (eh - h) / 2}px`, width: `${ew}px`, height: `${eh}px` });
  return el;
}

// The two slots, and what can go in them, in turn (red last of each)
const SLOTS = {
  bottoms: { box: [91, 201.6, 220.6, 145.7], size: [223, 148], options: ['pants-white', 'pants-green', 'pants-blue', 'pants-red'],
    arrows: [[57, 322], [345, 322]], band: [180, 380] },  // level with the bottoms' middle, clear of the hands
  shoes: { box: [0, 510.7, 401, 102.1], size: [402, 103], options: ['shoes-blue', 'shoes-white', 'shoes-green', 'shoes-red'],
    arrows: [[-26, 571], [427, 571]], band: [430, 640] },
};
const RED = { bottoms: 'pants-red', shoes: 'shoes-red' };

const chevron = (dir) => `<svg width="11" height="18" viewBox="0 0 11 18" aria-hidden="true"><path d="${dir < 0 ? 'M9.5 1.5L2 9l7.5 7.5' : 'M1.5 1.5L9 9l-7.5 7.5'}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function build() {
  const burst = img('burst', [-51.5, 48, 504.167, 504.167]);
  burst.classList.add('wr--burst');
  fig.replaceChildren(
    burst,
    img('legs', [36.3, 205, 328.7, 362.7], [331, 365]),
    img('shirt', [14, 0, 374.8, 258.2], [375, 259]),
    img('sock-r', [251.4, 424.6, 114.3, 144.1], [115, 145]),
    img('sock-l', [35.3, 424.6, 114.7, 144.2], [115, 145]),
  );
  for (const [name, s] of Object.entries(SLOTS)) {
    if (name === 'bottoms') fig.appendChild(img('pants-base', [92, 204, 219, 132], [221, 134]));
    s.el = document.createElement('div');
    s.el.className = 'wr--slot';
    const [x, y, w, h] = s.box;
    const [ew, eh] = s.size;
    Object.assign(s.el.style, { left: `${x - (ew - w) / 2}px`, top: `${y - (eh - h) / 2}px`, width: `${ew}px`, height: `${eh}px` });
    s.at = 0;
    s.el.appendChild(slotImg(s.options[0]));
    fig.appendChild(s.el);
  }
  fig.appendChild(img('hand-r', [311, 216, 81.9, 70.2], [82, 71]));
  fig.appendChild(img('hand-l', [8, 213, 78.7, 70.2], [79, 71]));
  // the arrows
  for (const [name, s] of Object.entries(SLOTS)) {
    s.arrows.forEach(([ax, ay], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wr--arrow';
      b.setAttribute('aria-label', `${i ? 'Next' : 'Previous'} ${name}`);
      b.innerHTML = chevron(i ? 1 : -1);
      Object.assign(b.style, { left: `${ax}px`, top: `${ay}px` });
      b.addEventListener('click', () => next(name, i ? 1 : -1));
      fig.appendChild(b);
    });
  }
}
function slotImg(src) {
  const el = document.createElement('img');
  el.src = `${DIR}${src}.svg?v=1`;
  el.alt = '';
  el.draggable = false;
  return el;
}

// As big as fits above the words, with room either side for the shoes' arrows
let k = 1;
function fit() {
  const room = innerHeight - 120 - 24;
  k = Math.min(1, (innerWidth - 8) / 470, room / 590);
  root.style.setProperty('--k', k.toFixed(3));
  const top = Math.max(0, (room - 613 * k) / 2 + 10);
  root.style.setProperty('--top', `${top.toFixed(1)}px`);
  // the fade: solid down to 20 into the figure, clear by 151 (as the design's)
  root.style.setProperty('--fade-to', `${(top + 151 * k).toFixed(1)}px`);
  root.style.setProperty('--fade-solid', `${(((top + 20 * k) / (top + 151 * k)) * 100).toFixed(1)}%`);
}
addEventListener('resize', fit);

// --- Trying the next pair on ---------------------------------------------
function next(name, dir) {
  if (root.dataset.step !== 'dress') return;
  stopHint();
  Sounds.unlock();
  Sounds.swoosh(0.45);
  const s = SLOTS[name];
  s.at = (s.at + dir + s.options.length) % s.options.length;
  const out = s.el.lastElementChild;
  const into = slotImg(s.options[s.at]);
  s.el.appendChild(into);
  // the one on slides off the way the swipe went, the next comes in after it
  const away = dir > 0 ? -1 : 1;
  out.animate([{ translate: '0 0', opacity: 1 }, { translate: `${away * 130}px 0`, opacity: 0 }],
    { duration: 320, easing: 'cubic-bezier(0.5, 0, 0.75, 0.4)', fill: 'forwards' }).finished.then(() => out.remove());
  into.animate([{ translate: `${-away * 130}px 0`, opacity: 0 }, { translate: '0 0', opacity: 1 }],
    { duration: 420, delay: 120, easing: 'cubic-bezier(0.3, 0.8, 0.2, 1)', fill: 'backwards' });
  if (Object.entries(RED).every(([n, red]) => SLOTS[n].options[SLOTS[n].at] === red)) {
    setTimeout(done, 550);
  }
}
function done() {
  root.dataset.step = 'done';
  Sounds.shimmer();
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 1100);
}

// --- Swiping: across the bottoms or the shoes, whichever it starts on ------
let press = null;
root.addEventListener('pointerdown', (e) => {
  if (root.dataset.step !== 'dress' || e.target.closest('.wr--arrow')) return;
  const r = fig.getBoundingClientRect();
  const fy = (e.clientY - r.top) / k;  // in the figure's units
  const slot = Object.keys(SLOTS).find((n) => fy >= SLOTS[n].band[0] && fy <= SLOTS[n].band[1]);
  if (!slot) return;
  press = { x: e.clientX, y: e.clientY, slot };
});
root.addEventListener('pointermove', (e) => {
  if (!press) return;
  const dx = e.clientX - press.x;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - press.y)) {
    next(press.slot, dx < 0 ? 1 : -1);  // swiped left: the next
    press = null;
  }
});
const lift = () => { press = null; };
root.addEventListener('pointerup', lift);
root.addEventListener('pointercancel', lift);

// --- The hand: a swipe across the bottoms, till you first change something -
let hint = null;
function showHint() {
  if (root.dataset.step !== 'dress') return;
  const r = fig.getBoundingClientRect();
  hint = document.createElement('img');
  hint.className = 'wr--hint';
  hint.src = 'assets/candles/hand.svg';
  hint.alt = '';
  hint.style.left = `${r.left + 200 * k - 18}px`;
  hint.style.top = `${r.top + 270 * k}px`;
  root.appendChild(hint);
  const at = (x, o, sc = 1) => ({ translate: `${x}px 0`, opacity: o, scale: sc });
  hint.animate([at(70, 0), at(70, 1), at(70, 1, 0.88), at(-70, 1, 0.88), at(-70, 0)]
    .map((f, i) => ({ ...f, offset: [0, 0.12, 0.2, 0.7, 0.85][i] })),
  { duration: 1900, iterations: Infinity, easing: 'ease-in-out', delay: 200 });
}
function stopHint() { if (hint) { hint.remove(); hint = null; } }

function start() {
  root.dataset.step = 'dress';
  stopHint();
  build();
  fit();
  setTimeout(showHint, 900);
}
// The sheet's Continue: back in white and blue
addEventListener('message', (e) => { if (e.data === 'luck-continue') start(); });
start();
