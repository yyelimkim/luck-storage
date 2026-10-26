// Love me, love me not: say who you're thinking of, then pluck the petals one
// at a time — loves me, loves me not, loves me... There are seven, an odd
// number, so the last is always "loves me", and the luck is claimed. Before
// the first pluck the pointing hand shows where to tap.

const PETALS = 5;  // the card's four and one set back: odd, so it always ends on love
const IN_SHEET = new URLSearchParams(location.search).has('sheet');
const NS = 'http://www.w3.org/2000/svg';

const root = document.getElementById('love');
const flower = document.getElementById('flower');
const petalsEl = flower.querySelector('svg');
const say = document.getElementById('say');
const form = document.getElementById('ask-form');
const input = document.getElementById('name');
const send = document.getElementById('send');

// The flower as big as fits above the words
function fit() {
  const room = innerHeight - 120;
  root.style.setProperty('--f', Math.min(1, (innerWidth - 40) / 300, (room * 0.88) / 300).toFixed(3));
}
addEventListener('resize', fit);
fit();

// The petals, the card's flower's own (love.html): each plucked by a tap
const petals = [...petalsEl.querySelectorAll('.love--petal')];
petals.forEach((g) => {
  g.addEventListener('click', () => pluck(g));
  g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pluck(g); } });
});

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
  pointAt_(petals[4]);  // the front one
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
  const b = g.getBBox();
  const a = Math.atan2(b.y + b.height / 2 - 99, b.x + b.width / 2 - 186);
  const out = 60 + Math.random() * 30;
  const spin = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 160);
  g.animate([
    { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
    { transform: `translate(${Math.cos(a) * out}px, ${Math.sin(a) * out - 10}px) rotate(${spin * 0.3}deg)`, opacity: 1, offset: 0.3 },
    { transform: `translate(${Math.cos(a) * out * 1.3 + (Math.random() - 0.5) * 60}px, ${420}px) rotate(${spin}deg)`, opacity: 0 },
  ], { duration: 1500, easing: 'cubic-bezier(0.4, 0, 0.7, 1)', fill: 'forwards' });
  g.style.transformOrigin = 'center';
  Sounds.pluck();
  const head = flower.querySelector('svg');
  head.classList.remove('is-shake');
  void head.getBBox();
  head.classList.add('is-shake');
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
  setTimeout(() => input.focus({ preventScroll: true }), 500);
});
setTimeout(() => { if (root.dataset.step === 'ask') input.focus({ preventScroll: true }); }, 600);
