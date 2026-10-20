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

  // The scene is the Figma frame (410:208), in three layers: everything
  // behind the slips, the front part of the trees (which the slips hang
  // behind), and the moving light over it all. Each is inline SVG so its
  // blend modes mix with the layers under it, as they do in Figma.
  const LAYERS = ['back', 'front', 'light'];
  // The slips (Figma 426:4296): four hand-drawn tags, each hung on a string
  const TAGS = {
    a: { src: 'assets/wishtree/slip-217.svg', w: 11.9, h: 21.6 },
    b: { src: 'assets/wishtree/slip-216.svg', w: 15.1, h: 22.7 },
    c: { src: 'assets/wishtree/slip-220.svg', w: 15.1, h: 33.4 },
    d: { src: 'assets/wishtree/slip-219.svg', w: 15.1, h: 41 },
  };
  // Where each slip hangs in the frame: the top of its string on a branch,
  // and which tag
  const HANGS = [
    [308.2, 331.6, 'a'], [29.9, 460, 'c'], [264, 354.3, 'c'], [300.7, 516.1, 'b'], [148.6, 548.5, 'b'],
    [191.7, 406.1, 'c'], [94.6, 473, 'd'], [332, 462.2, 'd'], [145.3, 447.1, 'a'], [49.3, 440.6, 'c'],
  ];
  // Where wishes written here go, in turn: the underside of the long left
  // branch, found clear of the slips already there. Past these, new wishes
  // hang over older ones.
  const SPARE = [
    [62, 514, 'b'], [82, 533, 'c'], [102, 545, 'a'], [122, 551, 'd'], [166, 554, 'c'], [186, 554, 'b'], [206, 559, 'a'],
  ];
  const STRING = 14.7;
  const TAG_DROP = 12.9;  // from the string's top to the tag's
  const SLIP_SCALE = 1.25;  // the tags, a touch bigger than in the frame

  // A slip on its string from (x, y): the string, the tag, and a wider
  // invisible hit area, since the slips are small
  function hung([x, y, kind], fill, data) {
    const t = { ...TAGS[kind], w: TAGS[kind].w * SLIP_SCALE, h: TAGS[kind].h * SLIP_SCALE };
    const delay = (-rand() * 4).toFixed(2);
    const left = x - t.w / 2;
    return `<g class="tree--wish" ${data} data-fill="${fill}" tabindex="0" role="button" aria-label="Read a wish"
      style="transform-origin: ${x}px ${y}px; animation-delay: ${delay}s">
      <rect x="${x - 14}" y="${y - 4}" width="28" height="${TAG_DROP + t.h + 10}" fill="transparent"/>
      <path d="M${x} ${y}V${y + STRING}" stroke="#272727" stroke-width="0.5"/>
      <image class="tree--paper" href="${t.src}" x="${left}" y="${y + TAG_DROP}" width="${t.w}" height="${t.h}"/>
    </g>`;
  }
  const strips = HANGS.map((hang, i) => hung(hang, C.white, `data-wish="${i}"`)).join('');

  const scene = document.getElementById('tree-scene');
  scene.innerHTML = `<div class="tree--art">
    <div class="tree--layer" data-layer="back"></div>
    <svg class="tree--slips" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><g class="tree--wishes">${strips}</g></svg>
    <div class="tree--layer" data-layer="front" aria-hidden="true"></div>
    <div class="tree--layer" data-layer="light" aria-hidden="true"></div>
  </div>`;
  // Each layer's ids get its own prefix, since the three exports share names
  for (const name of LAYERS) {
    fetch(`assets/wishtree/${name}.svg?v=2`).then((r) => r.text()).then((svg) => {
      const layer = scene.querySelector(`[data-layer="${name}"]`);
      layer.innerHTML = svg
        .replace(/id="([^"]+)"/g, `id="${name}-$1"`)
        .replace(/url\(#([^)]+)\)/g, `url(#${name}-$1)`);
      // The hanging strands (a stem line with leaves down it) drift from
      // their tops, each in its own time
      layer.querySelectorAll('g').forEach((g) => {
        if (!g.querySelector(':scope > line')) return;
        g.classList.add('tree--strand');
        g.style.animationDelay = `${(-rand() * 6).toFixed(2)}s`;
        g.style.animationDuration = `${(4.5 + rand() * 3).toFixed(2)}s`;
      });
      // Each beam of the moving light sways and breathes on its own
      layer.querySelectorAll('[id="light-Vector"], [id="light-Vector_2"], [id="light-light"]').forEach((b, i) => {
        b.classList.add('tree--beam');
        b.style.animationDuration = `${[4.5, 6, 7.5][i]}s, ${[3.2, 4.4, 5.6][i]}s`;
      });
    });
  }

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
    const paper = g.querySelector('.tree--paper');
    const own = g.dataset.own != null;
    text.textContent = own ? mine[Number(g.dataset.own)].text : WISHES[Number(g.dataset.wish) % WISHES.length];
    fromEl.textContent = own ? 'Anonymous · yours' : 'Anonymous';
    slip.style.setProperty('--paper', g.dataset.fill);
    reader.classList.add('is-open');
    stageEl.classList.add('is-reading');
    reader.setAttribute('aria-hidden', 'false');
    from = { g, box: toStage(paper.getBoundingClientRect()) };
    // The tree leans in towards the slip that was tapped
    const sb = scene.getBoundingClientRect(), pb = paper.getBoundingClientRect();
    const k = sb.width / scene.offsetWidth;
    scene.style.transformOrigin = `${(pb.left + pb.width / 2 - sb.left) / k}px ${(pb.top + pb.height / 2 - sb.top) / k}px`;
    scene.classList.add('is-zoomed');
    g.style.visibility = 'hidden';
    const to = toStage(slip.getBoundingClientRect());
    slip.animate([{ transform: `${transformFrom(from.box, to)} rotate(0deg)`, opacity: 0.9 },
      { transform: 'none', opacity: 1 }], OPTS);
    reader.querySelector('.wish--close').focus({ preventScroll: true, focusVisible: false });
  }
  function closeWish() {
    if (!from) return;
    const { g, box } = from;
    from = null;
    const to = toStage(slip.getBoundingClientRect());
    reader.classList.remove('is-open');
    stageEl.classList.remove('is-reading');
    scene.classList.remove('is-zoomed');
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
    const paper = g.querySelector('.tree--paper');
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
