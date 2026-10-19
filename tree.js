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

  // The willow (Figma 408:16532, 411:16547, 412:16550): a Yellow-Green
  // crown over Forest Green curtains whose lobes droop like the reference,
  // the trunk sweeping out to the right at its foot. Outlines stay the
  // cards' weight whatever each shape is scaled by.
  const DOME = 'M226 2.5C349.436 2.5 449.5 102.564 449.5 226V413.122C402.62 387.334 368.949 340.509 361.198 285.375L360.821 282.689L358.175 283.283C345.893 286.041 333.118 287.5 320 287.5C299.229 287.5 279.316 283.848 260.862 277.158L258.638 276.352L257.71 278.529C228.392 347.344 165.553 398.444 89.7119 411.331L87.9131 411.637L87.6562 413.443C81.8593 454.177 46.836 485.5 4.5 485.5C3.83143 485.5 3.16477 485.49 2.5 485.475V226C2.5 118.173 78.8609 28.1751 180.457 7.14355L182.927 6.64551L182.928 6.64648C196.863 3.92604 211.264 2.5 226 2.5Z';
  const CURTAIN = 'M456 406.5C456 417.27 447.27 426 436.5 426C425.73 426 417 417.27 417 406.5V354.335C412.201 357.292 406.55 359 400.5 359C390.307 359 381.247 354.157 375.489 346.648C372.377 369.852 355.306 388.634 333 394.267V447.5C333 489.75 298.75 524 256.5 524C235.167 524 215.875 515.267 202 501.182V549C202 580.48 176.48 606 145 606C127.839 606 112.45 598.416 102 586.417V622C102 643.539 84.5391 661 63 661C41.4609 661 24 643.539 24 622V547.009C9.90671 541.131 8.49318e-08 527.223 0 511V0H456V406.5Z';
  const TRUNK = 'M41.3662 279.475C44.7782 312.379 71.9217 388.827 152.729 440.081C258.392 478.896 302.747 580.659 311.857 629.408L311.969 630H0L1.61621 629.067C39.5278 607.179 53.6667 570.2 55.916 532.782C58.1659 495.355 48.5095 457.556 38.9033 434.19L38.6201 433.5H39.207C28.1753 412.555 8.36621 356.244 8.36621 279.5V0H41.3662V279.475Z';
  const mass = (d, fill, t) => `<g transform="${t}"><path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="2" vector-effect="non-scaling-stroke"/></g>`;
  // The curtains hang behind the crown, their squared tops tucked under it
  // (and off the screen's edges); the crown's carved rim drapes over them
  const canopy = mass(CURTAIN, C.yellowGreen, 'translate(-36 300) scale(0.5)')
    + mass(CURTAIN, C.yellowGreen, 'translate(438 300) scale(-0.5 0.5)')
    + mass(DOME, C.forest, 'translate(9 110) scale(0.85)');
  const trunk = `<g transform="translate(150 330) scale(0.71)"><path d="${TRUNK}" fill="${INK}"/></g>`;

  // A leaf: pointed at both ends, turned a degrees
  const leaf = (x, y, r, a, fill) => `<path d="M0 ${-r}Q${r * 0.75} 0 0 ${r}Q${-r * 0.75} 0 0 ${-r}Z" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)})" fill="${fill}" stroke="${INK}" stroke-width="${LINE}"/>`;
  // A four-pointed sparkle, as on the cards
  const sparkle = (x, y, r) => `<path d="M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z" fill="${C.white}" stroke="${INK}" stroke-width="${LINE}"/>`;

  // Willow strands: a line swaying down from the canopy, leaves either side
  const STRANDS = [
    [168, 388, 150], [206, 392, 104], [242, 400, 168], [300, 450, 126], [356, 470, 146],
    [30, 512, 118], [92, 538, 146], [130, 498, 96], [386, 490, 106], [264, 428, 86],
  ];
  let strands = '';
  for (const [x, y, len] of STRANDS) {
    const sway = 5 + rand() * 4;
    strands += `<path d="M${x} ${y}q${sway.toFixed(1)} ${(len / 2).toFixed(1)} 0 ${len}" fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>`;
    for (let t = 0.22; t < 0.98; t += 0.24) {
      const px = x + sway * Math.sin(Math.PI * t) * 0.75 + (t * 400 % 2 < 1 ? 4 : -4);
      strands += leaf(px, y + len * t, 5.5 + rand() * 2, -18 + rand() * 36, rand() < 0.7 ? C.yellowGreen : C.forest);
    }
  }
  // A few big leaves resting on the canopy itself
  let leaves = '';
  for (const [x, y] of [[90, 200], [200, 170], [300, 210], [48, 420], [355, 400], [150, 480], [260, 500], [110, 330], [295, 330], [180, 250], [250, 300], [330, 300], [60, 300], [140, 390], [230, 430], [320, 380], [200, 540], [100, 540], [300, 520]]) {
    leaves += leaf(x, y, 12 + rand() * 6, rand() * 180, rand() < 0.5 ? C.forest : C.yellowGreen);
  }

  // The hill, with little mounds resting on it as in the reference
  const hill = `<path d="M-10 812Q100 770 201 776Q302 770 412 812L412 884L-10 884Z" fill="${C.yellowGreen}" stroke="${INK}" stroke-width="${LINE}"/>`
    + `<path d="M28 806Q52 764 90 798" fill="${C.forest}" stroke="${INK}" stroke-width="${LINE}"/>`
    + `<path d="M318 798Q352 760 384 800" fill="${C.forest}" stroke="${INK}" stroke-width="${LINE}"/>`
    + `<path d="M120 794Q140 772 162 790" fill="${C.yellowGreen}" stroke="${INK}" stroke-width="${LINE}"/>`;
  const sparkles = [[22, 704, 8], [382, 700, 10], [48, 764, 5], [352, 760, 6]].map((s) => sparkle(...s)).join('');

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
    <rect width="${W}" height="${H}" fill="${C.sky}"/>
    ${sparkles}${trunk}${canopy}${leaves}${strands}${hill}
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
