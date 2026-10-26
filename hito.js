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
// The palm big: the tilted hand a little wider than the screen, its
// pinky and thumb tips running just off the edges, centred across; no
// taller than the room above the words allows. The hand spans about 137 to
// 565 across the frame.
const HAND = { left: 137, width: 428 };
function fit() {
  const room = innerHeight - 166;
  // and short screens: the fingertips (323 above the 人, which sits 60% down
  // the room) kept clear of the top
  root.style.setProperty('--p', Math.min(1.5, (innerWidth * 1.02) / HAND.width, (room * 0.6 - 8) / 323).toFixed(3));
  root.style.setProperty('--mid', `${HAND.left + HAND.width / 2}px`);
  // the fade starts just above where the wrist ends (635 down the frame,
  // 245 under the 人), whatever the screen's height
  const p = Math.min(1.5, (innerWidth * 1.02) / HAND.width, (room * 0.6 - 8) / 323);
  root.style.setProperty('--fade-top', `${room * 0.6 + 245 * p - 70}px`);
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
  const [hx, hy] = tilted(q.x + AT[0], q.y + AT[1]);
  hint.style.translate = `${hx - 23}px ${hy - 2}px`;
  hint.style.opacity = t < 0.08 ? t / 0.08 : t > 1.15 ? 0 : 1;
  demo = requestAnimationFrame(showHow);
}
demo = requestAnimationFrame(showHow);
function stopHow() { cancelAnimationFrame(demo); hint.style.opacity = '0'; }

// Tracing: the pointer drags along a stroke from its top; the ink follows
// as far as it's been, never skipping ahead
// (through the tilt, if any, to the drawing's own units)
const tilt = document.getElementById('tilt');
function toPalm(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const q = pt.matrixTransform(tilt.getScreenCTM().inverse());
  return [q.x, q.y];
}
// from the drawing's units to the palm's (the tilt applied)
function tilted(x, y) {
  const a = (0 * Math.PI) / 180;
  const dx = x - 351;
  const dy = y - 390;
  return [351 + dx * Math.cos(a) - dy * Math.sin(a), 390 + dx * Math.sin(a) + dy * Math.cos(a)];
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
  root.classList.add('is-written');  // the pen line gives way to the filled 人
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
  root.classList.remove('is-written');
  doll.classList.remove('is-eaten');
  step('write');
  demoAt = performance.now();
  demo = requestAnimationFrame(showHow);
});
strokes.forEach(draw);
