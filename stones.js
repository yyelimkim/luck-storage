// Stacking Stones (Figma 430:8694, 430:8705), after the sketch:
// 1. the tower waits as dashed outlines; tap where a stone should land and
// it drops from the top into place — bottom first, as a real tower must be
// built — 2. the pink orb settles on top, and the luck is claimed.

// The tower in its 406 x 475 box: [name, x, y, w, h, fill, path (viewBox w x h)]
const BASE = [2.8, 375, 388, 101, 'M30.103 94.8305L4.20467 64.3023C0.0704741 59.429 -0.39975 52.4285 3.04558 47.0461L20.2116 20.2289C28.9291 6.61016 44.6531 -0.840795 60.7136 1.03667L313.653 30.6052C317.389 31.0418 321.049 31.9752 324.537 33.3804L377.366 54.6608C388.277 59.056 389.733 73.91 379.883 80.3399L353.439 97.6017C351.074 99.1456 348.311 99.9678 345.486 99.9678H41.198C36.9247 99.9678 32.8675 98.0892 30.103 94.8305Z'];
const STONES = [
  { id: 'base', x: 65.4, y: 322.7, w: 282, h: 86, fill: 'var(--stone-pink)', on: [],
    d: 'M280.653 70.6094V44.5726C280.653 41.7349 279.823 38.9592 278.266 36.5872L274.217 30.4211C266.84 19.1849 254.557 12.1282 241.135 11.4137L41.9023 0.809613C32.8916 0.330018 23.9639 2.747 16.4258 7.70686L7.30396 13.7088C0.61319 18.1111 -1.26141 27.093 3.10983 33.8041L24.0046 65.8832C26.5352 69.7683 30.766 72.2147 35.3956 72.4698L265.303 85.1368C273.64 85.5962 280.653 78.9594 280.653 70.6094Z' },
  { id: 'round', x: 77.9, y: 221.7, w: 142, h: 106, fill: 'var(--system-black)', on: ['base'],
    d: 'M108.221 87.3167L112.219 84.0648C114.799 81.9668 117.069 79.5152 118.963 76.7826L135.916 52.3263C145.338 38.735 140.835 19.9703 126.273 12.1337L112.959 4.96958C104.09 0.196962 93.6061 -0.564073 84.1408 2.87768L36.4833 20.2068C27.6817 23.4072 20.5107 29.9709 16.546 38.4557L3.28468 66.8357C-2.36386 78.924 1.6933 93.3259 12.8213 100.688C18.5107 104.452 25.4168 105.916 32.1441 104.784L91.7881 94.749C97.8164 93.7348 103.478 91.1739 108.221 87.3167Z' },
  { id: 'lean', x: 204.3, y: 211.4, w: 124, h: 136, fill: 'var(--system-white)', on: ['base'],
    d: 'M109.534 135.06L100.841 134.533C100.14 134.49 99.4437 134.389 98.7598 134.229L82.869 130.519C80.4687 129.959 78.2882 128.7 76.6031 126.901L31.1696 78.4012C29.1794 76.2766 27.9951 73.5227 27.822 70.6166L27.2622 61.2168C27.1145 58.7361 26.229 56.3561 24.7193 54.3822L3.31507 26.395C0.773712 23.072 0.0677374 18.6962 1.43513 14.7426L4.49921 5.88339C6.00163 1.53942 10.9787 -0.496064 15.0945 1.55017L35.2357 11.5635C36.8441 12.3632 38.2608 13.5008 39.3888 14.8986L119.993 114.78C126.799 123.213 120.351 135.715 109.534 135.06Z' },
  { id: 'slab', x: 76.6, y: 142.9, w: 208, h: 90, fill: 'var(--stone-pink)', on: ['round', 'lean'],
    d: 'M25.773 76.1007L3.68482 38.6079C0.435994 33.0933 -0.148118 26.4062 2.0954 20.4119C4.94025 12.8108 11.8742 7.50035 19.9539 6.73459L80.6855 0.978748C85.0313 0.566868 89.412 0.711707 93.7212 1.40975L134.32 7.98638L193.218 12.1037C197.911 12.4318 202.18 14.9394 204.753 18.8791C208.868 25.1829 207.684 33.5592 201.982 38.4751L179.35 57.9879C176.025 60.8549 172.036 62.8447 167.745 63.7763L54.0433 88.4651C42.939 90.8763 31.5408 85.8911 25.773 76.1007Z' },
  { id: 'cap', x: 129.8, y: 82.4, w: 118, h: 71, fill: 'var(--system-black)', on: ['slab'],
    d: 'M40.1169 62.4381L26.5384 58.8C14.8384 55.6652 5.55953 46.7559 1.95207 35.1929L1.37908 33.3563C-0.0800685 28.6793 1.03904 23.5794 4.32245 19.9431L11.128 12.406C20.529 1.9946 35.1985 -1.86978 48.5088 2.55883L70.6439 9.92366C74.7243 11.2813 78.5227 13.3724 81.8522 16.0942L110.031 39.1295C116.448 44.3758 118.197 53.4608 114.184 60.7141C110.796 66.8381 104.028 70.2901 97.0819 69.4367L40.1169 62.4381Z' },
];
const BOX_W = 406;
const BOX_H = 475;
const IN_SHEET = new URLSearchParams(location.search).has('sheet');

const root = document.getElementById('stones');
const tower = document.getElementById('tower');
const hint = document.getElementById('hint');
const orb = document.getElementById('orb');

const pct = (v, of) => `${(v / of) * 100}%`;
const svg = (w, h, d, cls) => `<svg class="${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" vector-effect="non-scaling-stroke"/></svg>`;
const place = (el, x, y, w, h) => Object.assign(el.style, { left: pct(x, BOX_W), top: pct(y, BOX_H), width: pct(w, BOX_W), height: pct(h, BOX_H) });

// The ground stone, always there
const ground = document.createElement('div');
ground.className = 'stones--ground';
place(ground, BASE[0], BASE[1], BASE[2], BASE[3]);
ground.innerHTML = svg(BASE[2], BASE[3], BASE[4], 'stone--fill');
tower.appendChild(ground);

// Each stone: its dashed outline in the tower — tapped, the stone drops
// into it — and the stone itself, hidden until it drops
const placed = new Set();
STONES.forEach((s) => {
  const slot = document.createElement('div');
  slot.className = 'stones--slot';
  place(slot, s.x, s.y, s.w, s.h);
  slot.innerHTML = svg(s.w, s.h, s.d, 'stone--dash');
  slot.setAttribute('role', 'button');
  slot.dataset.silent = '';  // it thuds as its stone lands instead
  slot.setAttribute('aria-label', 'Drop a stone here');
  slot.tabIndex = 0;
  // only the outline's own shape takes the tap, as they overlap
  slot.querySelector('path').addEventListener('click', () => drop(s));
  slot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drop(s); } });
  tower.appendChild(slot);
  s.slot = slot;

  const stone = document.createElement('div');
  stone.className = 'stones--stone';
  stone.dataset.id = s.id;
  stone.style.setProperty('--fill', s.fill);
  place(stone, s.x, s.y, s.w, s.h);
  stone.innerHTML = svg(s.w, s.h, s.d, 'stone--fill');
  tower.appendChild(stone);
  s.el = stone;
});

// The tower as big as fits: never wider than the screen, nor taller than
// what the words under it leave
const under = () => document.querySelector(root.dataset.step === 'stack' ? '.stones--stack' : '.stones--ask');
function fit() {
  const room = innerHeight - 120 - 24 - 40;  // the words' spot below
  const w = Math.min(300, innerWidth - 24, room * BOX_W / BOX_H);
  root.style.setProperty('--w', `${Math.max(120, w)}px`);
}
addEventListener('resize', fit);
function step(name) { root.dataset.step = name; fit(); }
fit();

// 1: tap where a stone goes and it drops from the top into place. A stone
// can only land where what it rests on is already there.
let unpoint = () => {};
function drop(s) {
  if (root.dataset.step !== 'stack' || placed.has(s.id)) return;
  unpoint();
  if (!s.on.every((id) => placed.has(id))) {
    s.slot.classList.remove('is-wobble');
    void s.slot.offsetWidth;
    s.slot.classList.add('is-wobble');
    hint.textContent = 'Nothing to rest on yet — start from the bottom';
    return;
  }
  placed.add(s.id);
  s.slot.classList.add('is-filled');
  Sounds.unlock();
  setTimeout(() => Sounds.stone(), 470);  // as it lands
  // From above the screen down to its place, a little bounce as it lands
  const fall = s.el.getBoundingClientRect().bottom + 40;
  s.el.classList.add('is-placed');
  s.el.animate([
    { transform: `translateY(${-fall}px) rotate(${(Math.random() - 0.5) * 30}deg)`, opacity: 1 },
    { transform: 'translateY(0) rotate(0)', offset: 0.72 },
    { transform: 'translateY(-6px) rotate(0)', offset: 0.86 },
    { transform: 'translateY(0) rotate(0)' },
  ], { duration: 650, easing: 'cubic-bezier(0.55, 0, 0.6, 1)' }).finished.then(() => {
    tower.classList.remove('is-thud');
    void tower.offsetWidth;
    tower.classList.add('is-thud');
  });
  const left = STONES.length - placed.size;
  hint.textContent = left ? `${left} more to go` : 'Balanced!';
  if (!left) setTimeout(finish, 800);
}

// 2: the orb settles on top
function finish() {
  step('done');
  orb.animate([
    { transform: 'translateY(-420px) scale(0.6)', opacity: 0 },
    { transform: 'translateY(8px) scale(1.04)', opacity: 1, offset: 0.75 },
    { transform: 'none', opacity: 1 },
  ], { duration: 900, easing: 'cubic-bezier(0.3, 0.8, 0.4, 1)', fill: 'both' }).finished.then(() => {
    orb.getAnimations().forEach((a) => a.cancel());
    orb.classList.add('is-floating');
  });
  setTimeout(() => Sounds.shimmer(), 500);  // as it settles on top
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 2600);
}

// The sheet's Continue takes the tower down to build again
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  placed.clear();
  STONES.forEach((s) => { s.el.classList.remove('is-placed'); s.slot.classList.remove('is-filled'); });
  hint.textContent = '5 stones to go';
  begin();
});

// Straight to building: the hand shows a tap on an outline (one resting
// on the ground) till the first stone
function begin() {
  step('stack');
  setTimeout(() => { if (!placed.size) unpoint = pointAt(STONES.find((s) => s.on.length === 0).slot); }, 900);
}
begin();
