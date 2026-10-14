// Layers of Figma node 271:1240, positions relative to the "illust" frame.
// box = axis-aligned bounds, inner = the vector's own size, rot = its rotation,
// inset = how far the SVG's stroke spills past the vector (CSS inset)
const PARTS = [
  // the string, pulled straight (hidden layer 271:1241). Stays with the charm, not the fish.
  { src: 'string-straight', box: [180.526, -67.313, 46.193, 260.124], inner: [39.235, 259.162], rot: -1.54, inset: '-0.29% -1.91%', fish: false },
  { src: 'body', box: [38.468, 168.062, 314.858, 154.324], inner: [308.999, 140.972], rot: 2.5, inset: '-0.53% -0.24%' },
  { src: 'eye', box: [68.389, 233.535, 16.332, 16.332], inner: [15.664, 15.664], rot: 2.5, inset: '0' },
  { src: 'scale', box: [104.576, 220.863, 12.971, 46.713], inner: [10.961, 46.279], rot: 2.5, inset: '-1.62% -6.84%' },
  { src: 'scale', box: [266.753, 227.948, 12.971, 46.713], inner: [10.961, 46.279], rot: 2.5, inset: '-1.62% -6.84%' },
  { src: 'scales1', box: [143.670, 206.892, 11.892, 77.194], inner: [8.544, 76.894], rot: 2.5, inset: '-0.98% -8.78%' },
  { src: 'scales2', box: [168.656, 222.237, 10.773, 51.587], inner: [8.544, 51.263], rot: 2.5, inset: '-1.46% -8.78%' },
  { src: 'string-body', box: [178.817, 180.122, 49.385, 142.526], inner: [43.282, 140.771], rot: 2.5, inset: '-0.53% -1.73% -0.53% -1.74%' },
  { src: 'knot-bottom', box: [165.978, 297.222, 52.687, 37.023], inner: [52.687, 37.023], rot: 0, inset: '-2.03% -1.42%' },
  // Figma tilts it 20.89° for the curved loop; level and centred on the straight string here
  // It rides on the end of the string, not the fish (fish: 'over' = above the fish, with the string)
  { src: 'knot-top', box: [185.446, 161.614, 48.508, 44.172], inner: [48.508, 44.172], rot: 0, inset: '0', fish: 'over' },
];

const charm = document.getElementById('charm');
const fish = document.getElementById('fish');
const layer = {};

PARTS.forEach((p) => {
  const [left, top, w, h] = p.box;
  const part = document.createElement('div');
  part.className = 'part';
  layer[p.src] = part;
  Object.assign(part.style, { left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px` });

  const inner = document.createElement('div');
  inner.className = 'part--inner';
  const t = [p.rot ? `rotate(${p.rot}deg)` : '', p.flipY ? 'scaleY(-1)' : ''].join(' ').trim();
  Object.assign(inner.style, { width: `${p.inner[0]}px`, height: `${p.inner[1]}px`, transform: t || 'none' });

  // Box grown by the stroke spill; the SVG fills it
  const spill = document.createElement('div');
  spill.className = 'part--spill';
  spill.style.inset = p.inset;

  const img = document.createElement('img');
  img.src = `assets/charm/${p.src}.svg`;
  img.alt = '';
  img.draggable = false;

  spill.appendChild(img);
  inner.appendChild(spill);
  part.appendChild(inner);
  if (p.fish === false) charm.insertBefore(part, fish);
  else if (p.fish === 'over') charm.appendChild(part);
  else fish.appendChild(part);
});

// --- Puppet warp ---------------------------------------------------------
// The string SVG is inlined and its path bent every frame. Two pins: the top
// stays put (it's held), the bottom rides on the fish. Between them the
// string squashes along its length and bows sideways when slack.
const STRING_TOP = 0.75;   // y of the string's ends in its own SVG
const STRING_BOTTOM = 259.9;
const STRING_LEN = STRING_BOTTOM - STRING_TOP;

let stringPath = null;
let stringRest = '';  // the Figma path, untouched
let stringSegs = null;

// Absolute M/L/C/V/H/Z path → segments of points (V and H become L)
function parsePath(d) {
  const tokens = d.match(/[MLCVHZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
  const segs = [];
  let cmd = null;
  let cur = [0, 0];
  for (let i = 0; i < tokens.length;) {
    if (/[A-Z]/i.test(tokens[i])) cmd = tokens[i++].toUpperCase();
    const num = () => parseFloat(tokens[i++]);
    if (cmd === 'Z') { segs.push({ cmd: 'Z', pts: [] }); continue; }
    const from = cur;
    if (cmd === 'M' || cmd === 'L') cur = [num(), num()];
    else if (cmd === 'H') cur = [num(), cur[1]];
    else if (cmd === 'V') cur = [cur[0], num()];
    if (cmd === 'C') {
      const pts = [[num(), num()], [num(), num()], [num(), num()]];
      cur = pts[2];
      segs.push({ cmd: 'C', pts });
    } else if (cmd === 'M') {
      segs.push({ cmd: 'M', pts: [cur.slice()] });
      cmd = 'L';  // extra pairs after M are lines
    } else {
      // A straight line can't bend, so long ones are cut into short pieces
      const n = Math.max(1, Math.ceil(Math.hypot(cur[0] - from[0], cur[1] - from[1]) / 6));
      for (let k = 1; k <= n; k++) {
        segs.push({ cmd: 'L', pts: [[from[0] + (cur[0] - from[0]) * k / n, from[1] + (cur[1] - from[1]) * k / n]] });
      }
    }
  }
  return segs;
}

const STRING_CX = 20.7;    // the string's centre line in its own SVG
const SPINE_N = 48;
const KNOT = [23.5, 251.8];  // centre of the top knot in the string's SVG

// Spine from the top pin (0,0) to the bottom pin (0,gap): a half-sine bow
// plus an S-wave, sampled as points with running arc length
function spine(gap, bow, wave) {
  const pts = [];
  let len = 0;
  for (let i = 0; i <= SPINE_N; i++) {
    const u = i / SPINE_N;
    const p = [bow * Math.sin(Math.PI * u) + wave * Math.sin(2 * Math.PI * u), gap * u];
    if (i) len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    p.push(len);
    pts.push(p);
  }
  return pts;
}

// Bow that makes a spine of this gap exactly the string's length (slack string)
function bowFor(gap) {
  if (gap >= STRING_LEN) return 0;
  let lo = 0;
  let hi = STRING_LEN;
  for (let k = 0; k < 18; k++) {
    const mid = (lo + hi) / 2;
    if (spine(gap, mid, 0)[SPINE_N][2] < STRING_LEN) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// Puppet warp: every point of the string keeps its distance along the string
// and its offset across it, but follows the bent spine.
// drop: how far the bottom pin has moved from rest (negative = up, slack)
// side, wave: extra sideways bend in px (swing trail, snap)
// Returns where the knot's spot on the string went: its offset from rest and
// the string's angle there, so the knot can ride along.
function warpString(drop, side, wave) {
  if (!stringPath) return null;
  const gap = STRING_LEN + drop;
  const sp = spine(gap, BOW * bowFor(gap) + side, wave);
  const total = sp[SPINE_N][2];
  let angle = 0;
  const map = ([x, y]) => {
    const target = Math.min(1, Math.max(0, (y - STRING_TOP) / STRING_LEN)) * total;
    let j = 0;
    while (j < SPINE_N - 1 && sp[j + 1][2] < target) j++;
    const a = sp[j];
    const b = sp[j + 1];
    const segLen = (b[2] - a[2]) || 1;
    const t = (target - a[2]) / segLen;
    const tx = (b[0] - a[0]) / segLen;  // unit tangent
    const ty = (b[1] - a[1]) / segLen;
    const off = x - STRING_CX;
    angle = Math.atan2(-tx, ty);
    return [STRING_CX + a[0] + (b[0] - a[0]) * t + ty * off, STRING_TOP + a[1] + (b[1] - a[1]) * t - tx * off];
  };
  const fmt = (p) => { const [px, py] = map(p); return `${px.toFixed(2)} ${py.toFixed(2)}`; };
  stringPath.setAttribute('d', stringSegs.map(({ cmd, pts }) => cmd + pts.map(fmt).join(' ')).join(''));
  const [kx, ky] = map(KNOT);
  return { x: kx - KNOT[0], y: ky - KNOT[1], angle };
}

fetch(layer['string-straight'].querySelector('img').src)
  .then((r) => r.text())
  .then((txt) => {
    const img = layer['string-straight'].querySelector('img');
    const svg = document.importNode(new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement, true);
    svg.removeAttribute('style');
    img.replaceWith(svg);
    stringPath = svg.querySelector('path');
    stringRest = stringPath.getAttribute('d');
    stringSegs = parsePath(stringPath.getAttribute('d'));
  });

// --- Motion -------------------------------------------------------------
// The string is held at its top (--pin). The fish starts up by the hand with
// the string slack, drops, and is caught when the string runs out: it
// snaps taut, stretches and bounces, then the charm swings from the pin
// with the string trailing a little and the fish swinging a beat behind.
const G = 2600;           // px/s², fall
const START = 0.8;        // how far up the string the fish starts (of its length)
const TAUT_K = 900;       // string stretch spring once taut
const TAUT_C = 9;         // ...and its damping
const SAG = G / TAUT_K;   // stretch under the fish's weight at rest
const SWING_K = 7;        // pendulum stiffness (g / length)
const SWING_C = 1.4;      // pendulum damping
const FISH_K = 38;        // fish around the knot
const FISH_C = 3.2;
const LAG = 1.4;          // how hard the fish lags the string's swing
const BOW = -1;           // slack string bows to the left
const TRAIL = 14;         // sideways bend per rad/s of swing
const WHIP = 12;          // S-wave through the string when it snaps taut
const WHIP_DECAY = 7;     // per s
const WHIP_FREQ = 26;     // rad/s

const HIT = 2.2;          // rad/s a click knocks into the swing
const DRAG_STRETCH = 6;   // px the string gives when pulled past its length
const MAX_THROW = 3.2;    // rad/s cap on a released swing, so a flick can't loop it over the pin
const MAX_THROW_Y = 1200; // px/s cap along the string
const PIN_X = 201;        // matches --pin-x / --pin-y in charm.css
const PIN_Y = -66;

let y, vy, theta, omega, phi, omegaPhi, whip, whipT, wasTaut, last;
let grab = null;  // while dragging: the grabbed point on the charm, relative to the pin, at rest
let pointer = null;

function drop() {
  y = -START * STRING_LEN;  // fish displacement from rest along the string
  vy = 0;
  theta = 0.12;  // let go a little off-centre so it swings
  omega = 0;
  phi = 0;
  omegaPhi = 0;
  whip = 0;
  whipT = 0;
  wasTaut = false;
  last = performance.now();
}

function snap(strength) {
  whip = strength * WHIP;
  whipT = 0;
}

// Pin position on the page (layout position, unaffected by the swing)
function pinPos() {
  return [charm.offsetLeft + PIN_X, charm.offsetTop + PIN_Y];
}

// Angle of a vector from straight down, in CSS rotate() terms
const angleOf = ([vx, vy2]) => Math.atan2(-vx, vy2);

function step(now) {
  const dt = Math.min(0.032, (now - last) / 1000);
  last = now;

  let alpha;
  if (grab) {
    // Dragged: the grabbed point follows the pointer around the pin. The
    // string can go slack but only stretch a little.
    const v = [pointer[0] - pinPos()[0], pointer[1] - pinPos()[1]];
    const nextTheta = angleOf(v) - angleOf(grab);
    const nextY = Math.max(-0.9 * STRING_LEN, Math.min(DRAG_STRETCH, Math.hypot(...v) - Math.hypot(...grab)));
    const nextOmega = dt ? (nextTheta - theta) / dt : 0;
    alpha = dt ? (nextOmega - omega) / dt : 0;
    alpha = Math.max(-200, Math.min(200, alpha));
    omega += (nextOmega - omega) * 0.5;  // smoothed, so a release throws it
    vy += ((dt ? (nextY - y) / dt : 0) - vy) * 0.5;
    theta = nextTheta;
    y = nextY;
    wasTaut = y + SAG > 0;
  } else {
    // Free fall while slack; a stiff spring once the string is taut
    const stretch = y + SAG;
    const taut = stretch > 0;
    vy += (G - (taut ? TAUT_K * stretch + TAUT_C * vy : 0)) * dt;
    y += vy * dt;
    if (taut && !wasTaut && vy > 300) {
      // Snap: the jolt sends a wave up the string and kicks the fish
      snap(Math.min(1, vy / 1600));
      omegaPhi += vy / 900;
    }
    wasTaut = taut;

    alpha = -SWING_K * Math.sin(theta) - SWING_C * omega;
    omega += alpha * dt;
    theta += omega * dt;
  }
  whipT += dt;

  const alphaPhi = -FISH_K * phi - FISH_C * omegaPhi - LAG * alpha;
  omegaPhi += alphaPhi * dt;
  phi += omegaPhi * dt;

  // Slack string bows out (see warpString); it also trails the swing
  const trail = -TRAIL * omega;
  const wave = whip * Math.exp(-WHIP_DECAY * whipT) * Math.sin(WHIP_FREQ * whipT);

  charm.style.transform = `rotate(${theta}rad)`;
  fish.style.transform = `translateY(${y}px) rotate(${phi}rad)`;
  // Once the bends have died away, show the straight Figma string exactly
  const knot = layer['knot-top'];
  if (Math.abs(y) < 0.5 && Math.abs(trail) < 0.4 && Math.abs(wave) < 0.4) {
    if (stringPath && stringPath.getAttribute('d') !== stringRest) stringPath.setAttribute('d', stringRest);
    knot.style.transform = 'none';
  } else {
    const k = warpString(y, trail, wave);
    if (k) knot.style.transform = `translate(${k.x}px, ${k.y}px) rotate(${k.angle}rad)`;
  }
  requestAnimationFrame(step);
}

// --- Hit and drag --------------------------------------------------------
// Press on the charm: a tap hits it, a drag pulls it around. A tap on the
// empty canvas drops it again.
const stage = document.getElementById('stage');
let press = null;

stage.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const onCharm = !!e.target.closest('.part');
  press = { x: e.clientX, y: e.clientY, onCharm, moved: false };
  stage.setPointerCapture(e.pointerId);
});

stage.addEventListener('pointermove', (e) => {
  if (!press) return;
  pointer = [e.clientX, e.clientY];
  if (!press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 4) {
    press.moved = true;
    if (press.onCharm) {
      // Remember the grabbed point in the charm's rest frame (undo the swing and the drop)
      const [px, py] = pinPos();
      const vx = press.x - px;
      const vy2 = press.y - py;
      const c = Math.cos(-theta);
      const sn = Math.sin(-theta);
      grab = [vx * c - vy2 * sn, vx * sn + vy2 * c - y];
      if (Math.hypot(...grab) < 30) grab = [0, 30];
      document.body.classList.add('is-dragging');
    }
  }
});

function release() {
  if (!press) return;
  if (!press.moved) {
    if (press.onCharm) {
      // Hit: knock it away from the side that was hit
      const side = press.x > pinPos()[0] ? 1 : -1;
      omega += side * HIT;
      omegaPhi -= side * HIT * 1.5;
      snap(0.6);
    } else {
      drop();
    }
  }
  if (grab) {
    omega = Math.max(-MAX_THROW, Math.min(MAX_THROW, omega));
    vy = Math.max(-MAX_THROW_Y, Math.min(MAX_THROW_Y, vy));
  }
  grab = null;
  press = null;
  document.body.classList.remove('is-dragging');
}
stage.addEventListener('pointerup', release);
stage.addEventListener('pointercancel', release);

drop();
requestAnimationFrame(step);
