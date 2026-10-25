// Evil Eye: bad luck drifts round the charm. Tap each bit and it's drawn
// into the eye; with each one a crack runs further across it. The fifth
// cracks it right through, a chip breaks away, and the luck is claimed —
// the eye has taken the bad luck for you.

const COUNT = 5;
const EYE = [126.4, 288.7];  // the eye's middle, in the charm's units
const IN_SHEET = new URLSearchParams(location.search).has('sheet');

const root = document.getElementById('eye');
const charm = document.getElementById('charm');
const wisps = document.getElementById('wisps');
const fill = document.getElementById('fill');
const say = document.getElementById('say');
const cracks = [...document.querySelectorAll('#cracks path')];
// each with a pale edge under it, so it reads on the dark blue too
cracks.forEach((p) => {
  p.setAttribute('pathLength', '1');
  const edge = p.cloneNode();
  edge.classList.add('is-edge');
  p.before(edge);
  p.edge = edge;
});

// The charm as big as fits, the eye a little above the middle of the room
// between the bar and the words
let k = 1;
let eyeAt = [0, 0];
function fit() {
  const top = 60;
  const bottom = innerHeight - 166 - 16;
  k = Math.min(1.15, (innerWidth - 60) / 249, (bottom - top) / 330);
  eyeAt = [innerWidth / 2, top + (bottom - top) * 0.46];
  root.style.setProperty('--k', k);
  root.style.setProperty('--x', `${eyeAt[0] - EYE[0] * k}px`);
  root.style.setProperty('--y', `${eyeAt[1] - EYE[1] * k}px`);
}
addEventListener('resize', fit);
fit();

// A puff of bad luck: a little dark cloud with two narrowed eyes
const PUFF = `<svg viewBox="0 0 52 52" aria-hidden="true">
  <path d="M14 40C7 40 3 35 4.5 29.5C5.5 25.5 9 23.5 12 23.8C12 15 18.5 9.5 26 10C32.5 10.4 37 15 37.6 20.5C42.5 20 47.8 24 47.5 30.2C47.2 35.8 43 40 37 40Z"/>
  <path class="wisp--eye" d="M17.5 27.5L22.5 29.2L18 30.6Z"/>
  <path class="wisp--eye" d="M34.5 27.5L29.5 29.2L34 30.6Z"/>
</svg>`;

// Where they drift: round the eye, clear of it, inside the room
function spots() {
  const r = 108 * k + 44;
  const out = [];
  for (let i = 0; i < COUNT; i++) {
    const a = -Math.PI / 2 + (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const d = r + Math.random() * 22;
    out.push([
      Math.max(36, Math.min(innerWidth - 36, eyeAt[0] + Math.cos(a) * d * 1.05)),
      Math.max(76, Math.min(innerHeight - 200, eyeAt[1] + Math.sin(a) * d * 0.95)),
    ]);
  }
  return out;
}
function setOut() {
  wisps.innerHTML = '';
  spots().forEach(([x, y], i) => {
    const w = document.createElement('button');
    w.type = 'button';
    w.className = 'wisp';
    w.dataset.silent = '';  // it makes its own sound
    w.setAttribute('aria-label', `Bad luck ${i + 1}`);
    w.style.left = `${x}px`;
    w.style.top = `${y}px`;
    w.style.setProperty('--dx', `${(Math.random() - 0.5) * 30}px`);
    w.style.setProperty('--dy', `${6 + Math.random() * 12}px`);
    w.style.setProperty('--t', `${4 + Math.random() * 3}s`);
    w.style.animationDelay = `${-Math.random() * 6}s`;
    w.innerHTML = PUFF;
    w.addEventListener('click', () => take(w));
    wisps.appendChild(w);
  });
}
setOut();

let taken = 0;
// the hand shows a tap on a bit of bad luck till the first is taken
let unpoint = pointAt(wisps.querySelector('.wisp'));
function show(text) {
  say.textContent = text;
  say.classList.remove('is-new');
  void say.offsetWidth;
  say.classList.add('is-new');
}
function pulse(cls, ms) {
  root.classList.remove(cls);
  void root.offsetWidth;
  root.classList.add(cls);
  setTimeout(() => root.classList.remove(cls), ms);
}

// Drawn into the eye: it curls in, shrinking, and the eye takes it
function take(w) {
  if (root.dataset.step === 'done' || w.classList.contains('is-taken')) return;
  Sounds.unlock();
  unpoint();
  w.style.translate = getComputedStyle(w).translate;  // held where it was drifting
  w.classList.add('is-taken');
  const b = w.getBoundingClientRect();
  const dx = eyeAt[0] - (b.left + b.width / 2);
  const dy = eyeAt[1] - (b.top + b.height / 2);
  Sounds.absorb();
  w.animate([
    { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
    { transform: `translate(${dx * 0.5 + dy * 0.25}px, ${dy * 0.5 - dx * 0.25}px) scale(0.75) rotate(120deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.1) rotate(300deg)`, opacity: 0.2 },
  ], { duration: 520, easing: 'cubic-bezier(0.5, 0, 0.6, 1)', fill: 'forwards' })
    .finished.then(() => {
      w.remove();
      taken++;
      fill.style.width = `${(taken / COUNT) * 100}%`;
      document.getElementById('progress').setAttribute('aria-valuenow', String(taken));
      cracks[taken - 1].classList.add('is-run');
      cracks[taken - 1].edge.classList.add('is-run');
      if (taken < COUNT) {
        pulse('is-gulp', 350);
        Sounds.crack();
        show(`${COUNT - taken} more`);
        return;
      }
      // the last: it cracks right through, a chip breaks off
      root.dataset.step = 'done';
      pulse('is-shake', 450);
      Sounds.crack(true);
      show('It cracked, taking the bad luck with it');
      setTimeout(() => Sounds.shimmer(), 500);
      if (IN_SHEET) setTimeout(() => parent.postMessage('luck-claimed', '*'), 1500);
    });
}

// The sheet's Continue starts over with a whole eye
addEventListener('message', (e) => {
  if (e.data !== 'luck-continue') return;
  taken = 0;
  root.dataset.step = 'ready';
  fill.style.width = '0';
  cracks.forEach((p) => { p.classList.remove('is-run'); p.edge.classList.remove('is-run'); });
  show('Tap the bad luck into the eye');
  setOut();
});
