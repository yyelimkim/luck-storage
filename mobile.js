// iPhone prototype: the dial at the bottom replaces the desktop's line scroller.
// Two Figma states, blended by `open` (0 = rest, 1 = dialing):
//   rest (97:630)    big cards 20° apart, small closed dial
//   dialing (97:730) small cards 30° apart on a circle round the opened dial,
//                    so turning the dial turns the fan with it
// Card i sits `rel` slots from the centre; it lies at angle rel * step on an
// arc below the centre card: x = A sin θ, y = B (1 − cos θ), tilted by θ.

const STAGE_W = 402;
const STAGE_H = 874;

// Cards are drawn this much bigger than in Figma. At rest the fan spreads by
// the same amount so the neighbours still peek out; while dialing the cards
// stay on the dial's circle.
const CARD_SCALE = 1.18;
const CARD_DROP = 33;     // px the cards sit lower than in Figma, nearer the dial
const DIAL_SCALE = 1.2;   // the dial is drawn this much bigger than in Figma

// Figma's dialing fan is a circle round the dial's centre (radius ~464).
// Dropping the cards shrinks that radius, so the arc shrinks with it.
const OPEN_ARC = (834.74 - (370.77 + CARD_DROP)) / (834.74 - 370.77);

const REST = {
  cx: 201.68, cy: 396.9 + CARD_DROP,  // centre card's middle
  a: 489.7 * CARD_SCALE,   // arc radii (Figma: side cards at ±167.5, +55.9, 20°)
  b: 926.1 * CARD_SCALE,
  step: 20, scale: CARD_SCALE,
  dialX: 200.5, dialY: 853.5, dialScale: DIAL_SCALE,
};
const OPEN = {
  cx: 201.02, cy: 370.77 + CARD_DROP,
  a: 453.2 * OPEN_ARC,     // Figma: side cards at ±226.6, +63.2, 30°
  b: 471.4 * OPEN_ARC,
  step: 30, scale: (176.046 / 271.675) * CARD_SCALE,
  dialX: 200.85, dialY: 834.74, dialScale: (278 / 215) * DIAL_SCALE,
};
const FOCUS_SCALE = 1.12;  // the centre card grows by this much over its neighbours
const SIDE_OPACITY = 0.8;  // neighbours one slot out fade to this
const TICK_GAP = 45;  // the tick marks repeat every 45°
const START = IMAGES.indexOf('테루테루보즈.png');  // centred in the Figma frames

const N = IMAGES.length;
const stage = document.getElementById('stage');
const fan = document.getElementById('fan');
const dial = document.getElementById('dial');
const ticks = document.getElementById('ticks');

// Fit the 402 x 874 frame to the window. On a phone it fills the screen;
// anywhere else it is shown as a framed preview.
const isPhone = matchMedia('(pointer: coarse) and (max-width: 500px)').matches;
document.documentElement.classList.add(isPhone ? 'is-phone' : 'is-preview');
function fit() {
  const pad = isPhone ? 0 : 40;
  const s = Math.min((innerWidth - pad) / STAGE_W, (innerHeight - pad) / STAGE_H, isPhone ? Infinity : 1);
  stage.style.transform = `scale(${s})`;
  fitScale = s;
}
let fitScale = 1;
fit();
addEventListener('resize', fit);

const cards = IMAGES.map((name, i) => {
  const el = document.createElement('div');
  el.className = 'm-card';
  const img = document.createElement('img');
  img.src = `cards/${encodeURIComponent(name)}?v=${IMAGES_VERSION}`;
  img.alt = name.replace('.png', '');
  img.draggable = false;
  el.appendChild(img);
  fan.appendChild(el);
  return el;
});

// pos: which card is centred, fractional while moving. Never wrapped, so it
// can run on forever in either direction; relOf() wraps per card.
let pos = START;
let posTarget = START;
let open = 0;
let openTarget = 0;
let dragging = false;

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const rad = (d) => (d * Math.PI) / 180;
const relOf = (i) => ((((i - pos) % N) + N + N / 2) % N) - N / 2;

function goTo(p) { posTarget = Math.round(p); }

function render() {
  const t = ease(open);
  const g = {};
  for (const k in REST) g[k] = lerp(REST[k], OPEN[k], t);

  cards.forEach((el, i) => {
    const rel = relOf(i);
    const th = rel * g.step;
    if (Math.abs(th) > 100) { el.style.visibility = 'hidden'; return; }
    el.style.visibility = '';
    const x = g.cx + g.a * Math.sin(rad(th));
    const y = g.cy + g.b * (1 - Math.cos(rad(th)));
    const d = Math.abs(rel);
    const focus = Math.max(0, 1 - d);
    const scale = g.scale * lerp(1, FOCUS_SCALE, focus);
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${th}deg) scale(${scale})`;
    el.style.zIndex = String(100 - Math.round(d * 10));
    // Centre card full strength, neighbours dimmer, the next ones fade in from nothing
    const opacity = d <= 1 ? lerp(1, SIDE_OPACITY, d) : SIDE_OPACITY * Math.max(0, 2 - d);
    el.style.opacity = opacity.toFixed(3);
    el.style.setProperty('--focus', focus.toFixed(3));
  });

  dial.style.transform = `translate(${g.dialX - 107.5}px, ${g.dialY - 107.5}px) scale(${g.dialScale})`;
  // Ticks stand upright (as in Figma) whenever a card is settled, and swing
  // with the finger between cards. They repeat every 45°, so wrap to that.
  const turn = -(pos - Math.round(pos)) * OPEN.step;
  const tick = ((((turn + TICK_GAP / 2) % TICK_GAP) + TICK_GAP) % TICK_GAP) - TICK_GAP / 2;
  ticks.style.transform = `rotate(${tick}deg)`;
  dial.setAttribute('aria-valuenow', String(((Math.round(pos) % N) + N) % N + 1));
}

(function frame() {
  open += (openTarget - open) * 0.2;
  if (!dragging) pos += (posTarget - pos) * 0.16;
  render();
  requestAnimationFrame(frame);
})();

// Pointer helpers: client coords to stage coords
function stagePoint(e) {
  const r = stage.getBoundingClientRect();
  return { x: (e.clientX - r.left) / fitScale, y: (e.clientY - r.top) / fitScale };
}

// Release: settle on the nearest card, carrying a flick's speed a little way
let vel = 0;     // cards per ms
let lastT = 0;
function track(dPos) {
  const now = performance.now();
  const dt = Math.max(1, now - lastT);
  vel = lerp(vel, dPos / dt, 0.5);
  lastT = now;
}
function release() {
  dragging = false;
  // A finger that stopped before lifting carries nothing; a flick carries at most 2 cards
  const still = performance.now() - lastT > 80;
  const carry = still ? 0 : Math.max(-2, Math.min(2, vel * 120));
  goTo(pos + carry);
  vel = 0;
}

// Dial: press opens it, turning it turns the fan one card per 30°
let lastAngle = 0;
function angleAt(e) {
  const p = stagePoint(e);
  return (Math.atan2(p.y - OPEN.dialY, p.x - OPEN.dialX) * 180) / Math.PI;
}
dial.addEventListener('pointerdown', (e) => {
  dial.setPointerCapture(e.pointerId);
  dragging = true;
  openTarget = 1;
  lastAngle = angleAt(e);
  lastT = performance.now();
  vel = 0;
});
dial.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const a = angleAt(e);
  let d = a - lastAngle;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  lastAngle = a;
  // Clockwise brings the left-hand card to the centre
  const dPos = -d / OPEN.step;
  pos += dPos;
  track(dPos);
});
const endDial = () => { if (!dragging) return; release(); openTarget = 0; };
dial.addEventListener('pointerup', endDial);
dial.addEventListener('pointercancel', endDial);

// Swiping the cards sideways moves them too, at the rest spacing.
// A tap without a swipe brings the tapped card to the centre.
let startX = 0;
let lastX = 0;
let moved = false;
let tapped = null;
fan.addEventListener('pointerdown', (e) => {
  tapped = e.target.closest('.m-card');
  fan.setPointerCapture(e.pointerId);
  dragging = true;
  moved = false;
  startX = lastX = stagePoint(e).x;
  lastT = performance.now();
  vel = 0;
});
fan.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const x = stagePoint(e).x;
  if (Math.abs(x - startX) > 6) moved = true;
  const dPos = -(x - lastX) / (REST.a * Math.sin(rad(REST.step)));
  lastX = x;
  pos += dPos;
  track(dPos);
});
const endSwipe = () => {
  if (!dragging) return;
  if (moved) { release(); return; }
  dragging = false;
  if (tapped) goTo(pos + relOf(cards.indexOf(tapped)));
};
fan.addEventListener('pointerup', endSwipe);
fan.addEventListener('pointercancel', endSwipe);

// Arrow keys step through the cards, opening the dial while they do
let keyTimer = 0;
addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  goTo(posTarget + (e.key === 'ArrowRight' ? 1 : -1));
  openTarget = 1;
  clearTimeout(keyTimer);
  keyTimer = setTimeout(() => { openTarget = 0; }, 600);
});
