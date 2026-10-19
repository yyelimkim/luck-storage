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

  // A branch: a tapered, gently bent limb from (x1, y1) to (x2, y2)
  const BRANCHES = [
    [192, 670, 62, 480, 22, 7, -18],
    [208, 662, 342, 470, 22, 7, 18],
    [197, 640, 112, 360, 16, 6, -14],
    [203, 640, 292, 350, 16, 6, 14],
    [200, 630, 204, 280, 15, 5, 6],
    [112, 360, 52, 306, 6, 2.5, -6],
    [292, 350, 354, 300, 6, 2.5, 6],
    [62, 480, 16, 446, 7, 2.5, -4],
    [342, 470, 388, 436, 7, 2.5, 4],
    [204, 280, 164, 228, 5, 2, -4],
    [204, 280, 250, 232, 5, 2, 4],
  ];
  const onBranch = ([x1, y1, x2, y2, , , bend], t) => {
    const nx = -(y2 - y1), ny = x2 - x1;
    const len = Math.hypot(nx, ny);
    const cx = (x1 + x2) / 2 + (nx / len) * bend, cy = (y1 + y2) / 2 + (ny / len) * bend;
    const u = 1 - t;
    return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2];
  };
  function branchPath(b) {
    const [x1, y1, x2, y2, w1, w2] = b;
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const [x, y] = onBranch(b, t);
      const [xa, ya] = onBranch(b, Math.min(1, t + 0.01));
      const [xb, yb] = onBranch(b, Math.max(0, t - 0.01));
      const dx = xa - xb, dy = ya - yb, d = Math.hypot(dx, dy) || 1;
      const w = (w1 + (w2 - w1) * t) / 2;
      pts.push([x - (dy / d) * w, y + (dx / d) * w, x + (dy / d) * w, y - (dx / d) * w]);
    }
    const left = pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`);
    const right = pts.map((p) => `${p[2].toFixed(1)} ${p[3].toFixed(1)}`).reverse();
    const [ex, ey] = onBranch(b, 1);
    return `M${left.join(' L')} Q${(ex + (x2 - x1) * 0.02).toFixed(1)} ${(ey + (y2 - y1) * 0.02).toFixed(1)} ${right.join(' L')} Z`;
  }

  // A leaf: pointed at both ends, turned a degrees
  const leaf = (x, y, r, a, fill) => `<path d="M0 ${-r}Q${r * 0.75} 0 0 ${r}Q${-r * 0.75} 0 0 ${-r}Z" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)})" fill="${fill}" stroke="${INK}" stroke-width="${LINE}"/>`;
  // A four-pointed sparkle, as on the cards
  const sparkle = (x, y, r) => `<path d="M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z" fill="${C.white}" stroke="${INK}" stroke-width="${LINE}"/>`;

  // Canopy clumps, outlined as one shape: every circle's line first, then
  // every circle's fill over the inside of the lines
  const CLUMPS = [
    [48, 404, 92], [130, 292, 100], [232, 238, 108], [340, 300, 96], [394, 424, 74],
    [8, 524, 66], [110, 486, 76], [300, 474, 82], [205, 372, 86], [158, 186, 66], [292, 192, 68],
    [124, 590, 54], [286, 584, 58], [366, 548, 52], [40, 610, 40],
  ];
  const clumps = CLUMPS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${INK}" stroke-width="${LINE * 2}"/>`).join('')
    + CLUMPS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.forest}"/>`).join('');

  // Yellow-Green leaves round the clumps' edges
  let leaves = '';
  CLUMPS.forEach(([x, y, r]) => {
    for (let i = 0; i < 2; i++) {
      const a = rand() * Math.PI * 2;
      const d = r * (0.7 + rand() * 0.3);
      leaves += leaf(x + Math.cos(a) * d, y + Math.sin(a) * d, 13 + rand() * 7, rand() * 180, rand() < 0.7 ? C.yellowGreen : C.forest);
    }
  });

  // Narrowing up into the branches, so where they meet doesn't show
  const trunk = `<path d="M146 884C172 800 184 720 193 600L207 600C216 720 228 800 256 884Z" fill="${INK}"/>`;
  const branches = BRANCHES.map((b) => `<path d="${branchPath(b)}" fill="${INK}"/>`).join('');
  const hill = `<path d="M-10 812Q100 770 201 776Q302 770 412 812L412 884L-10 884Z" fill="${C.yellowGreen}" stroke="${INK}" stroke-width="${LINE}"/>`;
  const sparkles = [[22, 704, 8], [382, 700, 10], [48, 764, 5], [352, 760, 6]].map((s) => sparkle(...s)).join('');

  // Where each strip hangs: on which branch, how far along, its string and size
  const HANGS = [
    [0, 0.5, 34, 26, 92], [0, 0.82, 22, 24, 78], [1, 0.48, 40, 26, 96], [1, 0.84, 18, 24, 80],
    [2, 0.5, 30, 24, 84], [2, 0.86, 54, 22, 70], [3, 0.52, 26, 24, 86], [3, 0.88, 50, 22, 72],
    [4, 0.62, 30, 26, 90], [4, 0.9, 64, 22, 70], [5, 0.9, 30, 22, 66], [6, 0.9, 26, 22, 70],
    [7, 0.85, 36, 22, 74], [8, 0.85, 30, 22, 76], [9, 0.9, 22, 20, 62], [10, 0.92, 40, 20, 64],
    [0, 0.3, 30, 24, 78], [1, 0.28, 26, 24, 76],
  ];
  // A strip, its top centre at (0, 0): a hole, a few lines of writing, a notched tail
  function strip(w, h, fill) {
    const n = Math.min(10, w * 0.4);
    let writing = '';
    for (let y = 18; y < h - n - 10; y += 9) {
      const len = w * (0.35 + rand() * 0.35);
      const x = -w / 2 + 5;
      writing += `<path d="M${x.toFixed(1)} ${y}q${(len / 4).toFixed(1)} -2 ${(len / 2).toFixed(1)} 0t${(len / 2).toFixed(1)} 0" fill="none" stroke="${INK}" stroke-width="0.7" stroke-linecap="round"/>`;
    }
    return `<path d="M${-w / 2} 0H${w / 2}V${h}L0 ${h - n}L${-w / 2} ${h}Z" fill="${fill}" stroke="${INK}" stroke-width="${LINE}" stroke-linejoin="round"/>`
      + `<circle cx="0" cy="7" r="2" fill="${C.sky}" stroke="${INK}" stroke-width="${LINE * 0.8}"/>${writing}`;
  }
  const strips = HANGS.map(([b, t, len, w, h], i) => {
    const [x, y] = onBranch(BRANCHES[b], t);
    const fill = PAPER[i % PAPER.length];
    const delay = (-rand() * 4).toFixed(2);
    return `<g class="tree--wish" data-wish="${i}" data-fill="${fill}" tabindex="0" role="button" aria-label="Read a wish"
      style="transform-origin: ${x.toFixed(1)}px ${y.toFixed(1)}px; animation-delay: ${delay}s">
      <path d="M${x.toFixed(1)} ${y.toFixed(1)}V${(y + len + 7).toFixed(1)}" stroke="${INK}" stroke-width="0.8"/>
      <g transform="translate(${x.toFixed(1)} ${(y + len).toFixed(1)})">${strip(w, h, fill)}</g>
    </g>`;
  }).join('');

  const scene = document.getElementById('tree-scene');
  scene.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="false">
    <rect width="${W}" height="${H}" fill="${C.sky}"/>
    ${sparkles}${clumps}${trunk}${branches}${leaves}${hill}
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
  function openWish(g) {
    const paper = g.querySelector('g > path');
    text.textContent = WISHES[Number(g.dataset.wish) % WISHES.length];
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
}());
