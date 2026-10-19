// Wish Tree (the Tree tab): people's anonymous wishes hang from a tree as
// paper strips. Drawn like the cards: flat design-system colours, solid
// System Black shapes, a thin System Black line, paper grain over it all.
// Tapping a strip brings it up close to read.
(function wishTree() {
  const W = 402;
  const H = 874;  // drawn on the Figma frame; the scene scrolls if the screen is shorter
  const INK = '#272727';
  const LINE = 1.2;  // the cards' outline at this size
  const C = {
    sky: '#11B2E4', forest: '#2A9F3A', yellowGreen: '#DDCA4F', yellow: '#F0F2A1',
    lightPink: '#FC91B1', white: '#F0F0F0',
  };
  const PAPER = [C.white, C.white, C.yellow, C.white, C.lightPink, C.white, C.yellow];

  const WISHES = [
    'I wish my mum’s surgery goes smoothly next week.',
    'Let me pass my driving test on the third try.',
    'I hope the people I love feel loved today.',
    'Please let my little brother make new friends at his new school.',
    'I wish I could be braver about saying what I want.',
    'A quiet, healthy year for my grandparents.',
    'I hope the job offer comes through.',
    'Let our dog Bori stay with us a long, long time.',
    'I wish to stop comparing myself to everyone.',
    'May I find a home that feels like mine.',
    'I hope she says yes.',
    'Good sleep, every night, for once.',
    'I wish my friend and I could talk again like before.',
    'Let my band play one sold-out show.',
    'I hope my exams go better than I fear.',
    'May everyone reading this get the thing they’re hoping for.',
    'I wish to see the ocean with my dad this summer.',
    'Let me be kinder to myself this year.',
  ];
  // Fixed so the tree looks the same each visit
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // The willow, painted after the reference (Lv Ye Cai): a dark teal
  // forest under a deep navy canopy, a beam of light from the top left, and
  // tall rounded willow crowns glowing yellow-green at the top, deepening to
  // teal, their scalloped hems trailing strands of leaves over a lit floor.
  const P = {
    sky1: '#16313f', sky2: '#1f4e57', sky3: '#2b6a66',
    colDark: '#1b4a4f', colMid: '#24605f', colLight: '#327872',
    cloud: '#1a3142', cloudLine: '#2b4a5d', cloudFront: '#203c4e',
    crown1: '#ecf39a', crown2: '#c9e374', crown3: '#93cb6a', crown4: '#5aa978',
    teal1: '#5fae7c', teal2: '#2f8070',
    leafLight: '#f5f8b6', leafDark: '#86c062',
    vine: '#3c9774', vineLeaf1: '#6cbf7c', vineLeaf2: '#a8d977',
    bark: '#294657', barkLight: '#5b95a3', barkDark: '#1a303e',
    floor: '#d9eb93', glow: '#f7fbd0', mound: '#2d6e62', moundTop: '#6fb486',
  };
  const f1 = (n) => n.toFixed(1);

  // A crown: a tall shape rounded on top, its hem a row of downward lobes
  function crownPath(x, y, w, h, lobes, depth) {
    const r = w / 2;
    let d = `M${x} ${y + r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h}`;
    for (let i = lobes - 1; i >= 0; i--) {
      const x0 = x + (w * i) / lobes;
      const dep = depth * (0.75 + rand() * 0.5);
      d += `A${f1(w / lobes / 2)} ${f1(dep)} 0 0 1 ${f1(x0)} ${y + h}`;
    }
    return d + 'Z';
  }
  // A crown painted: its gradient, then fine vertical streaks and the
  // chevron willow-leaf pattern, both clipped to it
  let defs = '';
  let clipN = 0;
  function crown(x, y, w, h, lobes, depth, grad, leafPat, opacity = 1) {
    const d = crownPath(x, y, w, h, lobes, depth);
    const id = `crown${clipN++}`;
    defs += `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
    return `<g opacity="${opacity}"><path d="${d}" fill="url(#${grad})"/>
      <g clip-path="url(#${id})">
        <rect x="${x}" y="${y}" width="${w}" height="${h + depth * 1.4}" fill="url(#streaks)"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h + depth * 1.4}" fill="url(#${leafPat})" mask="url(#leafFade)"/>
        <rect x="${x}" y="${y}" width="${w * 0.42}" height="${h + depth * 1.4}" fill="url(#litSide)"/>
      </g></g>`;
  }
  // A limb: a smooth tapered shape through points, w1 wide at the first
  function limb(pts, w1, w2, fill, shift = 0) {
    const sample = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let t = 0; t < 1; t += 0.125) {
        const t2 = t * t, t3 = t2 * t;
        const q = (k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
        sample.push([q(0), q(1)]);
      }
    }
    sample.push(pts[pts.length - 1]);
    const n = sample.length;
    const left = [], right = [];
    sample.forEach(([x, y], i) => {
      const [ax, ay] = sample[Math.min(n - 1, i + 1)], [bx, by] = sample[Math.max(0, i - 1)];
      const dx = ax - bx, dy = ay - by, l = Math.hypot(dx, dy) || 1;
      const w = (w1 + (w2 - w1) * (i / (n - 1))) / 2;
      const nx = -dy / l, ny = dx / l;
      const cx = x + nx * shift * w * 2, cy = y + ny * shift * w * 2;
      left.push(`${f1(cx + nx * w)} ${f1(cy + ny * w)}`);
      right.push(`${f1(cx - nx * w)} ${f1(cy - ny * w)}`);
    });
    return `<path d="M${left.join('L')}L${right.reverse().join('L')}Z" fill="${fill}"/>`;
  }
  // A strand of willow: a fine line hanging from (x, y), leaves paired down it
  function strand(x, y, len, colour, leafA, leafB, op = 1) {
    const sway = (rand() - 0.5) * 8;
    let out = `<path d="M${f1(x)} ${f1(y)}q${f1(sway)} ${f1(len / 2)} 0 ${f1(len)}" fill="none" stroke="${colour}" stroke-width="0.8" opacity="${op}"/>`;
    for (let t = 0.08; t <= 1; t += 9 / len) {
      const px = x + sway * 2 * t * (1 - t), py = y + len * t;
      const s = 3.4 + rand() * 1.4;
      const fill = rand() < 0.55 ? leafA : leafB;
      out += `<path d="M0 0q${f1(-s * 0.9)} ${f1(s * 0.2)} ${f1(-s * 1.4)} ${f1(s * 1.2)}q${f1(s * 0.9)} ${f1(-s * 0.1)} ${f1(s * 1.4)} ${f1(-s * 1.2)}Z" transform="translate(${f1(px)} ${f1(py)})" fill="${fill}" opacity="${op}"/>`
        + `<path d="M0 0q${f1(s * 0.9)} ${f1(s * 0.2)} ${f1(s * 1.4)} ${f1(s * 1.2)}q${f1(-s * 0.9)} ${f1(-s * 0.1)} ${f1(-s * 1.4)} ${f1(-s * 1.2)}Z" transform="translate(${f1(px)} ${f1(py + 2)})" fill="${fill}" opacity="${op}"/>`;
    }
    return out;
  }
  // Strands along a crown's hem
  function hem(x, w, y, n, minLen, maxLen, colour, leafA, leafB, op) {
    let out = '';
    for (let i = 0; i < n; i++) {
      const sx = x + 6 + ((w - 12) * (i + rand() * 0.6)) / n;
      out += strand(sx, y + rand() * 14, minLen + rand() * (maxLen - minLen), colour, leafA, leafB, op);
    }
    return out;
  }

  // --- Shared paint: gradients, the streak and leaf patterns, light ---
  const grad = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  // Willow leaves in columns: a V of two leaves every step down a stem
  const chevrons = (id, colour, op) => `<pattern id="${id}" width="17" height="19" patternUnits="userSpaceOnUse">
      <path d="M8.5 2.5q-4 1.4-7 7.4q4.2-1.6 7-7.4Z M8.5 2.5q4 1.4 7 7.4q-4.2-1.6-7-7.4Z" fill="${colour}" opacity="${op}"/>
      <path d="M8.5 0V19" stroke="${colour}" stroke-width="0.6" opacity="${op * 0.6}"/></pattern>`;
  defs += grad('sky', [[0, P.sky1], [0.35, P.sky2], [0.7, P.sky3], [1, P.teal1]])
    + grad('crownLit', [[0, '#f1f6a6'], [0.5, '#dcec86'], [1, '#bddf70']])
    + grad('crownShade', [[0, '#d2e68a'], [1, '#93c86c']])
    + grad('crownLow', [[0, '#3f9474'], [0.6, '#2c7b6c'], [1, '#1f625c']])
    + grad('pillar', [[0, '#3c9172'], [1, '#1d5c58']])
    + grad('litSide', [[0, '#fbfde0', 0.32], [1, '#fbfde0', 0]], 1, 0)
    + grad('floorGrad', [[0, P.floor, 0], [0.28, P.floor, 0.9], [0.6, '#bcdb85'], [1, '#78b77a']])
    + grad('beam', [[0, '#fbfde0', 0.38], [0.6, '#fbfde0', 0.1], [1, '#fbfde0', 0]], 0.55, 1)
    + grad('shadeRight', [[0, '#0d2833', 0], [1, '#0d2833', 0.35]], 1, 0)
    + grad('col', [[0, P.colLight, 0.85], [1, P.colDark, 0.95]], 1, 0)
    + `<radialGradient id="glow"><stop offset="0" stop-color="${P.glow}" stop-opacity="0.85"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="spiritGlow"><stop offset="0" stop-color="#ffffff" stop-opacity="0.6"/><stop offset="1" stop-color="#e9f7d0" stop-opacity="0"/></radialGradient>`
    + `<pattern id="streaks" width="3" height="10" patternUnits="userSpaceOnUse"><path d="M1 0V10" stroke="#ffffff" stroke-width="0.5" opacity="0.13"/></pattern>`
    + chevrons('leavesLit', '#a3d05e', 0.75) + chevrons('leavesDeep', '#73b15a', 0.55) + chevrons('leavesTeal', '#7cc58a', 0.6)
    + `<filter id="beamBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12"/></filter>`
    + `<linearGradient id="fadeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.6" stop-color="#fff" stop-opacity="1"/></linearGradient>`
    + `<mask id="leafFade" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#fadeGrad)"/></mask>`
    + `<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

  // --- Background: the far forest's trunks, and the navy canopy above ---
  let back = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  for (const [x, y, w] of [[-4, 120, 26], [36, 150, 30], [98, 170, 14], [120, 150, 24], [344, 170, 12], [366, 140, 40], [300, 180, 16]]) {
    back += `<rect x="${x}" y="${y}" width="${w}" height="${H - y}" fill="url(#col)"/>`;
  }
  let clouds = '';
  const cloudRow = (cy, r, xs, fill, line) => xs.map((cx) => {
    let g = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
    for (let k = 1; k <= 6; k++) g += `<circle cx="${cx}" cy="${cy + k * 2}" r="${r - k * 9}" fill="none" stroke="${line}" stroke-width="1.4" opacity="${0.75 - k * 0.08}"/>`;
    return g;
  }).join('');
  clouds += cloudRow(10, 80, [-30, 60, 150, 240, 330, 420], P.cloud, P.cloudLine);
  clouds += cloudRow(92, 64, [10, 105, 196, 287, 378], P.cloudFront, '#2f5468');

  // The beam: light falling from the top left, across the whole scene
  const beam = `<g filter="url(#beamBlur)" style="mix-blend-mode: screen">
    <polygon points="-20,90 120,-10 360,874 150,874" fill="url(#beam)"/>
    <polygon points="-20,250 34,216 230,874 176,874" fill="url(#beam)" opacity="0.7"/></g>`;

  // --- The willow ---
  // Behind: the tall crown at the top right, in shade
  let tree = crown(270, 104, 100, 220, 3, 22, 'crownShade', 'leavesDeep', 0.95);
  tree += hem(272, 96, 318, 9, 30, 90, '#8cc96f', '#bfe37f', '#e4f19a', 0.85);
  // Left: the crown the long branch reaches into, then its curtain of strands
  tree += crown(14, 476, 132, 140, 3, 22, 'crownLow', 'leavesTeal', 0.9);
  tree += crown(16, 304, 126, 186, 3, 26, 'crownLit', 'leavesLit');
  tree += hem(18, 122, 500, 13, 60, 190, '#8cc96f', '#bfe37f', '#e4f19a', 0.95);
  // The main crown's long lower curtain and the pillar hanging to the floor
  tree += crown(152, 430, 220, 250, 3, 30, 'crownLow', 'leavesTeal', 0.95);
  tree += crown(150, 520, 54, 236, 1, 26, 'pillar', 'leavesTeal');
  tree += hem(206, 166, 690, 14, 30, 110, '#8cc96f', '#bfe37f', '#e4f19a', 0.9);

  // The trunk: slate blue, lit down its left edge, from the bottom right up
  // into the crown, its long branch reaching out to the left
  const TRUNK = [[392, 900], [360, 820], [322, 742], [288, 676], [268, 610], [260, 540], [262, 470]];
  const LEFT = [[276, 640], [222, 624], [162, 604], [104, 570], [56, 534]];
  const UP = [[262, 560], [234, 506], [214, 462]];
  const RIGHT = [[268, 596], [302, 566], [340, 546], [374, 528]];
  let wood = '';
  for (const [pts, w1, w2] of [[LEFT, 30, 8], [UP, 14, 6], [RIGHT, 14, 5], [TRUNK, 62, 18]]) {
    wood += limb(pts, w1, w2, P.bark) + limb(pts, w1 * 0.36, w2 * 0.3, P.barkLight, 0.32) + limb(pts, w1 * 0.24, w2 * 0.2, P.barkDark, -0.36);
  }
  tree += wood;
  // The main crown over it all, lit from the left, and the small one at right
  tree += crown(148, 172, 226, 300, 4, 40, 'crownLit', 'leavesLit');
  // Strands hanging down the crown's face, in a deeper green, as in the painting
  const face = (x, w, y0, y1, n, len0, len1) => {
    let out = '';
    for (let i = 0; i < n; i++) {
      const sx = x + 10 + ((w - 20) * (i + rand() * 0.7)) / n;
      out += strand(sx, y0 + rand() * (y1 - y0), len0 + rand() * (len1 - len0), '#86c25e', '#7cbb59', '#a2d065', 0.85);
    }
    return out;
  };
  tree += face(150, 222, 300, 380, 11, 110, 190);
  tree += hem(152, 220, 470, 22, 50, 200, '#8cc96f', '#bfe37f', '#e4f19a', 1);
  tree += face(18, 122, 400, 440, 5, 70, 110);
  tree += crown(298, 434, 94, 118, 2, 24, 'crownLit', 'leavesLit');
  tree += face(298, 94, 480, 500, 4, 50, 80);
  tree += hem(300, 90, 556, 8, 40, 120, '#8cc96f', '#bfe37f', '#e4f19a', 1);
  tree += crown(292, 692, 48, 64, 1, 18, 'crownShade', 'leavesDeep');

  // --- The floor: lit ground, mounds, sprigs and dandelion puffs ---
  const ground = `<rect x="0" y="620" width="${W}" height="${H - 620}" fill="url(#floorGrad)"/>
    <ellipse cx="230" cy="724" rx="260" ry="66" fill="url(#glow)"/>`;
  let floor = `<path d="M-10 874V800Q40 740 110 770Q150 790 160 874Z" fill="${P.mound}"/>
    <path d="M-10 806Q40 748 108 776" fill="none" stroke="${P.moundTop}" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
    <path d="M214 874Q226 790 290 786Q352 784 372 874Z" fill="${P.mound}"/>
    <path d="M232 820Q252 792 292 790Q330 790 350 812" fill="none" stroke="${P.moundTop}" stroke-width="6" stroke-linecap="round" opacity="0.65"/>
    <path d="M330 874Q350 820 402 818V874Z" fill="#2a6560"/>`;
  const sprig = (x, y, h, lean) => {
    let g = `<path d="M${x} ${y}q${lean} ${-h / 2} ${lean * 1.4} ${-h}" fill="none" stroke="#9ccf7c" stroke-width="1.4"/>`;
    for (let t = 0.2; t < 1; t += 0.2) {
      const px = x + lean * 1.4 * t, py = y - h * t;
      g += `<ellipse cx="${f1(px - 6)}" cy="${f1(py)}" rx="6" ry="2.4" transform="rotate(-28 ${f1(px - 6)} ${f1(py)})" fill="#a9d985"/>`
        + `<ellipse cx="${f1(px + 6)}" cy="${f1(py - 3)}" rx="6" ry="2.4" transform="rotate(28 ${f1(px + 6)} ${f1(py - 3)})" fill="#8cc777"/>`;
    }
    return g;
  };
  floor += sprig(26, 820, 70, -4) + sprig(54, 832, 54, 6) + sprig(250, 820, 40, 4) + sprig(300, 826, 34, -3) + sprig(372, 840, 50, 5);
  floor += `<circle cx="62" cy="744" r="17" fill="#dff0a8" opacity="0.75"/><circle cx="62" cy="744" r="12" fill="#eef7c4" opacity="0.6"/>
    <path d="M62 761V830" stroke="#9ccf7c" stroke-width="1.2"/>
    <circle cx="104" cy="770" r="13" fill="#d6ec9c" opacity="0.7"/><path d="M104 783V840" stroke="#9ccf7c" stroke-width="1.2"/>
    <circle cx="18" cy="776" r="9" fill="#8c90c4" opacity="0.85"/><path d="M18 785V830" stroke="#7aa98f" stroke-width="1.2"/>`;

  // --- The light: white spirit antlers and birds, glowing ---
  const antler = (x, y, s, flip) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})" filter="url(#soft)">
      <path d="M0 0C-6 -26 -2 -48 12 -70M4 -30C16 -36 24 -48 24 -62M-2 -16C-14 -22 -22 -32 -24 -44M10 -54C18 -58 24 -66 24 -76" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/></g>`;
  let spirits = `<circle cx="72" cy="300" r="120" fill="url(#spiritGlow)"/>
    <circle cx="120" cy="600" r="70" fill="url(#spiritGlow)" opacity="0.8"/>`;
  spirits += antler(66, 380, 1.7, false) + antler(130, 622, 0.9, true) + antler(96, 594, 0.75, false);
  const bird = (x, y, r, s) => `<path d="M0 0q7 -9 15 -4q-6 0 -8 6q-3 -3 -7 -2Z" transform="translate(${x} ${y}) rotate(${r}) scale(${s})" fill="#ffffff" filter="url(#soft)"/>`;
  spirits += bird(206, 520, -20, 1) + bird(250, 500, 10, 0.9) + bird(232, 556, 30, 0.8) + bird(282, 548, -10, 1) + bird(196, 590, 40, 0.8) + bird(268, 600, -30, 0.9);

  // Last, the right side falls into shade and the floor glows up
  const shade = `<rect x="${W * 0.55}" y="0" width="${W * 0.45}" height="${H}" fill="url(#shadeRight)"/>`;

  // Where the slips hang: [x, y] on a canopy edge or strand, string length,
  // then the tag's width and height
  const HANGS = [
    [28, 505, 26, 24, 70], [70, 528, 60, 24, 72], [112, 560, 22, 24, 70], [152, 470, 36, 24, 78],
    [190, 392, 120, 24, 74], [228, 398, 60, 24, 76], [266, 428, 100, 24, 72], [300, 452, 40, 24, 72],
    [338, 468, 56, 24, 58], [378, 488, 30, 24, 68], [55, 460, 18, 22, 62], [135, 548, 90, 24, 64],
    [215, 430, 150, 24, 68], [248, 420, 20, 22, 84], [318, 440, 130, 24, 64], [368, 430, 16, 22, 54],
    [90, 470, 14, 22, 62], [180, 560, 70, 24, 66],
  ];
  // A tag (the reference slips): top corners clipped, a hole, lines of writing
  function strip(w, h, fill) {
    const c = Math.min(8, w * 0.3);
    let writing = '';
    for (let y = 17; y < h - 9; y += 9) {
      const len = w * (0.35 + rand() * 0.35);
      const x = -w / 2 + 5;
      writing += `<path d="M${x.toFixed(1)} ${y}q${(len / 4).toFixed(1)} -2 ${(len / 2).toFixed(1)} 0t${(len / 2).toFixed(1)} 0" fill="none" stroke="${INK}" stroke-width="0.7" stroke-linecap="round"/>`;
    }
    return `<path d="M${-w / 2} ${c}L${-w / 2 + c} 0H${w / 2 - c}L${w / 2} ${c}V${h}H${-w / 2}Z" fill="${fill}" stroke="${INK}" stroke-width="${LINE}" stroke-linejoin="round"/>`
      + `<circle cx="0" cy="${c + 1}" r="2.2" fill="${C.sky}" stroke="${INK}" stroke-width="${LINE * 0.8}"/>${writing}`;
  }
  // A tag on its string, hung at [x, y, string, width, height]
  function hung([x, y, len, w, h], fill, data) {
    const delay = (-rand() * 4).toFixed(2);
    return `<g class="tree--wish" ${data} data-fill="${fill}" tabindex="0" role="button" aria-label="Read a wish"
      style="transform-origin: ${x.toFixed(1)}px ${y.toFixed(1)}px; animation-delay: ${delay}s">
      <path d="M${x.toFixed(1)} ${y.toFixed(1)}V${(y + len + 6).toFixed(1)}" stroke="${INK}" stroke-width="0.8"/>
      <g transform="translate(${x.toFixed(1)} ${(y + len).toFixed(1)})">${strip(w, h, fill)}</g>
    </g>`;
  }
  const strips = HANGS.map((hang, i) => hung(hang, PAPER[i % PAPER.length], `data-wish="${i}"`)).join('');
  // Where wishes written here go, in turn: spots the willow has left free.
  // Past these, new wishes hang over older ones.
  const SPARE = [
    [242, 470, 110, 20, 56], [350, 540, 60, 20, 56], [18, 560, 70, 20, 56], [105, 600, 80, 20, 56],
    [300, 560, 120, 20, 56], [60, 520, 160, 20, 56], [385, 540, 130, 20, 56],
  ];

  const scene = document.getElementById('tree-scene');
  scene.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="false">
    <defs>${defs}</defs>
    ${back}${clouds}${ground}${tree}${floor}${spirits}${shade}${beam}
    <g class="tree--wishes">${strips}</g>
  </svg>`;

  // --- Reading a wish: the strip comes up close, then goes back on the tree ---
  const reader = document.getElementById('wish');
  const slip = reader.querySelector('.wish--slip');
  const text = document.getElementById('wish-text');
  let from = null;
  const stageEl = document.getElementById('stage');
  const toStage = (r) => {
    const s = stageEl.getBoundingClientRect();
    const k = s.width / stageEl.offsetWidth;
    return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
  };
  const OPTS = { duration: 520, easing: 'cubic-bezier(0.3, 0.8, 0.2, 1)', fill: 'both' };
  function transformFrom(a, b) {
    return `translate(${a.x + a.w / 2 - (b.x + b.w / 2)}px, ${a.y + a.h / 2 - (b.y + b.h / 2)}px) scale(${a.w / b.w}, ${a.h / b.h})`;
  }
  const fromEl = reader.querySelector('.wish--from');
  function openWish(g) {
    const paper = g.querySelector('g > path');
    const own = g.dataset.own != null;
    text.textContent = own ? mine[Number(g.dataset.own)].text : WISHES[Number(g.dataset.wish) % WISHES.length];
    fromEl.textContent = own ? 'Anonymous · yours' : 'Anonymous';
    slip.style.setProperty('--paper', g.dataset.fill);
    reader.classList.add('is-open');
    stageEl.classList.add('is-reading');
    reader.setAttribute('aria-hidden', 'false');
    from = { g, box: toStage(paper.getBoundingClientRect()) };
    g.style.visibility = 'hidden';
    const to = toStage(slip.getBoundingClientRect());
    slip.animate([{ transform: `${transformFrom(from.box, to)} rotate(0deg)`, opacity: 0.9 },
      { transform: 'none', opacity: 1 }], OPTS);
    reader.querySelector('.wish--close').focus({ preventScroll: true });
  }
  function closeWish() {
    if (!from) return;
    const { g, box } = from;
    from = null;
    const to = toStage(slip.getBoundingClientRect());
    reader.classList.remove('is-open');
    stageEl.classList.remove('is-reading');
    reader.setAttribute('aria-hidden', 'true');
    slip.animate([{ transform: 'none', opacity: 1 }, { transform: transformFrom(box, to), opacity: 0.9 }], OPTS)
      .finished.then(() => {
        slip.getAnimations().forEach((a) => a.cancel());
        g.style.visibility = '';
        g.focus({ preventScroll: true });
      });
  }
  scene.addEventListener('click', (e) => {
    const g = e.target.closest('.tree--wish');
    if (g) openWish(g);
  });
  scene.addEventListener('keydown', (e) => {
    const g = e.target.closest('.tree--wish');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openWish(g); }
  });
  reader.querySelector('.wish--scrim').addEventListener('click', closeWish);
  reader.querySelector('.wish--close').addEventListener('click', closeWish);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeWish(); });

  // --- Writing a wish: write it on a slip, spend clovers, hang it up ---
  const COST = 3;
  const MAX = 80;
  const mine = [];
  const form = document.getElementById('wishform');
  const sheet = form.querySelector('.wishform--sheet');
  const draft = form.querySelector('.wishform--slip');
  const input = document.getElementById('wish-input');
  const chars = document.getElementById('wish-chars');
  const hang = document.getElementById('wish-hang');
  const hangLabel = hang.querySelector('.wishform--hang-label');
  const balance = document.getElementById('wish-balance');
  const confirm = form.querySelector('.wishform--confirm');
  const confirmText = document.getElementById('wish-confirm-text');
  const papers = [...form.querySelectorAll('.wishform--paper')];
  const toast = document.getElementById('wish-toast');
  let paperFill = C.white;

  const plural = (n) => `${n} clover${n === 1 ? '' : 's'}`;
  // The button says what's missing: words, or clovers
  function refresh() {
    const n = input.value.trim().length;
    chars.textContent = `${input.value.length}/${MAX}`;
    const enough = luck >= COST;
    hang.disabled = !enough || n < 3;
    hangLabel.textContent = enough ? 'Hang it for' : 'Not enough clovers';
    hang.classList.toggle('is-short', !enough);
    balance.textContent = enough
      ? `You have ${plural(luck)}`
      : `You have ${plural(luck)}. Claim luck from a card to earn more.`;
  }
  function pickPaper(btn) {
    papers.forEach((p) => p.setAttribute('aria-checked', String(p === btn)));
    paperFill = btn.dataset.fill;
    draft.style.setProperty('--paper', paperFill);
  }
  function openForm() {
    input.value = '';
    pickPaper(papers[0]);
    refresh();
    form.classList.add('is-open');
    form.setAttribute('aria-hidden', 'false');
    stageEl.classList.add('is-writing');
    setTimeout(() => input.focus({ preventScroll: true }), 420);
  }
  function closeForm() {
    form.classList.remove('is-open', 'is-confirming');
    form.setAttribute('aria-hidden', 'true');
    stageEl.classList.remove('is-writing');
    input.blur();
  }
  document.getElementById('wish-write').addEventListener('click', openForm);
  form.querySelector('.wishform--scrim').addEventListener('click', closeForm);
  form.querySelector('.wishform--close').addEventListener('click', closeForm);
  papers.forEach((p) => p.addEventListener('click', () => pickPaper(p)));
  input.addEventListener('input', refresh);
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !form.classList.contains('is-open')) return;
    if (form.classList.contains('is-confirming')) form.classList.remove('is-confirming');
    else closeForm();
  });

  // Asked once before the clovers go
  sheet.addEventListener('submit', (e) => {
    e.preventDefault();
    if (hang.disabled) return;
    confirmText.textContent = `This uses ${plural(COST)}. You’ll have ${luck - COST} left.`;
    form.classList.add('is-confirming');
    form.querySelector('.wishform--yes').focus({ preventScroll: true });
  });
  form.querySelector('.wishform--no').addEventListener('click', () => {
    form.classList.remove('is-confirming');
    input.focus({ preventScroll: true });
  });

  // Up it goes: the slip leaves the sheet and flies to its spot on the
  // tree, shrinking into a strip, which swings as it takes the weight
  form.querySelector('.wishform--yes').addEventListener('click', async () => {
    const wish = { text: input.value.trim(), fill: paperFill };
    const i = mine.push(wish) - 1;
    const spot = SPARE[i % SPARE.length];
    const group = scene.querySelector('.tree--wishes');
    group.insertAdjacentHTML('beforeend', hung(spot, wish.fill, `data-own="${i}"`));
    const g = group.lastElementChild;
    g.classList.add('is-new');
    g.style.visibility = 'hidden';

    // The flying slip starts where the draft is
    const start = toStage(draft.getBoundingClientRect());
    const fly = draft.cloneNode(true);
    fly.classList.add('wishform--fly');
    fly.querySelector('textarea').replaceWith(Object.assign(document.createElement('p'), { className: 'wishform--fly-text', textContent: wish.text }));
    Object.assign(fly.style, { left: `${start.x}px`, top: `${start.y}px`, width: `${start.w}px`, height: `${start.h}px` });
    stageEl.appendChild(fly);
    closeForm();
    changeLuck(-COST);

    // Bring the spot into view on short screens, then fly there
    const tree = document.getElementById('tree');
    const paper = g.querySelector('g > path');
    const box0 = paper.getBoundingClientRect();
    const tb = tree.getBoundingClientRect();
    if (box0.top < tb.top + 120 || box0.bottom > tb.bottom - 160) {
      tree.scrollTo({ top: tree.scrollTop + box0.top - tb.top - tb.height / 2, behavior: 'smooth' });
      await new Promise((r) => setTimeout(r, 380));
    }
    const end = toStage(paper.getBoundingClientRect());
    const dx = end.x + end.w / 2 - (start.x + start.w / 2);
    const dy = end.y + end.h / 2 - (start.y + start.h / 2);
    await fly.animate([
      { transform: 'none' },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.55 - 40}px) scale(0.55) rotate(-6deg)`, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(${end.w / start.w}, ${end.h / start.h})` },
    ], { duration: 900, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' }).finished;
    fly.remove();
    g.style.visibility = '';
    g.focus({ preventScroll: true });
    toast.classList.add('is-shown');
    setTimeout(() => toast.classList.remove('is-shown'), 2600);
    setTimeout(() => g.classList.remove('is-new'), 2600);
  });
}());
