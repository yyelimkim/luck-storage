// Blowing out the candles (Figma 436:8748, 436:8802, 438:289, 436:8856,
// 436:8907): 1. the cake, 2. write a wish over it, 3. the cake comes close
// and a hand shows the swipe — every flame in one stroke, all out together
// or none — 4. smoke rises, the wish comes true and the luck is claimed.

// The flames, cut from the card's cake (482 x 429): [file, x, y, w, h]
const FLAMES = [
  ['flame-4', 148.5, 22.3, 29, 38],
  ['flame-5', 184.2, 54, 29, 37.8],
  ['flame-1', 229.2, 1.4, 29, 37.9],
  ['flame-3', 274.2, 52.4, 29, 37.9],
  ['flame-2', 340.1, 45.9, 29.2, 36.6],
];
// The smoke curls over each wick (436:8907), in the cake's units
const SMOKE = [[155.5, -49.5], [189.7, -15.3], [233.2, -70.6], [279.3, -15.3], [345.2, -19.2]];
const W = 482;
const H = 429;
const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const HIT_R = 30;          // px: how near the stroke must pass a flame
const STROKE_MS = 1400;    // a single breath: longer than this and it's two

const root = document.getElementById('candles');
const scene = document.getElementById('scene');
const form = document.getElementById('wish-form');
const input = document.getElementById('wish');
const send = document.getElementById('send');
const hint = document.getElementById('hint');
const echo = document.getElementById('echo');

const pct = (v, of) => `${(v / of) * 100}%`;
const flames = FLAMES.map(([file, x, y, w, h]) => {
  const el = document.createElement('div');
  el.className = 'candles--flame';
  Object.assign(el.style, { left: pct(x, W), top: pct(y, H), width: pct(w, W), height: pct(h, H) });
  // each flame wavers in its own time
  el.innerHTML = `<img src="assets/candles/${file}.svg" alt="" style="animation-delay:${(-Math.random() * 4).toFixed(2)}s; animation-duration:${(3.4 + Math.random() * 1.2).toFixed(2)}s">`;
  scene.appendChild(el);
  return el;
});

// The cake as big as each step asks (Figma: 358 wide, 498.7 close up for
// the blowing, 366 once done), but never wider or taller than the screen
// leaves it, so nothing is ever cut off
const ZOOM = { intro: 1, wish: 1, blow: 1.39, done: 1.02 };
const words = document.querySelector('.candles--words');
function fit() {
  const room = innerHeight - words.offsetHeight - 60 - 40;  // the gap, and the band above the cake
  const w = Math.min(358 * (ZOOM[root.dataset.step] || 1), innerWidth - 24, room * W / H);
  root.style.setProperty('--w', `${Math.max(120, w)}px`);
}
addEventListener('resize', fit);
function step(name) { root.dataset.step = name; fit(); }
fit();
// 1 → 2: the cake on its own a moment, then the wish
setTimeout(() => { step('wish'); input.focus({ preventScroll: true }); }, 1100);

// 2: the wish
input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  echo.textContent = `“${input.value.trim()}”`;
  input.blur();
  step('blow');
});

// 3: the breath — a single stroke across the flames
let stroke = null;
const centre = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.55]; };
function nearSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
scene.addEventListener('pointerdown', (e) => {
  if (root.dataset.step !== 'blow') return;
  Sounds.unlock();  // the press lets the swoosh play once the finger moves
  stroke = { last: [e.clientX, e.clientY], t0: performance.now(), hit: new Set(), whooshed: false };
  root.classList.add('is-blowing');
  scene.setPointerCapture(e.pointerId);
});
scene.addEventListener('pointermove', (e) => {
  if (!stroke) return;
  const p = [e.clientX, e.clientY];
  const dir = Math.sign(p[0] - stroke.last[0]) || 1;
  // A small swoosh once the swipe gets going
  if (!stroke.whooshed && Math.abs(p[0] - stroke.last[0]) + Math.abs(p[1] - stroke.last[1]) > 6) {
    stroke.whooshed = true;
    Sounds.swoosh();
  }
  flames.forEach((f, i) => {
    if (stroke.hit.has(i)) return;
    if (nearSegment(centre(f), stroke.last, p) < HIT_R) {
      stroke.hit.add(i);
      f.classList.remove('is-relit');
      f.classList.add('is-hit');
      f.style.rotate = `${dir * (45 + Math.random() * 14)}deg`;  // bent right over, as in 436:8856
    }
  });
  stroke.last = p;
  if (stroke.hit.size === flames.length && performance.now() - stroke.t0 < STROKE_MS) {
    stroke = null;
    root.classList.remove('is-blowing');
    blownOut();
  }
});
const endStroke = () => {
  if (!stroke) return;
  const any = stroke.hit.size > 0;
  stroke = null;
  root.classList.remove('is-blowing');
  if (!any) return;
  // Not all of them: the ones it caught spring back
  flames.forEach((f) => {
    if (!f.classList.contains('is-hit')) return;
    f.classList.remove('is-hit');
    f.style.rotate = '';
    void f.offsetWidth;
    f.classList.add('is-relit');
  });
  hint.textContent = 'So close! Every flame in one go';
  hint.classList.remove('is-missed');
  void hint.offsetWidth;
  hint.classList.add('is-missed');
};
scene.addEventListener('pointerup', endStroke);
scene.addEventListener('pointercancel', endStroke);

// 4: out they go, smoke curls up from each wick, and the wish comes true
function blownOut() {
  flames.forEach((f) => {
    f.classList.remove('is-hit', 'is-relit');
    f.classList.add('is-out');
  });
  SMOKE.forEach(([x, y], i) => {
    const s = document.createElement('img');
    s.className = 'candles--smoke';
    s.src = 'assets/candles/smoke.svg';
    s.alt = '';
    Object.assign(s.style, { left: pct(x, W), top: pct(y, H), width: pct(15.8, W), height: pct(60, H), animationDelay: `${0.15 + i * 0.07}s` });
    scene.appendChild(s);
  });
  step('done');
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 2800);
}

// The sheet's Continue lights the candles for another wish
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  scene.querySelectorAll('.candles--smoke').forEach((s) => s.remove());
  flames.forEach((f) => { f.className = 'candles--flame is-relit'; f.style.rotate = ''; });
  input.value = '';
  send.disabled = true;
  hint.textContent = 'Blow them all out in one go!';
  step('wish');
});
