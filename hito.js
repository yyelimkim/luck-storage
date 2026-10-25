// Hito (人) on the palm (Figma 510:8282, 510:8284, 510:8285): trace the
// character on your palm, a stroke at a time, top down — the Hot Pink comes
// in where your finger's been. Written, it becomes a little person standing
// there; tap it to swallow it, and the luck is claimed.

const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const root = document.getElementById('hito');
const palm = document.getElementById('palm');
const svg = palm.querySelector('svg');
const doll = document.getElementById('doll');
const dollHit = document.getElementById('doll-hit');
const hint = document.getElementById('hint');
// the 人's place in the frame, and its two strokes' middle lines (in its own units)
const AT = [253.21, 320.87];
const strokes = [document.getElementById('trace-1'), document.getElementById('trace-2')].map((p) => {
  const len = p.getTotalLength();
  const pts = [];
  for (let s = 0; s <= len; s += 2) {
    const q = p.getPointAtLength(s);
    pts.push([q.x + AT[0], q.y + AT[1], s]);
  }
  return { p, len, pts, done: 0 };
});

// The palm as big as fits above the words
function fit() {
  const room = innerHeight - 166;
  // the hand reaches 232 either side of the 人's middle: all of it on the screen
  root.style.setProperty('--p', Math.min(1, (innerWidth / 2 - 14) / 232, (room - 40) / 500).toFixed(3));
}
addEventListener('resize', fit);
fit();

const step = (name) => { root.dataset.step = name; };
function draw(st) {
  st.p.style.strokeDasharray = `${st.done} ${st.len + 10}`;
  st.p.style.visibility = st.done > 0 ? 'visible' : 'hidden';
}

// The pointing hand runs down the first stroke to show how, till you start
let demo = 0;
let demoAt = performance.now();
function showHow(now) {
  const st = strokes[0];
  const t = ((now - demoAt) / 1700) % 1.4;  // a run, then a pause
  const k = Math.min(1, t);
  const q = st.p.getPointAtLength(st.len * k);
  // its fingertip (a third across its 70, at the top) on the line
  hint.style.translate = `${q.x + AT[0] - 23}px ${q.y + AT[1] - 2}px`;
  hint.style.opacity = t < 0.08 ? t / 0.08 : t > 1.15 ? 0 : 1;
  demo = requestAnimationFrame(showHow);
}
demo = requestAnimationFrame(showHow);
function stopHow() { cancelAnimationFrame(demo); hint.style.opacity = '0'; }

// Tracing: the pointer drags along a stroke from its top; the ink follows
// as far as it's been, never skipping ahead
function toPalm(e) {
  const r = svg.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * 637, ((e.clientY - r.top) / r.height) * 713];
}
let tracing = false;
let lastSound = 0;
function follow(e) {
  const [x, y] = toPalm(e);
  for (const st of strokes) {
    if (st.done >= st.len) continue;
    let best = -1;
    for (const [px, py, s] of st.pts) {
      if (s > st.done + 46 || s <= st.done) continue;
      if (Math.hypot(px - x, py - y) < 34) best = Math.max(best, s);
    }
    if (best > st.done) {
      st.done = best >= st.len - 10 ? st.len : best;
      draw(st);
      const now = performance.now();
      if (now - lastSound > 90) { lastSound = now; Sounds.rub(); }
      if (strokes.every((s) => s.done >= s.len)) written();
      return;
    }
  }
}
palm.addEventListener('pointerdown', (e) => {
  if (root.dataset.step !== 'write') return;
  e.preventDefault();
  Sounds.unlock();
  stopHow();
  tracing = true;
  palm.setPointerCapture(e.pointerId);
  follow(e);
});
palm.addEventListener('pointermove', (e) => { if (tracing) follow(e); });
const lift = () => { tracing = false; };
palm.addEventListener('pointerup', lift);
palm.addEventListener('pointercancel', lift);

// Written: it stands up off the palm, a little person, to be swallowed
let unpoint = () => {};
function written() {
  tracing = false;
  Sounds.shimmer();
  setTimeout(() => {
    step('doll');
    setTimeout(() => { if (root.dataset.step === 'doll') unpoint = pointAt(dollHit); }, 700);
  }, 1000);  // the finished 人 (510:8284) a moment first
}
dollHit.addEventListener('click', () => {
  if (root.dataset.step !== 'doll') return;
  unpoint();
  Sounds.eat();
  doll.classList.add('is-eaten');
  step('done');
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 1500);
});

// The sheet's Continue: a clean palm to write on again
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  strokes.forEach((st) => { st.done = 0; draw(st); });
  doll.classList.remove('is-eaten');
  step('write');
  demoAt = performance.now();
  demo = requestAnimationFrame(showHow);
});
strokes.forEach(draw);
