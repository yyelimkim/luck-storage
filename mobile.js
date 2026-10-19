// iPhone prototype: the cards in a stack, scrolled like the desktop strip.
// The current card is in front; the ones before it pile up behind it to the
// left, the next one waits off to the right. Swiping the cards or scrubbing
// the line scroller along the bottom moves through them.

// Everything is laid out in Figma px: the screen is always 402 wide, and as
// tall as the window allows (874 in the Figma frame and the desktop preview).
const STAGE_W = 402;
const FIGMA_H = 874;

const CARD_W = 271.675;   // the front card (.m-card), centred
const CARD_H = 388.182;
const NEXT_GAP = 24;      // between the front card and the next one, peeking in from the right
const STACK_STEP = 19;    // how far each card behind the front one shows on the left
const STACK_DEPTH = 3;    // cards showing behind it; the rest are hidden under them
const HEAD_H = 49;        // header row height
const SCROLLER_H = 56;    // the line scroller along the bottom...
const NAV_H = 64;         // ...over the tab bar
const NAV_BOTTOM = 28;    // the tab bar's gap to the screen's bottom edge
const START = IMAGES.indexOf('테루테루보즈.png');

const N = IMAGES.length;
const stage = document.getElementById('stage');
const fan = document.getElementById('fan');
const scroller = document.getElementById('scroller');

// Phone-sized windows get the screen edge to edge, the header at the very top
// (the real status bar is above the page). Anything wider shows the 402 x 874
// frame in a phone-shaped preview.
let fitScale = 1;
let stageH = FIGMA_H;
let cardY = 0;    // the cards' middle, between the header and the scroller
let cardK = 1;    // the cards' scale, smaller on screens too short for them
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
  const top = (phone ? 0 : 44) + HEAD_H;
  const bottom = stageH - NAV_BOTTOM - NAV_H - SCROLLER_H;
  cardK = Math.min(1, (bottom - top - 32) / CARD_H);
  cardY = (top + bottom) / 2;
}
fit();
addEventListener('resize', fit);

const cards = IMAGES.map((name) => {
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

// Scroller: one line per card, as on desktop
const ticks = cards.map((_, i) => {
  const t = document.createElement('button');
  t.type = 'button';
  t.className = 'm-tick';
  t.setAttribute('aria-label', cardName(IMAGES[i]));
  scroller.appendChild(t);
  return t;
});

// pos: which card is in front, fractional while moving
let pos = START;
let posTarget = START;
let dragging = false;
let flip = null;  // the card lifted into the overlay: { el, card, box }

const lerp = (a, b, t) => a + (b - a) * t;
const clampPos = (p) => Math.max(0, Math.min(N - 1, p));
function goTo(p) { posTarget = clampPos(Math.round(p)); }

function render() {
  const w = CARD_W * cardK;
  cards.forEach((el, i) => {
    const rel = i - pos;
    // In front and to the right: a card's width apart. Behind: a sliver each.
    const x = rel >= 0
      ? STAGE_W / 2 + rel * (w + NEXT_GAP)
      : STAGE_W / 2 + Math.max(rel, -STACK_DEPTH) * STACK_STEP;
    const lifted = flip && flip.card === el;
    const hidden = rel < -STACK_DEPTH - 1 || rel > 2 || lifted;
    el.style.visibility = hidden ? 'hidden' : '';
    if (hidden) return;
    el.style.transform = `translate(${x}px, ${cardY}px) translate(-50%, -50%) scale(${cardK})`;
    el.style.zIndex = String(i);
    // Cards far enough back fade into the pile
    el.style.opacity = rel < -STACK_DEPTH ? String(Math.max(0, STACK_DEPTH + 1 + rel)) : '';
  });
  const at = Math.round(pos);
  ticks.forEach((t, i) => t.toggleAttribute('aria-current', i === at));
}

(function frame() {
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

// Swiping the cards sideways moves through them, a card per card's width;
// past either end they only give a little. A tap without a swipe brings the
// tapped card to the front, or turns the front card over.
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
  let dPos = -(x - lastX) / (CARD_W * cardK + NEXT_GAP);
  if (pos + dPos < 0 || pos + dPos > N - 1) dPos /= 3;
  lastX = x;
  pos += dPos;
  track(dPos);
});
const endSwipe = () => {
  if (!dragging) return;
  if (moved) { release(); return; }
  dragging = false;
  if (!tapped) return;
  const i = cards.indexOf(tapped);
  if (i === posTarget && Math.abs(pos - i) < 0.05) flipOpen(tapped);
  else goTo(i);
};
fan.addEventListener('pointerup', endSwipe);
fan.addEventListener('pointercancel', endSwipe);

// Scrub: the line nearest the finger picks the card. Pressing and dragging
// keeps scrubbing even if the finger wanders off the lines.
let scrubbing = false;
function scrubAt(x) {
  let best = 0;
  let bestD = Infinity;
  ticks.forEach((t, i) => {
    const r = t.getBoundingClientRect();
    const d = Math.abs(x - (r.left + r.width / 2));
    if (d < bestD) { bestD = d; best = i; }
  });
  goTo(best);
}
scroller.addEventListener('pointerdown', (e) => {
  if (flip) return;
  scrubbing = true;
  scroller.setPointerCapture(e.pointerId);
  scrubAt(e.clientX);
});
scroller.addEventListener('pointermove', (e) => { if (scrubbing) scrubAt(e.clientX); });
const endScrub = () => { scrubbing = false; };
scroller.addEventListener('pointerup', endScrub);
scroller.addEventListener('pointercancel', endScrub);

// Tapping the front card turns it over on a frosted overlay (Figma 350:3771):
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
const INFO_H = 580;        // its height at most, laid out at the screen's width
const INFO_TOP = 64;       // under the back arrow's row
const PEEK = 148;          // how much of the sheet shows under the card
const CARD_GAP = 24;       // least space above and below the card
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
const sheetTop = () => stageH - PEEK;

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
// nearer the top (INFO_DROP of the spare room above it). On screens too
// short for all of it, it's shorter rather than narrower. k is its scale
// from 402 wide; h its height laid out at that width.
function infoBox() {
  const above = headTop() + INFO_TOP;
  const room = sheetTop() - above;
  const margin = document.documentElement.classList.contains('is-phone') ? INFO_MARGIN / fitScale : INFO_MARGIN;
  const width = STAGE_W - 2 * margin;
  const k = width / STAGE_W;
  const height = Math.min(INFO_H * k, room - 2 * CARD_GAP);
  return { left: margin, top: above + (room - height) * INFO_DROP, width, height, k, h: height / k };
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
        <p class="claimed--title">Luck Claimed!</p>
        <button type="button" class="claimed--btn" data-act="home">Home</button>
        <button type="button" class="claimed--btn claimed--btn-alt" data-act="continue">Continue</button>
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
  sh.style.height = `${stageH}px`;
  sh.style.setProperty('--ritual-scale', RITUAL_SCALE);
  sh.style.setProperty('--ritual-opacity', RITUAL_OPACITY);
  sh.innerHTML = sheetHTML(name);
  stage.appendChild(sh);
  sheet = { el: sh, p: -PEEK / sheetTop(), claimed: false };
  setSheet(sheet.p);
  teruRitual(sh, fitRitual(sh));
  sh.querySelector('.ritual--art')?.addEventListener('click', claimed);
  sh.querySelectorAll('.claimed--btn').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.act === 'home') goHome();
    else {
      sh.classList.remove('is-claimed');
      sheet.claimed = false;
      sh.querySelector('iframe')?.contentWindow.postMessage('luck-continue', '*');
    }
  }));

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
  await sheetTo(-PEEK / sheetTop(), SHEET_MS * 0.6);
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

// Home from the full or claimed sheet: it all fades away, no turning back over
async function goHome() {
  if (!flip || flipBusy) return;
  flipBusy = true;
  document.documentElement.classList.remove('is-flipped');
  const fade = { duration: SHEET_MS, easing: 'ease-out', fill: 'forwards' };
  await Promise.all([sheet.el, flip.el].map((e) =>
    e.animate([{ opacity: 1 }, { opacity: 0 }], fade).finished));
  sheet.el.remove();
  flip.el.remove();
  sheet = null;
  flip = null;
  flipBusy = false;
}

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

// Arrow keys step through the cards
addEventListener('keydown', (e) => {
  if (flip) return;
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  goTo(posTarget + (e.key === 'ArrowRight' ? 1 : -1));
});

// Tab bar: only Home is built so far, so the others just take the highlight
const tabs = [...document.querySelectorAll('.m-nav--tab')];
tabs.forEach((t) => t.addEventListener('click', () => {
  tabs.forEach((o) => o.toggleAttribute('aria-current', o === t));
  if (t === tabs[0]) t.setAttribute('aria-current', 'page');
}));
