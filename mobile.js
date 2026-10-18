// iPhone prototype: the dial at the bottom replaces the desktop's line scroller.
// Two Figma states, blended by `open` (0 = rest, 1 = dialing):
//   rest (97:630)    big cards 20° apart, small closed dial
//   dialing (97:730) small cards 30° apart on a circle round the opened dial,
//                    so turning the dial turns the fan with it
// Card i sits `rel` slots from the centre; it lies at angle rel * step on an
// arc below the centre card: x = A sin θ, y = B (1 − cos θ), tilted by θ.

// Everything is laid out in Figma px: the screen is always 402 wide, and as
// tall as the window allows (874 in the Figma frame and the desktop preview).
const STAGE_W = 402;
const FIGMA_H = 874;

// Cards are drawn this much bigger than in Figma. At rest the fan spreads by
// the same amount so the neighbours still peek out; while dialing the cards
// stay on the dial's circle.
const CARD_SCALE = 1.18;
const CARD_DROP = 33;     // px the cards sit lower than in Figma, nearer the dial
const DIAL_SCALE = 1.2;   // the dial is drawn this much bigger than in Figma
const DIAL_DROP = 16;     // px the dial sits lower than in Figma

// Figma's dialing fan is a circle round the dial's centre (radius ~464).
// Dropping the cards shrinks that radius, so the arc shrinks with it.
const OPEN_ARC = (834.74 - (370.77 + CARD_DROP)) / (834.74 - 370.77);

// Both states as laid out on the 874-tall Figma frame
const FIGMA_REST = {
  cx: 201.68, cy: 396.9 + CARD_DROP,  // centre card's middle
  a: 489.7 * CARD_SCALE,   // arc radii (Figma: side cards at ±167.5, +55.9, 20°)
  b: 926.1 * CARD_SCALE,
  step: 20, scale: CARD_SCALE,
  dialX: 200.5, dialY: 853.5 + DIAL_DROP, dialScale: DIAL_SCALE,
};
const FIGMA_OPEN = {
  cx: 201.02, cy: 370.77 + CARD_DROP,
  a: 453.2 * OPEN_ARC,     // Figma: side cards at ±226.6, +63.2, 30°
  b: 471.4 * OPEN_ARC,
  step: 30, scale: (176.046 / 271.675) * CARD_SCALE,
  dialX: 200.85, dialY: 834.74 + DIAL_DROP, dialScale: (278 / 215) * DIAL_SCALE,
};
// The fan and dial run from the opened centre card's top down to the bottom edge
const FAN_TOP = FIGMA_REST.cy - (388.182 / 2) * CARD_SCALE * 1.12;
const HEAD_H = 49;        // header row height
const HEAD_GAP = 40;      // least space kept between header and cards

const FOCUS_SCALE = 1.12;  // the centre card grows by this much over its neighbours
const SIDE_OPACITY = 0.8;  // neighbours one slot out fade to this
const TICK_GAP = 45;  // the tick marks repeat every 45°
const START = IMAGES.indexOf('테루테루보즈.png');  // centred in the Figma frames

const N = IMAGES.length;
const stage = document.getElementById('stage');
const fan = document.getElementById('fan');
const dial = document.getElementById('dial');
const ticks = document.getElementById('ticks');

// The states for the current screen: pinned to the bottom edge, and shrunk
// about the bottom centre when the screen is too short for the full fan
let REST = FIGMA_REST;
let OPEN = FIGMA_OPEN;
let stageH = FIGMA_H;
function place(st, h, f) {
  return {
    ...st,
    cx: STAGE_W / 2 + (st.cx - STAGE_W / 2) * f,
    cy: h - (FIGMA_H - st.cy) * f,
    a: st.a * f, b: st.b * f, scale: st.scale * f,
    dialX: STAGE_W / 2 + (st.dialX - STAGE_W / 2) * f,
    dialY: h - (FIGMA_H - st.dialY) * f,
    dialScale: st.dialScale * f,
  };
}

// Phone-sized windows get the screen edge to edge, the header at the very top
// (the real status bar is above the page). Anything wider shows the 402 x 874
// frame in a phone-shaped preview.
let fitScale = 1;
function fit() {
  const phone = innerWidth <= 500;
  document.documentElement.classList.toggle('is-phone', phone);
  document.documentElement.classList.toggle('is-preview', !phone);
  if (phone) {
    fitScale = innerWidth / STAGE_W;
    stageH = innerHeight / fitScale;
  } else {
    fitScale = Math.min((innerWidth - 40) / STAGE_W, (innerHeight - 40) / FIGMA_H, 1);
    stageH = FIGMA_H;
  }
  stage.style.height = `${stageH}px`;
  stage.style.transform = `scale(${fitScale})`;
  const headTop = phone ? 0 : 44;
  const room = stageH - headTop - HEAD_H - HEAD_GAP;
  const f = Math.min(1, room / (FIGMA_H - FAN_TOP));
  REST = place(FIGMA_REST, stageH, f);
  OPEN = place(FIGMA_OPEN, stageH, f);
}
fit();
addEventListener('resize', fit);

const cards = IMAGES.map((name, i) => {
  const el = document.createElement('div');
  el.className = 'm-card';
  const img = document.createElement('img');
  img.src = englishSrc(name);
  img.alt = ENGLISH[name].replace('.png', '');
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
let flip = null;  // the card lifted into the overlay: { el, card, box }

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
    // Far cards are hidden, and so is a card lifted into the flip overlay
    const lifted = flip && flip.card === el;
    el.style.visibility = Math.abs(th) > 100 || lifted ? 'hidden' : '';
    if (Math.abs(th) > 100) return;
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
  if (!tapped) return;
  const rel = relOf(cards.indexOf(tapped));
  // The settled centre card turns over; a side card comes to the centre
  if (Math.abs(rel) < 0.05 && open < 0.05) flipOpen(tapped);
  else goTo(pos + rel);
};
fan.addEventListener('pointerup', endSwipe);
fan.addEventListener('pointercancel', endSwipe);

// Tapping the centre card turns it over, and as it turns it grows into a
// sheet: full width, from just under the status bar to the bottom edge, with
// rounded top corners. Tapping the sheet or the strip above it turns it back
// and drops it into the fan again.
const FLIP_MS = 700;
const FLIP_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';  // same as the desktop flip
const SHEET_GAP = 36;     // px between the status bar and the sheet's top
const SHEET_RADIUS = 32;  // the sheet's top corners
const overlay = document.getElementById('overlay');
let flipBusy = false;

// Preload backs so they're ready by the time a card turns over
BACKS.forEach((name) => { new Image().src = backSrc(name); });

// The card's on-screen box in stage px (it's upright when centred)
function stageBox(el) {
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  return {
    left: (r.left - s.left) / fitScale, top: (r.top - s.top) / fitScale,
    width: r.width / fitScale, height: r.height / fitScale,
  };
}

// The sheet: on a phone the real status bar sits above the page
function sheetBox() {
  const top = (document.documentElement.classList.contains('is-phone') ? 0 : 44) + SHEET_GAP;
  return { left: 0, top, width: STAGE_W, height: stageH - top };
}

// Card corners follow the artwork's own curve; the sheet's are round on top only
const cardRadius = (r) => `${r.width * 0.0625}px / ${r.height * 0.044}px`;
const sheetRadius = `${SHEET_RADIUS}px ${SHEET_RADIUS}px 0 0`;

function flipAnimate(from, to, fromDeg, toDeg, fromRadius, toRadius) {
  const opts = { duration: FLIP_MS, easing: FLIP_EASE, fill: 'forwards' };
  const px = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  const move = flip.el.animate([px(from), px(to)], opts);
  flip.el.firstElementChild.animate(
    [{ transform: `rotateY(${fromDeg}deg)` }, { transform: `rotateY(${toDeg}deg)` }], opts);
  flip.el.querySelector('.m-flip--back').animate(
    [{ borderRadius: fromRadius }, { borderRadius: toRadius }], opts);
  return move.finished;
}

async function flipOpen(card) {
  if (flip || flipBusy) return;
  flipBusy = true;
  const name = IMAGES[cards.indexOf(card)];
  const from = stageBox(card);

  const el = document.createElement('div');
  el.className = 'm-flip';
  const art = BACKS.has(name) ? `<img src="${backSrc(name)}" alt="" draggable="false">` : '';
  el.innerHTML = `
    <div class="m-flip--inner">
      <div class="m-flip--face m-flip--front"><img src="${card.querySelector('img').src}" alt="" draggable="false"></div>
      <div class="m-flip--face m-flip--back">${art}</div>
    </div>`;
  stage.appendChild(el);
  flip = { el, card };

  document.documentElement.classList.add('is-flipped');
  await flipAnimate(from, sheetBox(), 0, 180, cardRadius(from), sheetRadius);
  flipBusy = false;
}

async function flipClose() {
  if (!flip || flipBusy) return;
  flipBusy = true;
  document.documentElement.classList.remove('is-flipped');
  flip.el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  // The card is hidden but still laid out, so its box is where to land
  const to = stageBox(flip.card);
  await flipAnimate(sheetBox(), to, 180, 360, sheetRadius, cardRadius(to));
  flip.el.remove();
  flip = null;
  flipBusy = false;
}

overlay.addEventListener('click', flipClose);
stage.addEventListener('click', (e) => { if (flip && e.target.closest('.m-flip')) flipClose(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') flipClose(); });

// Arrow keys step through the cards, opening the dial while they do
let keyTimer = 0;
addEventListener('keydown', (e) => {
  if (flip) return;
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  goTo(posTarget + (e.key === 'ArrowRight' ? 1 : -1));
  openTarget = 1;
  clearTimeout(keyTimer);
  keyTimer = setTimeout(() => { openTarget = 0; }, 600);
});
