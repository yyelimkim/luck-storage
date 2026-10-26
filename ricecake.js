// Rice cakes before an exam (Figma 234:1751): the mat, the plate with its
// four rice cakes, the box with four more, and the fork, each layer where
// Figma has it (in the drawing's 670 x 604). Tap a rice cake to eat it; the
// bar fills a step with each, and once all eight are gone its 100 shakes
// and the luck is claimed.

const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const root = document.getElementById('rc');
const art = document.getElementById('art');
const progress = document.getElementById('progress');
const fill = document.getElementById('fill');
const DIR = 'assets/ricecake/';

// A layer: its box in the drawing, and inside it (centred, turned `rot`)
// either one of Figma's drawings at its own size or a rounded rectangle
function part(p) {
  const [x, y, w, h] = p.box;
  const el = document.createElement('div');
  el.className = 'part';
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  const inner = document.createElement(p.src ? 'img' : 'div');
  if (p.src) { inner.src = DIR + p.src + '.svg?v=1'; inner.alt = ''; inner.draggable = false; }
  const [iw, ih] = p.inner || [w, h];
  Object.assign(inner.style, { width: `${iw}px`, height: `${ih}px` });
  if (p.rot) inner.style.rotate = `${p.rot}deg`;
  if (p.rect) {
    const [r, fillC, line] = p.rect;
    inner.className = 'part--rect';
    Object.assign(inner.style, {
      borderRadius: `${r}px`,
      background: fillC || 'none',
      border: line ? `1.5px solid ${line}` : '0',
    });
  }
  el.appendChild(inner);
  return el;
}

const B = 'var(--system-black)';
const Wh = 'var(--system-white)';
const PLATE_ROT = 24.17;
const BOX_ROT = 50.3;
const CAKE_INNER = [175.162, 134.163];
const CAKE_BOX = [214.738, 194.12];

// Under the cakes: the mat, and the plate
const UNDER = [
  { box: [0.16, 125.71, 499.571, 445.133], inner: [437.451, 368.683], rot: -10.96, rect: [9.645, B] },
  { box: [0, 122, 499.571, 445.133], inner: [437.451, 368.683], rot: -10.96, rect: [9.645, Wh, B] },
  { box: [0, 122, 499.571, 445.133], src: 'mat-pattern' },
  { box: [0, 122, 499.571, 445.133], inner: [437.451, 368.683], rot: -10.96, rect: [9.645, null, B] },
  { box: [162, 220.94, 506.01, 382.54], inner: [455.524, 221.812], rot: 23.06, rect: [83.092, B, B] },
  { box: [164.13, 215, 506.01, 382.54], inner: [455.524, 221.812], rot: 23.06, rect: [83.092, Wh, B] },
  { box: [185.46, 237.26, 463.149, 337.549], inner: [424.055, 186.312], rot: 23.06, rect: [63.803, B, B] },
  { box: [185.46, 242.68, 460.842, 332.131], inner: [424.055, 180.423], rot: 23.06, rect: [63.803, Wh, B] },
];
// The four on the plate, each with its shadow and its flower; the
// fourth's drawing is wider, as Figma groups it
const PLATE = [
  { mid: [313.2, 359.1], parts: [
    { box: [206.54, 264.25, ...CAKE_BOX], inner: CAKE_INNER, rot: PLATE_ROT, src: 'shadow-1' },
    { box: [205.8, 262.03, ...CAKE_BOX], inner: CAKE_INNER, rot: PLATE_ROT, src: 'cake-1' },
    { box: [242.59, 278.54, 386.436, 271.174], inner: [363.356, 134.164], rot: PLATE_ROT, src: 'flower-1' }] },
  { mid: [380.0, 389.1], parts: [
    { box: [273.4, 294.26, ...CAKE_BOX], inner: CAKE_INNER, rot: PLATE_ROT, src: 'shadow-2' },
    { box: [272.66, 292.03, ...CAKE_BOX], inner: CAKE_INNER, rot: PLATE_ROT, src: 'cake-2' },
    { box: [242.59, 278.54, 386.436, 271.174], inner: [363.356, 134.164], rot: PLATE_ROT, src: 'flower-2' }] },
  { mid: [450.8, 420.9], parts: [
    { box: [344.21, 326.04, ...CAKE_BOX], inner: CAKE_INNER, rot: PLATE_ROT, src: 'shadow-3' },
    { box: [343.47, 323.81, ...CAKE_BOX], inner: CAKE_INNER, rot: PLATE_ROT, src: 'cake-3' },
    { box: [242.59, 278.54, 386.436, 271.174], inner: [363.356, 134.164], rot: PLATE_ROT, src: 'flower-3' }] },
  { mid: [521.7, 452.7], parts: [
    { box: [415.03, 357.82, ...CAKE_BOX], inner: CAKE_INNER, rot: PLATE_ROT, src: 'shadow-4' },
    { box: [242.59, 278.54, 386.436, 271.174], inner: [363.356, 134.164], rot: PLATE_ROT, src: 'cake-4' },
    { box: [242.59, 278.54, 386.436, 271.174], inner: [363.356, 134.164], rot: PLATE_ROT, src: 'flower-4' }] },
].map((c) => ({ ...c, oval: [150, 92, PLATE_ROT] }));
// The box, over the plate's corner
const BOX = [
  { box: [162, 2.23, 378.663, 286.098], inner: [340.978, 165.766], rot: 23.06, rect: [25.224, B] },
  { box: [162, 0, 378.663, 286.098], inner: [340.978, 165.766], rot: 23.06, rect: [25.224, B] },
  { box: [169.98, 8.16, 362.043, 269.384], inner: [328.362, 152.971], rot: 23.06, rect: [20.031, null, Wh] },
];
// The four in the box: pink, white, green, and the white one at the end
const boxCake = (x, y, color) => ({ box: [x, y, 137.428, 129.562], inner: [64.692, 124.909], rot: BOX_ROT, rect: [27.667, color, B] });
const IN_BOX = [
  { mid: [265.2, 98.9], parts: [boxCake(196.52, 34.13, 'var(--light-pink)')] },
  { mid: [328.3, 133.8], parts: [boxCake(259.58, 69, Wh)] },
  { mid: [397.3, 164.2], parts: [boxCake(328.58, 99.41, 'var(--forest-green)')] },
  { mid: [440.9, 186.1], parts: [
    { box: [382, 133.54, 117.787, 105.063], inner: [61.437, 100.497], rot: 121.68, src: 'box-cake-4' },
    { box: [398, 195, 7.048, 10.387], src: 'box-mark' }] },
].map((c) => ({ ...c, oval: [62, 122, BOX_ROT] }));
const FORK = { box: [124, 256, 80.491, 196.622], src: 'fork' };

// Each rice cake in a layer of its own the drawing's size, turned and
// shrunk about its own middle as it's eaten, with an oval on it for taps
const cakes = [];
function cakeLayer(c, i) {
  const layer = document.createElement('div');
  layer.className = 'part rc--cake';
  Object.assign(layer.style, { left: 0, top: 0, width: '670px', height: '604px', transformOrigin: `${c.mid[0]}px ${c.mid[1]}px` });
  c.parts.forEach((p) => layer.appendChild(part(p)));
  const [ow, oh, rot] = c.oval;
  const bite = document.createElement('button');
  bite.type = 'button';
  bite.className = 'rc--bite';
  bite.setAttribute('aria-label', `Rice cake ${i + 1}`);
  Object.assign(bite.style, {
    left: `${c.mid[0] - ow / 2}px`, top: `${c.mid[1] - oh / 2}px`, width: `${ow}px`, height: `${oh}px`,
    rotate: `${rot}deg`, pointerEvents: 'auto', border: 0, padding: 0, background: 'none',
  });
  bite.addEventListener('click', () => eat(layer));
  layer.appendChild(bite);
  cakes.push(layer);
  return layer;
}

function build() {
  cakes.length = 0;
  art.replaceChildren(
    ...UNDER.map(part),
    ...PLATE.map(cakeLayer),
    ...BOX.map(part),
    ...IN_BOX.map((c, i) => cakeLayer(c, i + 4)),
    part(FORK),
  );
}

// As big as fits between the bar and the words: the fork and all eight
// whole (124–606 across), the mat and plate free to run off the sides
function fit() {
  const room = innerHeight - 56 - 120;
  root.style.setProperty('--k', Math.min(1, (innerWidth - 24) / 482, room / 560).toFixed(3));
}
addEventListener('resize', fit);

// --- Eating ---------------------------------------------------------------
let eaten = 0;
let unpoint = () => {};
function show() {
  fill.style.width = `${(eaten / 8) * 100}%`;
  progress.setAttribute('aria-valuenow', String(eaten));
  progress.classList.toggle('is-full', eaten >= 8);
}
function eat(layer) {
  if (layer.classList.contains('is-eaten') || root.dataset.step !== 'eat') return;
  Sounds.unlock();
  unpoint();
  Sounds.eat();
  layer.classList.add('is-eaten');
  layer.querySelector('.rc--bite').disabled = true;
  eaten++;
  show();
  if (eaten === 8) {
    root.dataset.step = 'done';
    setTimeout(celebrate, 450);
    if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 2400);  // once the 100 has had its moment
  }
}

// All eight: the 100 flashes up big in the middle, Hot Pink in the
// system's black line, to a fanfare
const hundredSvg = fetch('assets/ricecake/hundred.svg?v=1').then((r) => r.text());
function celebrate() {
  hundredSvg.then((txt) => {
    const big = document.createElement('div');
    big.className = 'rc--hundred';
    big.setAttribute('aria-hidden', 'true');
    big.innerHTML = txt;
    root.appendChild(big);
    Sounds.fanfare();
    big.addEventListener('animationend', () => big.remove());
  });
}

function start() {
  eaten = 0;
  root.dataset.step = 'eat';
  root.querySelector('.rc--hundred')?.remove();
  build();
  show();
  fit();
  // the hand shows a tap on the first one, till you eat one
  setTimeout(() => { if (!eaten) unpoint = pointAt(cakes[0].querySelector('.rc--bite')); }, 900);
}
// The sheet's Continue: a full plate and box again
addEventListener('message', (e) => { if (e.data === 'luck-continue') start(); });
start();
