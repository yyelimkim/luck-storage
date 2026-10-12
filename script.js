const COUNT = 16;  // one of each design; fills the 4-per-row grid evenly
const SPACING_RATIO = 0.325;  // gap between card left edges, as a fraction of card width
const EDGE = 50;       // breathing room at each end of the pan

// Card artwork in cards/ (slide2.png is not a card)
const IMAGES = [
  '걱정인형.png',
  '꽃잎 점.png',
  '네잎 클로버 찾기.png',
  '돌팝 쌓기.png',
  '돼지꿈.png',
  '드림캐쳐.png',
  '명태 액막이.png',
  '민들레 소원 빌기.png',
  '부처님 배 만지기.png',
  '빨간 옷 입기.png',
  '손바닥의 인 쓰기.png',
  '시험 전 날 떡 먹기.png',
  '악마의 눈.png',
  '촛불 한번에 불기.png',
  '테루테루보즈.png',
  '포도 12알 먹기.png',
];
const IMAGES_VERSION = 3;  // bump when artwork files are replaced

const wrap = document.getElementById('cards');

// DOM order is right-to-left so the leftmost card paints on top
const cards = [];
for (let i = COUNT - 1; i >= 0; i--) {
  const card = document.createElement('div');
  card.className = 'card';
  const img = document.createElement('img');
  img.src = `cards/${encodeURIComponent(IMAGES[i % IMAGES.length])}?v=${IMAGES_VERSION}`;
  img.alt = '';
  img.draggable = false;
  card.appendChild(img);
  wrap.appendChild(card);
  cards.push(card);
}

// Scroller: one line per card, left to right (cards[] runs right to left)
const scroller = document.getElementById('scroller');
const ticks = cards.map((_, j) => {
  const t = document.createElement('button');
  t.type = 'button';
  t.className = 'tick';
  t.setAttribute('aria-label', `Card ${COUNT - j}`);
  return t;
}).reverse();
ticks.forEach((t) => scroller.appendChild(t));
const tickFor = (idx) => ticks[COUNT - 1 - idx];

// Reveal one card: push every card painted above it out to the left,
// show it in color and mark its line. null clears everything.
function select(idx) {
  cards.forEach((c, j) => {
    c.classList.toggle('push', idx !== null && j > idx);
    c.classList.toggle('active', j === idx);
  });
  ticks.forEach((t) => t.removeAttribute('aria-current'));
  if (idx !== null) tickFor(idx).setAttribute('aria-current', 'true');
}

cards.forEach((card, idx) => {
  card.addEventListener('mouseenter', () => select(idx));
});
wrap.addEventListener('mouseleave', () => select(null));

// Pan the strip with the mouse's horizontal position, eased
// Card width comes from CSS (it scales with window height), so lay out from it
let stripW = 0;
let cardW = 0;
let spacing = 0;
function layout() {
  cardW = cards[0].offsetWidth;
  spacing = cardW * SPACING_RATIO;
  cards.forEach((c, j) => { c.style.left = `${(COUNT - 1 - j) * spacing}px`; });
  stripW = (COUNT - 1) * spacing + cardW;
}
layout();
window.addEventListener('resize', layout);

let openCard = null;
let target = EDGE;
let current = EDGE;

const travel = () => Math.max(0, stripW - window.innerWidth + EDGE * 2);

window.addEventListener('mousemove', (e) => {
  if (openCard) return;  // hold the strip still while a card is open
  if (scrubbing || scroller.contains(e.target)) return;  // the scroller drives the pan
  target = EDGE - travel() * (e.clientX / window.innerWidth);
});

// Scrub: the line nearest the pointer picks the card, which is panned to the
// middle of the screen and revealed. Pressing and dragging keeps scrubbing
// even if the pointer wanders off the lines.
let scrubbing = false;

function scrubAt(x) {
  let best = 0;
  let bestD = Infinity;
  ticks.forEach((t, i) => {
    const r = t.getBoundingClientRect();
    const d = Math.abs(x - (r.left + r.width / 2));
    if (d < bestD) { bestD = d; best = i; }
  });
  const pos = best;                  // 0 = leftmost card
  const idx = COUNT - 1 - pos;       // index into cards[]
  const centered = window.innerWidth / 2 - (pos * spacing + cardW / 2);
  target = Math.min(EDGE, Math.max(EDGE - travel(), centered));
  select(idx);
}

scroller.addEventListener('pointermove', (e) => { if (!openCard) scrubAt(e.clientX); });
scroller.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || openCard) return;
  scrubbing = true;
  scroller.setPointerCapture(e.pointerId);
  scrubAt(e.clientX);
});
const endScrub = () => { scrubbing = false; };
scroller.addEventListener('pointerup', endScrub);
scroller.addEventListener('pointercancel', endScrub);

(function tick() {
  current += (target - current) * 0.08;
  wrap.style.transform = `translateX(${current}px)`;
  requestAnimationFrame(tick);
})();

// Click: lift the card out of the strip, fly it to the left half and flip to its back
const viewer = document.getElementById('viewer');
const viewerLeft = document.getElementById('viewer-left');
const closeBtn = document.getElementById('close');
const DURATION = 700;
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
let flip = null;
let busy = false;

function targetRect(w, h) {
  const r = viewerLeft.getBoundingClientRect();
  // Left edge lines up with the "Info" link in the header
  return { left: r.left, top: r.top + (r.height - h) / 2 };
}

// The flip box sits at its final spot and size; the source card's position
// and scale are expressed as a transform, so a smaller grid card grows into
// the standard size on the way.
function offsetTransform(rect, box) {
  return `translate(${rect.left - box.left}px, ${rect.top - box.top}px) scale(${rect.width / box.width})`;
}

function animateFlip(fromT, toT, fromDeg, toDeg) {
  const move = flip.animate(
    [{ transform: fromT }, { transform: toT }],
    { duration: DURATION, easing: EASE, fill: 'forwards' }
  );
  flip.firstElementChild.animate(
    [{ transform: `rotateY(${fromDeg}deg)` }, { transform: `rotateY(${toDeg}deg)` }],
    { duration: DURATION, easing: EASE, fill: 'forwards' }
  );
  return move.finished;
}

let flipBox = null;

async function open(card) {
  if (openCard || busy) return;
  busy = true;
  openCard = card;
  const rect = card.getBoundingClientRect();
  // Always open at the strip's card size
  const w = cards[0].offsetWidth;
  const h = cards[0].offsetHeight;
  flipBox = { ...targetRect(w, h), width: w, height: h };

  flip = document.createElement('div');
  flip.className = 'flip';
  Object.assign(flip.style, {
    left: `${flipBox.left}px`, top: `${flipBox.top}px`,
    width: `${w}px`, height: `${h}px`,
  });
  flip.innerHTML = `
    <div class="flip--inner">
      <div class="flip--face flip--front"><img src="${card.querySelector('img').src}" alt="" draggable="false"></div>
      <div class="flip--face flip--back"><span>Card back</span></div>
    </div>`;
  document.body.appendChild(flip);

  card.style.visibility = 'hidden';
  document.body.classList.add('is-open');
  await animateFlip(offsetTransform(rect, flipBox), 'translate(0, 0) scale(1)', 0, 180);
  busy = false;
}

async function close() {
  if (!openCard || busy) return;
  busy = true;
  const rect = openCard.getBoundingClientRect();
  document.body.classList.remove('is-open');

  flip.getAnimations().forEach((a) => a.cancel());
  flip.firstElementChild.getAnimations().forEach((a) => a.cancel());
  await animateFlip('translate(0, 0) scale(1)', offsetTransform(rect, flipBox), 180, 360);

  openCard.style.visibility = '';
  flip.remove();
  flip = null;
  openCard = null;
  busy = false;
}

// Grid view: the same cards, left to right, all at once
const grid = document.getElementById('grid');
const gridCards = [...cards].reverse().map((card) => {
  const g = document.createElement('div');
  g.className = 'grid-card';
  const img = card.querySelector('img').cloneNode();
  g.appendChild(img);
  g.addEventListener('click', () => open(g));
  grid.appendChild(g);
  return g;
});

function setView(view) {
  if (openCard) return;
  document.body.classList.toggle('is-grid', view === 'grid');
  select(null);
}
document.getElementById('view-grid').addEventListener('click', (e) => { e.preventDefault(); setView('grid'); });
document.getElementById('view-strip').addEventListener('click', (e) => { e.preventDefault(); setView('strip'); });

cards.forEach((card) => card.addEventListener('click', () => open(card)));
closeBtn.addEventListener('click', (e) => { e.preventDefault(); close(); });
viewerLeft.addEventListener('click', (e) => { if (e.target === viewerLeft) close(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
