// Worry Doll (Figma 445:622, 445:814, 445:991, 504:8117):
// 1. choose one of six dolls; 2. tell it what's worrying you, and the words
// go into it; 3. drag it onto your pillow; 4. it's tucked in under the
// pillow, to do the worrying while you sleep, and the luck is claimed.

const IN_SHEET = new URLSearchParams(location.search).has('sheet');
// The dolls as 445:622 lays them out, left to right, top to bottom
const DOLLS = ['doll1', 'doll2', 'doll5', 'doll4', 'doll3', 'doll6'];
const src = (d) => `assets/worry/${d}.svg?v=1`;
// The pillow's corners in the bed's frame (445:991), for where it can drop
const PILLOW = [[270, 207], [460, 370], [132, 550], [-58, 387]];

const root = document.getElementById('worry');
const grid = document.getElementById('grid');
const selected = document.getElementById('selected');
const big = document.getElementById('big');
const said = document.getElementById('said');
const doll = document.getElementById('doll');
const pillow = document.getElementById('pillow');
const drag = document.getElementById('drag');
const form = document.getElementById('tell-form');
const input = document.getElementById('tell');
const send = document.getElementById('send');

let chosen = 0;
const picks = DOLLS.map((d, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'worry--doll-pick';
  b.setAttribute('role', 'radio');
  b.setAttribute('aria-label', `Doll ${i + 1}`);
  b.innerHTML = `<img src="${src(d)}" alt="">`;
  b.addEventListener('click', () => pick(i));
  grid.appendChild(b);
  return b;
});
function pick(i) {
  chosen = i;
  picks.forEach((b, j) => b.setAttribute('aria-checked', String(i === j)));
  // the brackets round it (445:988 sits 13 left and 20 above the doll)
  const b = picks[i];
  selected.style.left = `${b.offsetLeft - 13}px`;
  selected.style.top = `${b.offsetTop - 20}px`;
}

// Sizes: the grid and the big doll as big as fit above the words; the bed
// across the width, its pillow a little above the middle of the room
function fit() {
  const room = innerHeight - 120 - 16;
  root.style.setProperty('--g', Math.min(1, (innerWidth - 24) / 344, (room - 16) / 502).toFixed(3));
  const s = innerWidth / 402;
  root.style.setProperty('--s', s.toFixed(4));
  root.style.setProperty('--sy', `${room * 0.47 - 378 * s}px`);
  if (root.dataset.step === 'tuck') placeDrag();
}
addEventListener('resize', fit);
fit();
pick(0);

const step = (name) => { root.dataset.step = name; if (name !== 'tell') root.classList.remove('is-told'); };

// 1 → 2
document.getElementById('choose').addEventListener('click', () => {
  const s = src(DOLLS[chosen]);
  big.querySelector('img').src = s;
  doll.querySelector('img').src = s;
  drag.querySelector('img').src = s;
  step('tell');
  setTimeout(() => input.focus({ preventScroll: true }), 500);
});

// 2: the worry goes into the doll
input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  Sounds.unlock();
  input.blur();
  root.classList.add('is-told');  // the blur lifts, to watch the worry go in
  // the words lift off the field and shrink into the doll's middle
  const f = form.getBoundingClientRect();
  const d = big.getBoundingClientRect();
  said.textContent = text;
  said.style.top = `${f.top + 14}px`;
  said.animate([
    { opacity: 1, transform: 'translateY(0) scale(1)' },
    { opacity: 1, transform: `translateY(${(d.top + d.height * 0.55 - f.top - 14) * 0.6}px) scale(0.8)`, offset: 0.5 },
    { opacity: 0, transform: `translateY(${d.top + d.height * 0.55 - f.top - 14}px) scale(0.15)` },
  ], { duration: 800, easing: 'cubic-bezier(0.5, 0, 0.5, 1)' });
  input.value = '';
  send.disabled = true;
  form.style.opacity = '0';
  setTimeout(() => {
    Sounds.absorb();
    big.classList.remove('is-taking');
    void big.offsetWidth;
    big.classList.add('is-taking');
  }, 650);
  // 2 → 3
  setTimeout(() => { form.style.opacity = ''; step('tuck'); placeDrag(); }, 1500);
});

// 3: drag the doll onto the pillow
const box = () => {
  const s = Number(getComputedStyle(root).getPropertyValue('--s'));
  const sy = parseFloat(getComputedStyle(root).getPropertyValue('--sy'));
  return { s, sy };
};
function placeDrag() {
  const { s, sy } = box();
  drag.style.left = `${243 * s}px`;
  drag.style.top = `${sy + 164 * s}px`;
  drag.classList.remove('is-held', 'is-moved');
}
function onPillow(x, y) {
  // the point in the bed's frame, inside the pillow's four corners?
  const { s, sy } = box();
  const px = x / s;
  const py = (y - sy) / s;
  let inside = false;
  for (let i = 0, j = PILLOW.length - 1; i < PILLOW.length; j = i++) {
    const [xi, yi] = PILLOW[i];
    const [xj, yj] = PILLOW[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
let hold = null;
drag.addEventListener('pointerdown', (e) => {
  if (root.dataset.step !== 'tuck') return;
  e.preventDefault();
  Sounds.unlock();
  drag.setPointerCapture(e.pointerId);
  hold = { x: e.clientX - drag.offsetLeft, y: e.clientY - drag.offsetTop };
  drag.classList.add('is-held', 'is-moved');
});
drag.addEventListener('pointermove', (e) => {
  if (!hold) return;
  drag.style.left = `${e.clientX - hold.x}px`;
  drag.style.top = `${e.clientY - hold.y}px`;
});
const letGo = () => {
  if (!hold) return;
  hold = null;
  drag.classList.remove('is-held');
  const r = drag.getBoundingClientRect();
  if (onPillow(r.left + r.width / 2, r.top + r.height / 2)) tuckIn();
  else {
    // not on the pillow: back to where it was
    const from = drag.getBoundingClientRect();
    placeDrag();
    const to = drag.getBoundingClientRect();
    drag.animate([{ translate: `${from.left - to.left}px ${from.top - to.top}px` }, { translate: '0 0' }],
      { duration: 380, easing: 'cubic-bezier(0.3, 0.8, 0.2, 1)' });
  }
};
drag.addEventListener('pointerup', letGo);
drag.addEventListener('pointercancel', letGo);
// by keyboard: Enter puts it straight on the pillow
drag.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tuckIn(); } });

// 4: it lies down on the pillow (504:8117's pose), then the pillow lifts
// and it's tucked in under it
function tuckIn() {
  if (root.dataset.step !== 'tuck') return;
  const { s, sy } = box();
  const r = drag.getBoundingClientRect();
  // the lying pose's middle, in the page
  const cx = (32 + 108) * s;
  const cy = sy + (356 + 107.5) * s;
  const k = 216 / 137;
  drag.animate([
    { transform: 'none' },
    { transform: `translate(${cx - (r.left + r.width / 2)}px, ${cy - (r.top + r.height / 2)}px) scale(${k}) rotate(-49deg)` },
  ], { duration: 520, easing: 'cubic-bezier(0.3, 0.8, 0.2, 1)', fill: 'forwards' }).finished.then(() => {
    step('done');
    doll.classList.add('is-in');
    drag.getAnimations().forEach((a) => a.cancel());
    pillow.classList.add('is-lift');
    Sounds.rub();
    setTimeout(() => Sounds.shimmer(), 700);
    if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 1900);
  });
}

// The sheet's Continue starts over
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  doll.classList.remove('is-in');
  pillow.classList.remove('is-lift');
  step('choose');
  pick(chosen);
});
