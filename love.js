// Love me, love me not: say who you're thinking of, then pluck the petals one
// at a time — loves me, loves me not, loves me... There are seven, an odd
// number, so the last is always "loves me", and the luck is claimed. Before
// the first pluck the pointing hand shows where to tap.

const PETALS = 7;  // odd: it always ends on love
const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const NS = 'http://www.w3.org/2000/svg';

const root = document.getElementById('love');
const flower = document.getElementById('flower');
const petalsEl = document.getElementById('petals');
const say = document.getElementById('say');
const form = document.getElementById('ask-form');
const input = document.getElementById('name');
const send = document.getElementById('send');

// The flower as big as fits above the words
function fit() {
  const room = innerHeight - 166;
  root.style.setProperty('--f', Math.min(1, (innerWidth - 40) / 300, (room * 0.88) / 300).toFixed(3));
}
addEventListener('resize', fit);
fit();

// The petals round the middle, each an oval on its dark underside (the
// card's flower's way), turned out from the middle
const petals = [];
for (let i = 0; i < PETALS; i++) {
  const a = -90 + (i * 360) / PETALS;
  const r = (a * Math.PI) / 180;
  const cx = Math.cos(r) * 74;
  const cy = Math.sin(r) * 74;
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'love--petal');
  g.setAttribute('tabindex', '0');
  g.setAttribute('role', 'button');
  g.setAttribute('aria-label', `Petal ${i + 1}`);
  g.dataset.silent = '';
  g.innerHTML = `<ellipse class="under" cx="${cx + 3}" cy="${cy + 6}" rx="64" ry="48" transform="rotate(${a} ${cx + 3} ${cy + 6})"/>`
    + `<ellipse class="top" cx="${cx}" cy="${cy}" rx="64" ry="48" transform="rotate(${a} ${cx} ${cy})"/>`;
  g.dataset.a = String(a);
  g.addEventListener('click', () => pluck(g));
  g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pluck(g); } });
  petalsEl.appendChild(g);
  petals.push(g);
}

let name = '';
let plucked = 0;
function show(text) {
  say.textContent = text;
  say.classList.remove('is-new');
  void say.offsetWidth;
  say.classList.add('is-new');
}

// 1: who are you thinking of?
input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
form.addEventListener('submit', (e) => {
  e.preventDefault();
  name = input.value.trim();
  if (!name) return;
  Sounds.unlock();
  input.blur();
  root.dataset.step = 'pluck';
  show('Tap a petal to pluck it');
  pointAt_(petals[1]);
});

// The hand (pointer.js) shows a tap on a petal till the first pluck
let unpoint = () => {};
function pointAt_(g) { unpoint = pointAt(g.querySelector('.top')); }

// 2: pluck — it comes away, turning, and drifts down; loves me, loves me not
function pluck(g) {
  if (root.dataset.step !== 'pluck' || g.classList.contains('is-plucked')) return;
  Sounds.unlock();
  unpoint();
  g.classList.add('is-plucked');
  plucked++;
  const a = (Number(g.dataset.a) * Math.PI) / 180;
  const out = 60 + Math.random() * 30;
  const spin = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 160);
  g.animate([
    { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
    { transform: `translate(${Math.cos(a) * out}px, ${Math.sin(a) * out - 10}px) rotate(${spin * 0.3}deg)`, opacity: 1, offset: 0.3 },
    { transform: `translate(${Math.cos(a) * out * 1.3 + (Math.random() - 0.5) * 60}px, ${420}px) rotate(${spin}deg)`, opacity: 0 },
  ], { duration: 1500, easing: 'cubic-bezier(0.4, 0, 0.7, 1)', fill: 'forwards' });
  g.style.transformOrigin = 'center';
  Sounds.swoosh(0.45);
  const loves = plucked % 2 === 1;
  if (plucked < PETALS) {
    show(loves ? `${name} loves me` : `${name} loves me not`);
    return;
  }
  // the last: it loves you
  root.dataset.step = 'done';
  show(`${name} loves me!`);
  setTimeout(() => Sounds.shimmer(), 400);
  if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 1500);
}

// The sheet's Continue: a whole flower again
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  plucked = 0;
  petals.forEach((g) => { g.classList.remove('is-plucked'); g.getAnimations().forEach((x) => x.cancel()); });
  input.value = '';
  send.disabled = true;
  root.dataset.step = 'ask';
  show('Who are you thinking of?');
});
