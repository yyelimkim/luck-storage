// Blowing out the candles in one go (card 248:3069), after the sketch:
// 1. write a wish, 2. swipe across every flame in a single stroke — all go
// out together or none do — 3. smoke rises, the star bursts, the wish comes
// true and the card's luck is claimed.

// The flames, cut from the card's cake (Group 110, 482 x 429): [file, x, y, w, h]
const FLAMES = [
  ['flame-4', 148.5, 22.3, 29, 38],
  ['flame-5', 184.2, 54, 29, 37.8],
  ['flame-1', 229.2, 1.4, 29, 37.9],
  ['flame-3', 274.2, 52.4, 29, 37.9],
  ['flame-2', 340.1, 45.9, 29.2, 36.6],
];
const W = 482;
const H = 429;
const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const HIT_R = 26;          // px: how near the stroke must pass a flame's middle
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
  Object.assign(el.style, { left: pct(x, W), top: pct(y, H), width: pct(w, W), height: pct(h, H), animationDelay: `${-Math.random() * 1.3}s` });
  el.innerHTML = `<img src="assets/candles/${file}.svg" alt="">`;
  scene.appendChild(el);
  return el;
});

function step(name) { root.dataset.step = name; }

// 1: the wish
input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  echo.textContent = `“${input.value.trim()}”`;
  input.blur();
  step('blow');
});

// 2: the breath — a single stroke across the flames
let stroke = null;
const centre = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.55]; };
// Distance from point p to the segment a–b
function nearSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
scene.addEventListener('pointerdown', (e) => {
  if (root.dataset.step !== 'blow') return;
  stroke = { last: [e.clientX, e.clientY], t0: performance.now(), hit: new Set() };
  root.classList.add('is-blowing');
  scene.setPointerCapture(e.pointerId);
});
scene.addEventListener('pointermove', (e) => {
  if (!stroke) return;
  const p = [e.clientX, e.clientY];
  const dir = Math.sign(p[0] - stroke.last[0]) || 1;
  flames.forEach((f, i) => {
    if (stroke.hit.has(i)) return;
    if (nearSegment(centre(f), stroke.last, p) < HIT_R) {
      stroke.hit.add(i);
      f.classList.remove('is-relit');
      f.classList.add('is-hit');
      f.style.rotate = `${dir * 24}deg`;  // the breath bends it over
    }
  });
  stroke.last = p;
  // Every flame in one breath: they all go out together
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
  hint.textContent = 'So close! They have to go out all at once — one swipe across every flame';
  hint.classList.remove('is-missed');
  void hint.offsetWidth;
  hint.classList.add('is-missed');
};
scene.addEventListener('pointerup', endStroke);
scene.addEventListener('pointercancel', endStroke);

// 3: out they go, smoke curls up from each wick, and the wish comes true
function blownOut() {
  flames.forEach((f, i) => {
    f.classList.remove('is-hit', 'is-relit');
    f.classList.add('is-out');
    const [, x, y, w] = FLAMES[i];
    const smoke = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    smoke.setAttribute('class', 'candles--smoke');
    smoke.setAttribute('viewBox', '0 0 20 60');
    Object.assign(smoke.style, { left: pct(x + w / 2 - 10, W), top: pct(y - 22, H), width: pct(20, W), height: pct(60, H) });
    smoke.innerHTML = `<path d="M10 58c-6-8 6-14 0-22s6-14 0-22s4-10 2-14" style="animation-delay:${i * 0.06}s"/>`;
    scene.appendChild(smoke);
  });
  step('done');
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 2600);
}

// The sheet's Continue lights the candles for another wish
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  scene.querySelectorAll('.candles--smoke').forEach((s) => s.remove());
  flames.forEach((f) => { f.className = 'candles--flame is-relit'; f.style.rotate = ''; });
  input.value = '';
  send.disabled = true;
  hint.textContent = 'Blow them all out in one go — swipe across every flame at once';
  step('wish');
});
