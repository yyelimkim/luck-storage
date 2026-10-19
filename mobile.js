// iPhone prototype: the dial at the bottom is the desktop's line scroller
// bent onto an arc, one line per card, round and round. A tab bar sits under it.
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
const DIAL_DROP = 6;      // px the dial sits lower than in Figma

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
const HEAD_H = 54;        // header row, 10 below the status bar, and its height
const HEAD_GAP = 73;      // least space kept between header and cards

const FOCUS_SCALE = 1.12;  // the centre card grows by this much over its neighbours
const SIDE_OPACITY = 0.8;  // neighbours one slot out fade to this
const LINE_STEP = 3.7; // degrees between the dial's lines, one per card
const LINE_R = 200;    // the lines' arc: much wider than the dial, so flatter...
const LINE_TOP = 96;   // ...with its top where the dial's own edge would be
// The tab bar: 51 tall, 42 off the bottom in Figma (376:5463); lower on a
// phone, where the browser's own bar is already below it
const NAV_H = 51;
const NAV_BOTTOM = { preview: 42, phone: 24 };
// The dial's lowest line, in the Figma frame, and the space always kept
// between it and the tab bar, so both can be used
const LINES_Y = 778.8;
const LINE_GAP = 32;
const START = IMAGES.indexOf('테루테루보즈.png');  // centred in the Figma frames

// The deck being shown: all the cards, or one category's (see the filter).
// Slots run round the deck; slotOf maps a card to its slot, -1 if left out.
let deck = IMAGES.map((_, i) => i);
let N = deck.length;
let slotOf = deck.slice();
let deckName = 'all';
const stage = document.getElementById('stage');
const fan = document.getElementById('fan');
const dial = document.getElementById('dial');
// The dial's lines, as many as the full deck's cards; render() turns them with the cards
const lines = IMAGES.map(() => {
  const el = document.createElement('span');
  el.className = 'dial--line';
  dial.appendChild(el);
  return el;
});

// The states for the current screen: the dial's lowest line pinned at y, and
// everything shrunk about there when the screen is too short for the full fan
let REST = FIGMA_REST;
let OPEN = FIGMA_OPEN;
let stageH = FIGMA_H;
function place(st, y, f) {
  return {
    ...st,
    cx: STAGE_W / 2 + (st.cx - STAGE_W / 2) * f,
    cy: y - (LINES_Y - st.cy) * f,
    a: st.a * f, b: st.b * f, scale: st.scale * f,
    dialX: STAGE_W / 2 + (st.dialX - STAGE_W / 2) * f,
    dialY: y - (LINES_Y - st.dialY) * f,
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
  // The tab bar (and every button at its height, through --nav-bottom), then
  // the dial's lines LINE_GAP above it, then the fan in what's left
  const navBottom = phone ? NAV_BOTTOM.phone : NAV_BOTTOM.preview;
  stage.style.setProperty('--nav-bottom', `${navBottom}px`);
  const linesY = stageH - navBottom - NAV_H - LINE_GAP;
  const room = linesY - headTop - HEAD_H - HEAD_GAP;
  const f = Math.min(1, room / (LINES_Y - FAN_TOP));
  REST = place(FIGMA_REST, linesY, f);
  OPEN = place(FIGMA_OPEN, linesY, f);
}
fit();
addEventListener('resize', fit);

const cards = IMAGES.map((name, i) => {
  const el = document.createElement('div');
  el.className = 'm-card';
  const img = document.createElement('img');
  img.src = englishSrc(name);
  img.alt = cardName(name);
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
const relOfSlot = (s) => ((((s - pos) % N) + N + N / 2) % N) - N / 2;
const relOf = (i) => relOfSlot(slotOf[i]);
// Fades things out towards the slot opposite the centre, where the deck wraps
// round, so a small deck's cards don't jump from one side to the other
const wrapFade = (rel) => Math.max(0, Math.min(1, (N / 2 - Math.abs(rel)) / Math.min(2, N / 4)));

function goTo(p) { posTarget = Math.round(p); }

function render() {
  const t = ease(open);
  const g = {};
  for (const k in REST) g[k] = lerp(REST[k], OPEN[k], t);

  cards.forEach((el, i) => {
    if (slotOf[i] < 0) { el.style.visibility = 'hidden'; return; }
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
    el.style.opacity = (opacity * wrapFade(rel)).toFixed(3);
    el.style.setProperty('--focus', focus.toFixed(3));
  });

  dial.style.transform = `translate(${g.dialX - 107.5}px, ${g.dialY - 107.5}px) scale(${g.dialScale})`;
  // Lines run round the top of the dial with the cards, the centre card's
  // upright; they fade out towards the ends, where they wrap round
  // There are always as many lines as in the full deck, so a small deck's
  // dial is as full; they step one per card and loop on their own
  const L = lines.length;
  lines.forEach((el, j) => {
    const rel = ((((j - pos) % L) + L + L / 2) % L) - L / 2;
    el.style.top = `calc(50% + ${LINE_R - LINE_TOP}px)`;
    el.style.transform = `rotate(${rel * LINE_STEP}deg) translateY(calc(-${LINE_R}px - 100%))`;
    el.style.opacity = Math.max(0, Math.min(1, (L / 2 - Math.abs(rel)) / 2)).toFixed(3);
    el.classList.toggle('is-current', Math.abs(rel) < 0.5);
  });
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

// Dial: press opens it, turning it turns the fan one card per DIAL_DEG, far
// less than the cards' own 30° spacing, so a short turn runs through several
// cards while the fan and lines stay spread out
const DIAL_DEG = 12;
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
  const dPos = -d / DIAL_DEG;
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

// Tapping the centre card turns it over on a frosted overlay (Figma 350:3771):
// its back carries the card's name, a small drawing and what the custom is.
// Under it the ritual's sheet peeks up, saying how to perform it. Scrolling
// down brings the sheet up to fill the screen (350:4794), its interaction
// growing and firming up as it comes; the ritual is performed there. Once done the sheet says so
// (350:5111): Home, or Continue to keep at it. The back arrow steps back:
// sheet down, then the card turned back over.
const FLIP_MS = 700;
const FLIP_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';  // same as the desktop flip
const SHEET_MS = 450;
const INFO_MARGIN = 16;    // the turned-over card's side margins on screen (350:3773)
const CARD_RATIO = 1486 / 1040;  // the card artwork's height to width
const INFO_TOP = 64;       // under the back arrow's row
const PEEK = 148;          // how much of the sheet shows under the card...
const MIN_PEEK = 48;       // ...at least, so its arrow always shows...
const PEEK_GAP = 16;       // ...when it gives way to keep this clear of the card
const INFO_DROP = 0.25;    // share of the card's spare room that goes above it
const PANEL_RADIUS = 37.13;  // the card's corner at the screen's width
const SHEET_RADIUS = 30;
const RITUAL_SCALE = 0.92;   // the peeking sheet's interaction: its size...
const RITUAL_OPACITY = 0.4;  // ...and opacity, both 1 once the sheet fills the screen
const HOWTO_TOP = 52;        // the how-to line in the peeking sheet...
const HOWTO_TOP_FULL = 17;   // ...and beside the back arrow once full
const backBtn = document.getElementById('back');
const titleEl = document.getElementById('title');
let flipBusy = false;

const headTop = () => (document.documentElement.classList.contains('is-phone') ? 0 : 44);
// The turned-over card's width: the screen's less 16px either side
const infoWidth = () => STAGE_W - 2 * (document.documentElement.classList.contains('is-phone') ? INFO_MARGIN / fitScale : INFO_MARGIN);
// The sheet peeks PEEK under the card; on screens where that would cover
// the card it drops to PEEK_GAP below it, but never below MIN_PEEK
const peek = () => {
  const free = stageH - (headTop() + INFO_TOP) - infoWidth() * CARD_RATIO - PEEK_GAP;
  return Math.max(MIN_PEEK, Math.min(PEEK, free));
};
const sheetTop = () => stageH - peek();

// The card's on-screen box in stage px (it's upright when centred)
function stageBox(el) {
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  return {
    left: (r.left - s.left) / fitScale, top: (r.top - s.top) / fitScale,
    width: r.width / fitScale, height: r.height / fitScale,
  };
}

// The turned-over card: the screen's width less 16px either side on any
// phone, in the space between the back arrow's row and the peeking sheet,
// nearer the top (INFO_DROP of the spare room above it). It keeps the
// card's proportions at that width; on screens too short for all of it, it
// runs under the peeking sheet. k is its scale from 402 wide; h its height
// laid out at that width.
function infoBox() {
  const above = headTop() + INFO_TOP;
  const room = sheetTop() - above;
  const width = infoWidth();
  const margin = (STAGE_W - width) / 2;
  const k = width / STAGE_W;
  // Always the card's own proportions at that width
  const height = width * CARD_RATIO;
  return { left: margin, top: above + Math.max(0, room - height) * INFO_DROP, width, height, k, h: height / k };
}

const midBox = (a, b) => ({
  left: (a.left + b.left) / 2, top: (a.top + b.top) / 2,
  width: (a.width + b.width) / 2, height: (a.height + b.height) / 2,
});

// Card corners follow the artwork's own curve
const cardRadius = (r) => `${r.width * 0.082}px / ${r.height * 0.0572}px`;  // matches .m-card
const px = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });

// boxes and radii run start → edge-on → end, alongside 0° → 90° → 180°
function flipAnimate(boxes, fromDeg, radii) {
  const opts = { duration: FLIP_MS, easing: FLIP_EASE, fill: 'forwards' };
  const move = flip.el.animate(boxes.map(px), opts);
  flip.el.firstElementChild.animate(
    [0, 90, 180].map((d) => ({ transform: `rotateY(${fromDeg + d}deg)` })), opts);
  flip.el.querySelector('.m-flip--back').animate(radii.map((r) => ({ borderRadius: r })), opts);
  return move.finished;
}

// Teru Teru Bozu's own drawings: a small line version for the info card
// (341:2461) and the full doll for the ritual (340:2185). Layers are
// [file, left, top, width, height, rotate, stroke spill (CSS inset)].
const TERU_SMALL = [
  ['string-small', 22.84, 0, 9.619, 49.638, 1.54, '-1.01% -6.03%', 8.292, 49.433],
  ['body-small', 0, 87.76, 54.347, 41.879, 0, '-1.19% -0.92%'],
  ['knot', 22.58, 37.62, 10.1, 4.108, 0, '', 0, 0, 1],
  ['knot', 22.58, 41.04, 10.1, 4.108, 0, '', 0, 0, 1],
  ['head-small', 5.11, 45.23, 44.436, 44.436, 0, ''],
  ['neck-small', 11.82, 85.84, 31.01, 8.312, 0, '-6.02% -1.61%'],
  ['shadow-small', 33.3, 91.29, 10.723, 2.523, 0, '-28.35% -4% -19.76% -0.77%'],
  ['face-small', 7.2, 68.04, 22.058, 7.992, 0, ''],
];
const TERU_BIG = [
  ['string', 177.89, 43, 31.458, 227.852, 1.54, '-0.25% -2.28%', 25.353, 227.252],
  ['body', 110.09, 387.46, 166.172, 128.05, 0, '-0.45% -0.35%'],
  ['knot', 179.13, 234.17, 30.881, 12.562, 0, '', 0, 0, 1.157],
  ['knot', 179.13, 244.64, 30.881, 12.562, 0, '', 0, 0, 1.157],
  ['head', 125.7, 257.44, 135.87, 135.87, 0, ''],
  ['neck', 146.23, 381.6, 94.816, 25.415, 0, '-2.28% -0.61%'],
  ['shadow', 211.92, 398.25, 32.786, 7.714, 0, ''],
  ['face', 132.09, 327.19, 67.446, 24.435, 0, ''],
];
// [dx, dy] shifts every layer, so a drawing can start at its own top left
function drawing(layers, knotColor, [dx, dy] = [0, 0]) {
  return layers.map(([file, left, top, w, h, rot, spill, iw, ih, knot]) => {
    const box = `left:${left - dx}px; top:${top - dy}px; width:${w}px; height:${h}px;`;
    // The knot is two rounded bars, drawn rather than exported
    if (file === 'knot') return `<span class="draw--knot" style="${box} background:${knotColor}; border-width:${knot}px"></span>`;
    const img = `<img src="assets/teru/${file}.svg" alt="" draggable="false">`;
    // A rotated layer sits centred in its box at its own size
    const inner = rot
      ? `<span class="draw--rot" style="width:${iw}px; height:${ih}px; transform:rotate(${rot}deg)"><span class="draw--spill" style="inset:${spill}">${img}</span></span>`
      : `<span class="draw--spill" style="inset:${spill || 0}">${img}</span>`;
    return `<span class="draw--part" style="${box}">${inner}</span>`;
  }).join('');
}

const ICON_H = 129.639;  // the small drawing's height (Teru's, in Figma)

// Other cards' small drawings, exported whole from Figma and re-framed so
// the centre of their black linework is the middle: [file, width, height]
const ICONS = {
  '명태 액막이.png': ['pollock', 108.18, 100],      // 343:2694
  '촛불 한번에 불기.png': ['candles', 120.5, 101],  // 343:2565
  '걱정인형.png': ['worry-doll', 147.76, 96],        // 343:2693
  '꽃잎 점.png': ['love-me', 98.98, 105],            // 344:3658
  '돌팝 쌓기.png': ['stones', 96.54, 102],          // 344:3670
  '부처님 배 만지기.png': ['buddha', 112.34, 109],    // 344:3680
  '돼지꿈.png': ['pig', 98.14, 91],                  // 344:3718
};

// Cards without drawings of their own yet show their artwork instead: the
// part inside the art's frame line, at the scale where the card is as wide
// as the screen (or a given width)
const ART_CROP = { left: 91, top: 116, right: 949, bottom: 1402 };
const ARTWORK_RATIO = (ART_CROP.right - ART_CROP.left) / (ART_CROP.bottom - ART_CROP.top);
function artCrop(name, width, extra = '') {
  const c = ART_CROP;
  const k = width / (c.right - c.left);
  return `<div class="panel--art" style="width:${width}px; height:${(c.bottom - c.top) * k}px;
    background-image:url('${englishSrc(name)}');
    background-size:${1040 * k}px auto;
    background-position:${-c.left * k}px ${-c.top * k}px; ${extra}"></div>`;
}

// The back of the card: name, small drawing, what the custom is
function panelHTML(name) {
  const text = CARD_TEXT[name] || {};
  const drawn = ICONS[name];
  const icon = name === '테루테루보즈.png'
    ? `<div class="info--icon draw" style="width:54.347px; height:129.639px">${drawing(TERU_SMALL, CARD_COLOR[name])}</div>`
    : drawn
      ? `<img class="info--icon" src="assets/icons/${drawn[0]}.svg" width="${drawn[1]}" height="${drawn[2]}" alt="">`
      : `<div class="info--icon">${artCrop(name, ICON_H * ARTWORK_RATIO)}</div>`;
  return `
    <div class="panel" style="--card-color: ${CARD_COLOR[name]}">
      <div class="panel--info">
        <div class="info--frame"></div>
        <div class="info--tag">${categoryTag(CATEGORY[name])}</div>
        <div class="info--body">
          ${icon}
          ${text.about ? `<p class="info--text">${text.about}</p>` : ''}
        </div>
      </div>
      <div class="panel--paper"></div>
    </div>`;
}

// Teru Teru Bozu's ritual (350:4886): the doll under a sun and two clouds,
// placed around the doll's own box as in Figma
const TERU_SCENE = [
  ['sun', -44.66, 48.29, 81.773, 81.773],
  ['cloud-left', -111, 88.4, 125.319, 53.365],
  ['cloud-right', 166.72, 2, 125.319, 53.364],
];

// The ritual's sheet: how to perform it, the card's interaction, and what
// shows once the luck is claimed
function sheetHTML(name) {
  const text = CARD_TEXT[name] || {};
  const title = cardName(name);
  const ritual = CANVAS_PAGES[name]
    ? `<iframe class="ritual--piece" src="${CANVAS_PAGES[name]}&sheet" title="${title}"></iframe>`
    : name === '테루테루보즈.png'
      ? `<div class="ritual--teru">
          <div class="teru--doll draw">${drawing(TERU_BIG, 'var(--system-black)', [110.09, 43])}</div>
          ${TERU_SCENE.map(([file, left, top, w, h]) =>
            `<img class="teru--scene" src="assets/ritual/${file}.svg" style="left:${left}px; top:${top}px" width="${w}" height="${h}" alt="">`).join('')}
        </div>`
      // No interaction of its own yet: the artwork, tapped to claim
      : `<button type="button" class="ritual--art" aria-label="Claim luck">${artCrop(name, STAGE_W - 2 * ART_CROP.left * (STAGE_W / 1040))}</button>`;
  return `
    <div class="sheet--fade"></div>
    <img class="sheet--chevron" src="assets/system/chevron-down.svg" width="53.001" height="12.095" alt="">
    <p class="sheet--howto">${text.howTo || ''}</p>
    <div class="sheet--ritual">${ritual}</div>
    <div class="sheet--claimed">
      <div class="claimed--glow"></div>
      <div class="claimed--body">
        <div class="claimed--text">
          <img class="claimed--clover" src="assets/system/clover-claimed.svg" width="76.6022" height="76.6022" alt="">
          <p class="claimed--title">Luck Claimed!</p>
          <p class="claimed--sub">Come back tomorrow to claim luck again!</p>
        </div>
        <button type="button" class="claimed--btn" data-act="home">Home</button>
      </div>
    </div>`;
}

// --- The sheet: p runs 0 (peeking under the card) → 1 (filling the screen) ---
let sheet = null;  // { el, p, claimed }

function setSheet(p) {
  sheet.p = p;
  // Below 0 the sheet is only arriving or leaving; past 1 it's overshooting
  // as it snaps into place
  const q = Math.max(0, Math.min(1, p));
  const r = SHEET_RADIUS * (1 - q);
  Object.assign(sheet.el.style, {
    transform: `translateY(${sheetTop() * (1 - p)}px)`,
    borderRadius: `${r}px ${r}px 0 0`,
  });
  sheet.el.style.setProperty('--p', q);
  sheet.el.querySelector('.sheet--howto').style.top = `${lerp(HOWTO_TOP, headTop() + HOWTO_TOP_FULL, q)}px`;
  sheet.el.classList.toggle('is-full', p === 1);
  // The card's name gives way to the how-to as the sheet takes the top
  titleEl.style.opacity = 1 - q;
  // The card scrolls up with it
  flip.el.style.transform = `translateY(${-sheetTop() * Math.max(0, p)}px)`;
}

// Glide the sheet to p, from wherever it is (also its entrance and exit,
// from below the screen, p < 0)
const easeOut = (t) => 1 - (1 - t) ** 3;
// Lands a touch past and settles back: the snap
const SNAP_BACK = 1;
const snapEase = (t) => 1 + (SNAP_BACK + 1) * (t - 1) ** 3 + SNAP_BACK * (t - 1) ** 2;
function sheetTo(to, ms = SHEET_MS, curve = easeOut) {
  const from = sheet.p;
  const t0 = performance.now();
  sheet.anim = t0;
  return new Promise((done) => {
    (function frame(now) {
      if (!sheet || sheet.anim !== t0) return done();
      const t = Math.min(1, (now - t0) / ms);
      setSheet(lerp(from, to, curve(t)));
      if (t < 1) requestAnimationFrame(frame); else done();
    })(t0);
  });
}

// The interaction gets the screen under the how-to line (as it sits once
// the sheet is full), shrinking if need be so all of it shows at once,
// centred. Returns its scale.
const RITUAL_GAP = 24;
function fitRitual(sh) {
  const howto = sh.querySelector('.sheet--howto');
  const top = headTop() + HOWTO_TOP_FULL + howto.offsetHeight + RITUAL_GAP;
  sh.style.setProperty('--ritual-top', `${top}px`);
  const piece = sh.querySelector('.ritual--teru, .ritual--art');
  if (!piece) return 1;
  const k = Math.min(1, (stageH - top - RITUAL_GAP) / piece.offsetHeight);
  piece.style.transform = `scale(${k})`;
  return k;
}

function claimed() {
  if (!sheet || sheet.claimed) return;
  sheet.claimed = true;
  sheet.el.classList.add('is-claimed');
}
addEventListener('message', (e) => { if (e.data === 'luck-claimed') claimed(); });

// Drag Teru Teru Bozu up to hang it; let go high enough and it hangs, swaying
const TERU_DROP = 90;  // how far below its hanging spot the doll starts
function teruRitual(el, k) {
  const doll = el.querySelector('.teru--doll');
  if (!doll) return;
  let off = TERU_DROP;
  let grab = null;
  let hung = false;
  const set = (o) => { off = o; doll.style.transform = `translateY(${o}px)`; };
  set(TERU_DROP);
  doll.addEventListener('pointerdown', (e) => {
    if (hung) return;
    doll.setPointerCapture(e.pointerId);
    doll.getAnimations().forEach((a) => a.cancel());
    grab = { y: e.clientY, off };
  });
  doll.addEventListener('pointermove', (e) => {
    if (!grab) return;
    set(Math.max(-10, Math.min(TERU_DROP + 40, grab.off + (e.clientY - grab.y) / (fitScale * k))));
  });
  const letGo = async () => {
    if (!grab) return;
    grab = null;
    if (off > TERU_DROP * 0.4) {
      await doll.animate([{ transform: `translateY(${off}px)` }, { transform: `translateY(${TERU_DROP}px)` }],
        { duration: 400, easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)' }).finished;
      set(TERU_DROP);
      return;
    }
    hung = true;
    doll.classList.add('is-hung');
    await doll.animate([{ transform: `translateY(${off}px)` }, { transform: 'translateY(0)' }],
      { duration: 250, easing: 'ease-out' }).finished;
    set(0);
    doll.animate(['0deg', '5deg', '-3.5deg', '2deg', '-1deg', '0deg'].map((d) => ({ transform: `rotate(${d})` })),
      { duration: 1800, easing: 'ease-out' });
    setTimeout(claimed, 700);
  };
  doll.addEventListener('pointerup', letGo);
  doll.addEventListener('pointercancel', letGo);
}

async function flipOpen(card) {
  if (flip || flipBusy) return;
  flipBusy = true;
  const name = IMAGES[cards.indexOf(card)];
  const from = stageBox(card);
  const to = infoBox();

  const el = document.createElement('div');
  el.className = 'm-flip';
  el.style.setProperty('--k', to.k);
  el.style.setProperty('--info-h', `${to.h}px`);
  titleEl.textContent = cardName(name);
  el.innerHTML = `
    <div class="m-flip--inner">
      <div class="m-flip--face m-flip--front"><img src="${card.querySelector('img').src}" alt="" draggable="false"></div>
      <div class="m-flip--face m-flip--back">${panelHTML(name)}</div>
    </div>`;
  stage.appendChild(el);
  flip = { el, card, box: to };

  const sh = document.createElement('div');
  sh.className = 'sheet';
  sh.style.setProperty('--card-color', CARD_COLOR[name]);
  sh.style.setProperty('--glow-color', GLOW_COLOR[CARD_COLOR[name]]);
  sh.style.height = `${stageH}px`;
  sh.style.setProperty('--ritual-scale', RITUAL_SCALE);
  sh.style.setProperty('--ritual-opacity', RITUAL_OPACITY);
  sh.innerHTML = sheetHTML(name);
  stage.appendChild(sh);
  sheet = { el: sh, p: -peek() / sheetTop(), claimed: false };
  setSheet(sheet.p);
  teruRitual(sh, fitRitual(sh));
  sh.querySelector('.ritual--art')?.addEventListener('click', claimed);
  sh.querySelector('.claimed--btn').addEventListener('click', goHome);

  document.documentElement.classList.add('is-flipped');
  await flipAnimate([from, midBox(from, to), to], 0,
    [cardRadius(from), cardRadius(midBox(from, to)), `${PANEL_RADIUS * to.k}px`]);
  await sheetTo(0);
  flipBusy = false;
}

// Back to the home screen: from the full sheet everything drops away,
// otherwise the card turns back over into the fan
async function flipClose() {
  if (!flip || flipBusy) return;
  if (sheet.p > 0) { goHome(); return; }
  flipBusy = true;
  document.documentElement.classList.remove('is-flipped');
  await sheetTo(-peek() / sheetTop(), SHEET_MS * 0.6);
  sheet.el.remove();
  sheet = null;
  flip.el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  // The card is hidden but still laid out, so its box is where to land
  const from = flip.box;
  const to = stageBox(flip.card);
  await flipAnimate([from, midBox(from, to), to], 180,
    [`${PANEL_RADIUS * from.k}px`, cardRadius(midBox(from, to)), cardRadius(to)]);
  flip.el.remove();
  flip = null;
  flipBusy = false;
}

// Home from the full or claimed sheet: it all fades away, no turning back over.
// Luck claimed, its clover stays behind and flies into the header's count.
async function goHome() {
  if (!flip || flipBusy) return;
  flipBusy = true;
  const flight = sheet.claimed && flyClover(sheet.el.querySelector('.claimed--clover'));
  document.documentElement.classList.remove('is-flipped');
  const fade = { duration: SHEET_MS, easing: 'ease-out', fill: 'forwards' };
  await Promise.all([sheet.el, flip.el].map((e) =>
    e.animate([{ opacity: 1 }, { opacity: 0 }], fade).finished));
  sheet.el.remove();
  flip.el.remove();
  sheet = null;
  flip = null;
  flipBusy = false;
  if (flight) { await flight; addLuck(); }
}

// The luck claimed so far, counted in the header's pill
const countEl = document.getElementById('count');
const countIcon = countEl.querySelector('img');
const countNum = document.getElementById('count-num');
let luck = Number(countNum.textContent);

const CLOVER_FLY_MS = 820;
// The claimed clover lifts off, shrinks along a curve up to the header's
// clover, unwinding its tilt and turning from white to the header's ink
function flyClover(src) {
  // Its box untilted: the tilted one's centre, at its own size
  const tilted = stageBox(src);
  const size = src.offsetWidth;
  const from = {
    left: tilted.left + (tilted.width - size) / 2, top: tilted.top + (tilted.height - size) / 2,
    width: size, height: size,
  };
  const to = stageBox(countIcon);
  const fly = document.createElement('div');
  fly.className = 'clover-fly';
  fly.innerHTML = `<img src="assets/system/clover-claimed.svg" alt=""><img src="${countIcon.getAttribute('src')}" alt="">`;
  Object.assign(fly.style, px(from));
  stage.appendChild(fly);
  src.style.visibility = 'hidden';
  // Scale and move from the clover's box to the icon's, bowing out sideways
  const k = to.width / from.width;
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const at = (t, bow) => `translate(${dx * t + bow}px, ${dy * t * t}px) scale(${lerp(1, k, t)})`;
  const opts = { duration: CLOVER_FLY_MS, easing: 'cubic-bezier(0.5, 0, 0.2, 1)', fill: 'forwards' };
  const move = fly.animate([
    { transform: `${at(0, 0)} rotate(15deg)` },
    { transform: `${at(0, 0)} scale(1.12) rotate(5deg)`, offset: 0.14 },
    { transform: `${at(0.55, dx * 0.25)} rotate(-25deg)`, offset: 0.6 },
    { transform: `${at(1, 0)} rotate(0deg)` },
  ], opts);
  fly.lastElementChild.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], opts);
  return move.finished.then(() => fly.remove());
}

// The pill takes the clover in: it bumps, and the count rolls up by one
// The count changes by d: the pill bumps and the number rolls, up as luck
// comes in, down as it's spent (on wishes, see tree.js)
function changeLuck(d) {
  luck += d;
  const dir = d > 0 ? 1 : -1;
  countIcon.animate([
    { transform: `scale(1.5) rotate(${-20 * dir}deg)` },
    { transform: `scale(0.9) rotate(${8 * dir}deg)`, offset: 0.5 },
    { transform: 'none' },
  ], { duration: 420, easing: 'ease-out' });
  countEl.animate([
    { transform: 'scale(1)' }, { transform: 'scale(1.1)', offset: 0.35 }, { transform: 'scale(1)' },
  ], { duration: 420, easing: 'cubic-bezier(0.3, 1.6, 0.5, 1)' });
  const roll = { duration: 360, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' };
  countNum.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-60 * dir}%)`, opacity: 0 }], roll)
    .finished.then(() => {
      countNum.textContent = String(luck);
      countNum.animate([{ transform: `translateY(${60 * dir}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], roll);
    });
}
const addLuck = () => changeLuck(1);

backBtn.addEventListener('click', flipClose);
addEventListener('keydown', (e) => { if (e.key === 'Escape') flipClose(); });

// Scrolling (wheel or a drag anywhere but the ritual itself) moves the sheet
// with it; let go and it settles fully up or back down
let scroll = null;
let dragEnd = 0;
// A drag isn't a tap: the click that ends it doesn't close or open anything
addEventListener('click', (e) => { if (performance.now() - dragEnd < 100) e.stopPropagation(); }, true);
// Moved this far from where it rested (or flicked), it snaps the rest of the way
const SNAP_AT = 0.06;
function settle(from, dir) {
  if (!sheet) return;
  const p = sheet.p;
  if (dir > 0 || p - from >= SNAP_AT) snapTo(1);
  else if (dir < 0 || from - p >= SNAP_AT) snapTo(0);
  else snapTo(from);
}
// Snap into place; scrolling that's still coming in (a trackpad's glide)
// is let go until it has
const SNAP_MS = 520;
let snapping = 0;
async function snapTo(p) {
  snapping = performance.now();
  await sheetTo(p, SNAP_MS, snapEase);
}
stage.addEventListener('pointerdown', (e) => {
  if (!sheet || flipBusy || e.target.closest('.sheet--ritual, .sheet--claimed, .m-back')) return;
  if (sheet.p === 1 && !e.target.closest('.sheet')) return;
  sheet.anim = 0;
  scroll = { y: e.clientY, p: sheet.p, last: e.clientY, t: e.timeStamp, v: 0, moved: false };
});
addEventListener('pointermove', (e) => {
  if (!scroll) return;
  const dy = (e.clientY - scroll.y) / fitScale;
  if (!scroll.moved && Math.abs(dy) < 6) return;
  scroll.moved = true;
  scroll.v = (scroll.last - e.clientY) / Math.max(1, e.timeStamp - scroll.t);
  scroll.last = e.clientY;
  scroll.t = e.timeStamp;
  setSheet(Math.max(0, Math.min(1, scroll.p - dy / sheetTop())));
});
addEventListener('pointerup', () => {
  if (!scroll) return;
  const { moved, v, p } = scroll;
  scroll = null;
  if (!moved) return;
  dragEnd = performance.now();
  settle(p, Math.abs(v) > 0.3 ? Math.sign(v) : 0);
});
// Tapping the peeking sheet brings it up too
stage.addEventListener('click', (e) => {
  if (sheet && sheet.p === 0 && !flipBusy && e.target.closest('.sheet')) snapTo(1);
});
let wheelTimer = 0;
stage.addEventListener('wheel', (e) => {
  if (!sheet || flipBusy) return;
  e.preventDefault();
  clearTimeout(wheelTimer);
  // Swallow the rest of the glide that set off a snap
  if (performance.now() - snapping < SNAP_MS + 250) {
    snapping = performance.now() - SNAP_MS;
    return;
  }
  sheet.anim = 0;
  const p = Math.max(0, Math.min(1, sheet.p + e.deltaY / sheetTop()));
  setSheet(p);
  if (e.deltaY > 0 && p >= SNAP_AT && p < 1) snapTo(1);
  else if (e.deltaY < 0 && p <= 1 - SNAP_AT && p > 0) snapTo(0);
  // Not far enough to snap: back where it was
  else wheelTimer = setTimeout(() => snapTo(Math.round(sheet.p)), 150);
}, { passive: false });

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

// Tab bar: only Home is built so far, so the others just take the highlight
const tabs = [...document.querySelectorAll('.m-nav--tab')];
tabs.forEach((t) => t.addEventListener('click', () => {
  tabs.forEach((o) => o.toggleAttribute('aria-current', o === t));
  // Profile and Tree swap the cards for their own page
  stage.dataset.view = t.dataset.tab;
}));

// Filter (the header's deck name): a sheet of the categories, picked one at a
// time and applied with Done; the fan swaps decks in a quick fade
const filterEl = document.getElementById('filter');
const filterOpts = document.getElementById('filter-options');
const deckTitle = document.querySelector('.head--title');
const DECKS = ['all', 'protection', 'calm', 'luck', 'success'];
let picked = deckName;
const deckLabel = (d) => (d === 'all' ? 'All Cards' : d[0].toUpperCase() + d.slice(1));
// A tile per deck: its icon over its name, in colour once picked
filterOpts.innerHTML = DECKS.map((d) =>
  `<button type="button" class="filter--opt" data-deck="${d}">
    <span class="filter--icon">
      <img class="is-off" src="assets/filter/${d}-off.svg?v=3" alt="">
      <img class="is-on" src="assets/filter/${d}-on.svg?v=3" alt="">
    </span>
    <span class="filter--name">${deckLabel(d)}</span>
  </button>`).join('');
const opts = [...filterOpts.children];
const showPicked = () => opts.forEach((o) => o.setAttribute('aria-pressed', String(o.dataset.deck === picked)));
opts.forEach((o) => o.addEventListener('click', () => { picked = o.dataset.deck; showPicked(); }));

function openFilter() {
  picked = deckName;
  showPicked();
  filterEl.classList.add('is-open');
  filterEl.setAttribute('aria-hidden', 'false');
  deckTitle.setAttribute('aria-expanded', 'true');
}
function closeFilter() {
  filterEl.classList.remove('is-open');
  filterEl.setAttribute('aria-hidden', 'true');
  deckTitle.setAttribute('aria-expanded', 'false');
}
deckTitle.addEventListener('click', openFilter);
filterEl.querySelector('.filter--scrim').addEventListener('click', closeFilter);
filterEl.querySelector('.filter--close').addEventListener('click', closeFilter);
filterEl.querySelector('.filter--confirm').addEventListener('click', () => {
  closeFilter();
  if (picked !== deckName) setDeck(picked);
});
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFilter(); });

async function setDeck(name) {
  const centred = deck[((Math.round(posTarget) % N) + N) % N];
  const out = { duration: 180, easing: 'ease-in', fill: 'forwards' };
  // The fan sinks as it fades; the dial (placed by its own transform) just fades
  const lift = (el, y) => (el === fan ? { transform: `translateY(${y}px)` } : {});
  await Promise.all([fan, dial].map((el) =>
    el.animate([{ opacity: 1 }, { opacity: 0, ...lift(el, 12) }], out).finished));
  deckName = name;
  deck = IMAGES.map((_, i) => i).filter((i) => name === 'all' || CATEGORY[IMAGES[i]] === name);
  N = deck.length;
  slotOf = IMAGES.map((_, i) => deck.indexOf(i));
  // Keep the centred card if it's in the new deck, else start at its top
  pos = posTarget = Math.max(0, slotOf[centred]);
  deckTitle.querySelector('h1').textContent = deckLabel(name);
  render();
  [fan, dial].forEach((el) => {
    el.getAnimations().forEach((a) => a.cancel());
    el.animate([{ opacity: 0, ...lift(el, 12) }, { opacity: 1, ...lift(el, 0) }],
      { duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
  });
}

// "October 19th"
const ordinal = (d) => d + (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th');
const longDate = (date) => `${date.toLocaleDateString('en-US', { month: 'long' })} ${ordinal(date.getDate())}, ${date.getFullYear()}`;

// Profile: greeted for the time of day, with today's date on the fortune card
(function profileText() {
  const now = new Date();
  const h = now.getHours();
  document.getElementById('hello').textContent =
    `Good ${h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'},`;
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  document.getElementById('today').textContent = `${day},  ${month} ${ordinal(now.getDate())}`;
}());

// Daily Fortune (from the profile's fortune card): today's reading, a lucky
// number, colour and ritual, all picked by the date so they hold all day
const FORTUNES = [
  ['Worries ease, goals land, and your work grows today.',
    'Things fall into place more easily than usual. You’ll have energy to spare and a clear head, so plans that stalled should start moving again. A good day to pick back up whatever you set aside.'],
  ['A small kindness comes back to you twice.',
    'Something you do without thinking makes someone’s day, and it finds its way back to you before evening. Say yes to the small favour; it opens a bigger door.'],
  ['Good news is closer than it looks.',
    'A message you’ve been waiting on is on its way. Keep your plans light this afternoon so you can move quickly when it comes.'],
  ['A steady day that rewards patience.',
    'Nothing rushes today, and that’s the gift. Finish one thing properly instead of starting three; the care you put in now pays off later this week.'],
  ['Luck follows you somewhere new.',
    'Take the other route, try the other café, sit somewhere different. A change of scene brings a chance meeting or an idea worth keeping.'],
];
const LUCKY_COLOURS = [
  ['Yellow-Green', 'var(--yellow-green)'], ['Forest Green', 'var(--forest-green)'],
  ['v2 Blue', 'var(--v2-blue)'], ['Light Pink', 'var(--light-pink)'],
  ['Hot Pink', 'var(--hot-pink)'], ['Yellow', 'var(--yellow)'],
];
const fortuneEl = document.getElementById('fortune');
const fortuneSee = document.getElementById('fortune-see');
const birthInput = document.getElementById('fortune-birth-input');
// The cards with line drawings, filled UI White like the tile they sit on.
// Today's ritual is always one of these.
const RITUAL_ART = {
  '명태 액막이.png': 'assets/fortune/ritual-pollock.svg',
  '돌팝 쌓기.png': 'assets/fortune/ritual-stones.svg',
  '부처님 배 만지기.png': 'assets/fortune/ritual-buddha.svg',
  '돼지꿈.png': 'assets/fortune/pig-line.svg',
};
const RITUALS = Object.keys(RITUAL_ART);
let luckyCard = START;
let fortuneTimer;

// The birthday seeds the fortune with the date: kept in this browser only
let birthday = '2006-04-15';
try { birthday = localStorage.getItem('birthday') || birthday; } catch (e) {}
const birthDate = () => new Date(`${birthday}T00:00`);

function fillFortune() {
  const now = new Date();
  const b = birthDate();
  const day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  const seed = day + b.getMonth() * 31 + b.getDate();
  const [headline, body] = FORTUNES[seed % FORTUNES.length];
  const [colourName, colour] = LUCKY_COLOURS[(seed * 7) % LUCKY_COLOURS.length];
  const card = RITUALS[(seed * 5) % RITUALS.length];
  luckyCard = IMAGES.indexOf(card);
  fortuneEl.querySelectorAll('.fortune--today').forEach((p) => { p.textContent = longDate(now); });
  document.getElementById('fortune-birth').textContent = longDate(b);
  birthInput.value = birthday;
  document.getElementById('fortune-headline').textContent = headline;
  document.getElementById('fortune-body').textContent = body;
  document.getElementById('fortune-swatch').style.background = colour;
  document.getElementById('fortune-colour').textContent = colourName;
  document.getElementById('fortune-art').innerHTML = `<img src="${RITUAL_ART[card]}" alt="">`;
  document.getElementById('fortune-ritual-name').textContent = cardName(card);
}
// Step by step: the ring fills (loading), the clovers turn (ready), then the
// reading (result)
function fortuneStep(step) {
  fortuneEl.dataset.step = step;
  fortuneSee.disabled = step === 'loading';
}
function loadFortune() {
  clearTimeout(fortuneTimer);
  fillFortune();
  fortuneStep('loading');
  // Replay the ring's fill from empty
  const arc = fortuneEl.querySelector('.fortune--arc path');
  arc.style.animation = 'none';
  void arc.getBoundingClientRect();
  arc.style.animation = '';
  fortuneTimer = setTimeout(() => fortuneStep('ready'), 2750);
}
function openFortune() {
  fortuneEl.querySelector('.fortune--result').scrollTop = 0;
  loadFortune();
  fortuneEl.classList.add('is-open');
  fortuneEl.setAttribute('aria-hidden', 'false');
}
function closeFortune() {
  clearTimeout(fortuneTimer);
  fortuneEl.classList.remove('is-open');
  fortuneEl.setAttribute('aria-hidden', 'true');
}
document.querySelector('.profile--fortune').addEventListener('click', openFortune);
fortuneEl.querySelector('.fortune--back').addEventListener('click', closeFortune);
// The date pill carries over to the reading: it rises and shrinks into its
// place there, its line and text easing to Dark Grey on the way
function flyPill() {
  const [a, b] = fortuneEl.querySelectorAll('.fortune--today');
  const box = fortuneEl.getBoundingClientRect();
  const k = box.width / fortuneEl.offsetWidth;
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();
  const end = getComputedStyle(b);
  const fly = a.cloneNode(true);
  fly.className = 'fortune--pill';
  Object.assign(fly.style, {
    position: 'absolute', zIndex: 4, margin: 0,
    left: `${(r1.left - box.left) / k}px`, top: `${(r1.top - box.top) / k}px`,
  });
  fortuneEl.appendChild(fly);
  a.style.visibility = 'hidden';
  b.style.visibility = 'hidden';
  const dx = (r2.left + r2.width / 2 - r1.left - r1.width / 2) / k;
  const dy = (r2.top + r2.height / 2 - r1.top - r1.height / 2) / k;
  fly.animate([
    { transform: 'none' },
    { transform: `translate(${dx}px, ${dy}px) scale(${r2.width / r1.width})`, borderColor: end.borderTopColor, color: end.color },
  ], { duration: 600, easing: 'cubic-bezier(0.3, 0.8, 0.2, 1)', fill: 'forwards' }).finished.then(() => {
    fly.remove();
    a.style.visibility = '';
    b.style.visibility = '';
  });
}
fortuneSee.addEventListener('click', () => {
  flyPill();
  fortuneStep('result');
});
// A new birthday reads the fortune again
fortuneEl.querySelector('.fortune--birth').addEventListener('click', (e) => {
  e.preventDefault();
  try { birthInput.showPicker(); } catch (err) { birthInput.focus(); }
});
birthInput.addEventListener('change', () => {
  if (!birthInput.value) return;
  birthday = birthInput.value;
  try { localStorage.setItem('birthday', birthday); } catch (e) {}
  loadFortune();
});
// Off to the home screen to open a card: the fan turns to it and, once it's
// settled in the middle (and whatever was over Home has gone), it flips
// over to its back
function openOnHome(i) {
  closeFortune();
  if (deckName !== 'all') setDeck('all');
  tabs.forEach((o) => o.toggleAttribute('aria-current', o.dataset.tab === 'home'));
  stage.dataset.view = 'home';
  goTo(pos + relOfSlot(slotOf[i]));
  const start = performance.now();
  (function waitToFlip() {
    if (performance.now() - start < 500 || Math.abs(posTarget - pos) > 0.01) {
      requestAnimationFrame(waitToFlip);
      return;
    }
    flipOpen(cards[i]);
  }());
}
// Today's lucky ritual, and the profile's recently earned luck
const goClaim = () => openOnHome(luckyCard);
document.querySelectorAll('.profile--earned').forEach((b) => {
  b.addEventListener('click', () => openOnHome(IMAGES.indexOf(b.dataset.card)));
});
document.getElementById('fortune-ritual').addEventListener('click', goClaim);
