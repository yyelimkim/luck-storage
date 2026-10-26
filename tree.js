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
  // invisible hit area, since the slips are small. Each is its own little
  // svg, swinging from its string's top as a whole (drawn once, then just
  // turned), so swaying slips never make the tree redraw.
  function hung([x, y, kind], fill, data) {
    const t = { ...TAGS[kind], w: TAGS[kind].w * SLIP_SCALE, h: TAGS[kind].h * SLIP_SCALE };
    const delay = (-rand() * 4).toFixed(2);
    const left = x - t.w / 2;
    const h = TAG_DROP + t.h + 26;
    return `<svg class="tree--wish" ${data} data-fill="${fill}" tabindex="0" role="button" aria-label="Read a wish"
      viewBox="${x - 22} ${y - 10} 44 ${h}" width="44" height="${h}" overflow="visible"
      style="left: ${x - 22}px; top: ${y - 10}px; animation-delay: ${delay}s">
      <rect x="${x - 22}" y="${y - 10}" width="44" height="${h}" fill="transparent"/>
      <path d="M${x} ${y}V${y + STRING}" stroke="#272727" stroke-width="0.5"/>
      <image class="tree--paper" href="${t.src}" x="${left}" y="${y + TAG_DROP}" width="${t.w}" height="${t.h}"/>
    </svg>`;
  }
  const strips = HANGS.map((hang, i) => hung(hang, C.white, `data-wish="${i}"`)).join('');

  // Lift a moving part out of a layer's drawing into a little svg of its own,
  // in the same place, so it moves as a whole (drawn once, then just turned
  // or faded) and the big drawing behind it can stay still. `pad` leaves
  // room round it (a blur's spread).
  function liftOut(layer, g, cls, pad) {
    const root = layer.querySelector('svg');
    const rr = root.getBoundingClientRect();
    const k = rr.width / W || 1;
    const b = g.getBoundingClientRect();
    const x = (b.left - rr.left) / k - pad;
    const y = (b.top - rr.top) / k - pad;
    const w = b.width / k + pad * 2;
    const h = b.height / k + pad * 2;
    const m = root.getScreenCTM().inverse().multiply(g.getScreenCTM());
    const NS = 'http://www.w3.org/2000/svg';
    const out = document.createElementNS(NS, 'svg');
    out.setAttribute('class', cls);
    out.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
    out.setAttribute('width', w);
    out.setAttribute('height', h);
    out.setAttribute('overflow', 'visible');
    Object.assign(out.style, { left: `${x}px`, top: `${y}px` });
    // where the light swings from: the frame's top left
    out.style.setProperty('--ox', `${-x}px`);
    out.style.setProperty('--oy', `${-y}px`);
    const defs = root.querySelector('defs');
    if (defs) out.appendChild(defs.cloneNode(true));
    const place = document.createElementNS(NS, 'g');
    place.setAttribute('transform', `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`);
    const copy = g.cloneNode(true);
    copy.removeAttribute('transform');
    copy.removeAttribute('id');
    place.appendChild(copy);
    out.appendChild(place);
    layer.appendChild(out);
    g.remove();
    return out;
  }

  // The layers can only be measured once the Wish Tree is on screen: till
  // then, what's to be done with them waits for it
  const waiting = [];
  function whenShown(layer, fn) {
    if (layer.getBoundingClientRect().width) { fn(); return; }
    waiting.push([layer, fn]);
  }
  new MutationObserver(() => {
    requestAnimationFrame(() => {
      for (let i = waiting.length - 1; i >= 0; i--) {
        const [layer, fn] = waiting[i];
        if (layer.getBoundingClientRect().width) { waiting.splice(i, 1); fn(); }
      }
    });
  }).observe(document.getElementById('stage'), { attributes: true, attributeFilter: ['data-view'] });

  const scene = document.getElementById('tree-scene');
  scene.innerHTML = `<div class="tree--art">
    <div class="tree--layer" data-layer="back"></div>
    <div class="tree--slips"><div class="tree--wishes">${strips}</div></div>
    <div class="tree--layer" data-layer="front" aria-hidden="true"></div>
    <div class="tree--layer" data-layer="light" aria-hidden="true"></div>
    <div class="tree--sun" aria-hidden="true"></div>
  </div>`;
  // Each layer's ids get its own prefix, since the three exports share names
  for (const name of LAYERS) {
    fetch(`assets/wishtree/${name}.svg?v=2`).then((r) => r.text()).then((svg) => {
      const layer = scene.querySelector(`[data-layer="${name}"]`);
      layer.innerHTML = svg
        .replace(/id="([^"]+)"/g, `id="${name}-$1"`)
        .replace(/url\(#([^)]+)\)/g, `url(#${name}-$1)`);
      whenShown(layer, () => {
        // The hanging strands (a stem line with leaves down it) drift from
        // their tops, each in its own time
        layer.querySelectorAll('g').forEach((g) => {
          if (!g.querySelector(':scope > line')) return;
          const w = liftOut(layer, g, 'tree--strand', 4);
          w.style.animationDelay = `${(-rand() * 6).toFixed(2)}s`;
          w.style.animationDuration = `${(4.5 + rand() * 3).toFixed(2)}s`;
        });
        // Each beam of the moving light sways and breathes on its own
        layer.querySelectorAll('[id="light-Vector"], [id="light-Vector_2"], [id="light-light"]').forEach((b, i) => {
          const w = liftOut(layer, b, 'tree--beam', 80);
          w.style.animationDuration = `${[4.5, 6, 7.5][i]}s, ${[3.2, 4.4, 5.6][i]}s`;
        });
        // what's left of the drawing never moves: drawn once and kept
        layer.classList.add('is-still');
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
  const titleEl = document.getElementById('wish-title');
  // Put a wish's words on the open slip
  function fill(g) {
    const own = g.dataset.own != null;
    text.textContent = own ? mine[Number(g.dataset.own)].text : WISHES[Number(g.dataset.wish) % WISHES.length];
    fromEl.textContent = own ? 'Anonymous · yours' : 'Anonymous';
    // numbered as the arrows go, left to right
    titleEl.textContent = own ? 'Your wish' : `Wish ${inOrder().indexOf(g) + 1}`;
    slip.classList.remove('is-twist', 'is-pressing');
    setTrace(0);
    slip.style.setProperty('--paper', g.dataset.fill);
  }
  // Where a wish's strip sits with the tree not zoomed, and the tree leaning
  // in towards it
  function lean(g) {
    const paper = g.querySelector('.tree--paper');
    const zoomed = scene.classList.contains('is-zoomed');
    scene.style.transition = 'none';
    scene.classList.remove('is-zoomed');
    const box = toStage(paper.getBoundingClientRect());
    const sb = scene.getBoundingClientRect(), pb = paper.getBoundingClientRect();
    const k = sb.width / scene.offsetWidth;
    if (zoomed) scene.classList.add('is-zoomed');
    void scene.offsetWidth;
    scene.style.transition = '';
    scene.style.transformOrigin = `${(pb.left + pb.width / 2 - sb.left) / k}px ${(pb.top + pb.height / 2 - sb.top) / k}px`;
    scene.classList.add('is-zoomed');
    return box;
  }
  // The wishes left to right, as the arrows and swipes go through them
  const inOrder = () => [...scene.querySelectorAll('.tree--wish')]
    .map((g) => [g, g.querySelector('.tree--paper').getBoundingClientRect().left])
    .sort((a, b) => a[1] - b[1]).map(([g]) => g);
  function openWish(g) {
    fill(g);
    reader.classList.add('is-open');
    stageEl.classList.add('is-reading');
    reader.setAttribute('aria-hidden', 'false');
    from = { g, box: lean(g) };
    showSent(key());
    setUpCount();
    g.style.visibility = 'hidden';
    const to = toStage(slip.getBoundingClientRect());
    slip.animate([{ transform: `${transformFrom(from.box, to)} rotate(0deg)`, opacity: 0.9 },
      { transform: 'none', opacity: 1 }], OPTS);
    reader.querySelector('.wish--close').focus({ preventScroll: true, focusVisible: false });
  }
  function closeWish() {
    if (!from) return;
    stopHold();
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
  // Hold an open wish to send it your luck (460:303): a white outline traces
  // round the slip from the bottom middle, up both sides; when the two meet
  // at the top the slip spins, goes back on the tree, and the luck lands on it
  const HOLD_MS = 1300;
  const hold = document.getElementById('wish-hold');
  const sent = new Set();
  let traced = 0;
  let raf = 0;
  const key = () => from && (from.g.dataset.own != null ? `own${from.g.dataset.own}` : `w${from.g.dataset.wish}`);
  function setTrace(k) { traced = k; slip.style.setProperty('--trace', k.toFixed(4)); }
  function showSent(k) {
    const done = sent.has(k);
    slip.classList.toggle('is-sent', done);
    hold.classList.remove('is-holding');
    hold.textContent = done ? 'Your luck is sent ✦' : 'Hold the slip to send your luck';
  }
  // run the trace towards a target at a pace, then call back
  function runTrace(to, ms, done) {
    cancelAnimationFrame(raf);
    const from0 = traced;
    const t0 = performance.now();
    const dur = Math.max(1, ms * Math.abs(to - from0));
    const step = (now) => {
      const x = Math.min(1, (now - t0) / dur);
      setTrace(from0 + (to - from0) * x);
      if (x < 1) raf = requestAnimationFrame(step);
      else if (done) done();
    };
    raf = requestAnimationFrame(step);
  }
  function stopHold() { cancelAnimationFrame(raf); holding = false; }
  let holding = false;
  let swipe = null;  // a press on the slip: a hold, unless it turns into a swipe
  let spinning = false;
  slip.addEventListener('pointerdown', (e) => {
    if (!from || spinning) return;
    e.preventDefault();
    Sounds.unlock();
    slip.setPointerCapture?.(e.pointerId);
    swipe = { x: e.clientX, y: e.clientY, dx: 0, on: false };
    if (sent.has(key())) return;
    holding = true;
    hold.classList.add('is-holding');
    hold.textContent = 'Hold...';
    runTrace(1, HOLD_MS, () => {
      if (!holding || !from) return;
      holding = false;
      swipe = null;
      spinning = true;
      const k = key();
      sent.add(k);
      slip.classList.add('is-sent');
      slip.classList.remove('is-twist');
      void slip.offsetWidth;
      slip.classList.add('is-twist');  // it spins
      Sounds.chime();
      hold.classList.remove('is-holding');
      hold.textContent = 'Your luck is sent ✦';
      // after the spin the slip stays; the luck clover comes up above it,
      // then shrinks away up out of the frame, off with the luck
      setTimeout(() => { spinning = false; cloverAway(); }, 950);
    });
  });
  // let go of a hold too soon: the line runs back, the words come back
  function dropHold() {
    if (!holding) return;
    holding = false;
    runTrace(0, 500);
    showSent(key());
  }
  const px = () => stageEl.getBoundingClientRect().width / stageEl.offsetWidth;
  slip.addEventListener('pointermove', (e) => {
    if (!swipe) return;
    const dx = (e.clientX - swipe.x) / px();
    const dy = (e.clientY - swipe.y) / px();
    // moved sideways: it's a swipe, not a hold
    if (!swipe.on && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { swipe.on = true; dropHold(); }
    if (!swipe.on) return;
    swipe.dx = dx;
    slip.style.translate = `${dx}px 0`;
    slip.style.rotate = `${dx / 40}deg`;
  });
  const letGo = () => {
    dropHold();
    if (!swipe) return;
    const { on, dx } = swipe;
    swipe = null;
    if (!on) return;
    if (Math.abs(dx) > 60 && step(dx < 0 ? 1 : -1, dx)) return;
    // not far enough: back to the middle
    slip.animate([{ translate: `${dx}px 0`, rotate: `${dx / 40}deg` }, { translate: '0 0', rotate: '0deg' }],
      { duration: 300, easing: 'cubic-bezier(0.3, 0.8, 0.2, 1)' });
    slip.style.translate = '';
    slip.style.rotate = '';
  };
  slip.addEventListener('pointerup', letGo);
  slip.addEventListener('pointercancel', letGo);

  // --- Going through the wishes: the arrows under the slip, or a swipe -----
  const prev = document.getElementById('wish-prev');
  const nextBtn = document.getElementById('wish-next');
  const count = document.getElementById('wish-count');
  let order = [];
  function drawCount() {
    const i = order.indexOf(from && from.g);
    count.textContent = `Wish ${i + 1} of ${order.length}`;
    prev.disabled = i <= 0;
    nextBtn.disabled = i >= order.length - 1;
  }
  function setUpCount() { order = inOrder(); drawCount(); }
  prev.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  // To the wish `by` along (1 next, -1 back); the slip slides out the way it
  // was going (from a swipe's `dx`) and the next comes in from the other side
  function step(by, dx = 0) {
    if (!from || spinning) return false;
    const i = order.indexOf(from.g);
    const j = i + by;
    if (j < 0 || j >= order.length) return false;
    go(order[j], by, dx);
    return true;
  }
  function go(g, by, dx = 0) {
    stopHold();
    from.g.style.visibility = '';
    fill(g);
    from = { g, box: lean(g) };
    g.style.visibility = 'hidden';
    showSent(key());
    drawCount();
    Sounds.tap();
    slip.style.translate = '';
    slip.style.rotate = '';
    slip.getAnimations().forEach((a) => a.cancel());
    const out = by > 0 ? -1 : 1;
    slip.animate([
      { translate: `${dx || out * 40}px 0`, rotate: `${(dx || out * 40) / 40}deg`, opacity: dx ? 1 : 0.4 },
      { translate: `${out * 120}px 0`, rotate: `${out * 3}deg`, opacity: 0, offset: 0.35 },
      { translate: `${-out * 120}px 0`, rotate: `${-out * 3}deg`, opacity: 0, offset: 0.36 },
      { translate: '0 0', rotate: '0deg', opacity: 1 },
    ], { duration: 520, easing: 'cubic-bezier(0.3, 0.8, 0.2, 1)' });
  }
  addEventListener('keydown', (e) => {
    if (!from) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });


  // The clover earned from Home's cards, over the slip: it pops up above
  // it, then turns small and flies up out of the frame
  const clover = document.getElementById('wish-clover');
  function cloverAway() {
    clover.classList.remove('is-away');
    void clover.offsetWidth;
    clover.classList.add('is-away');
    Sounds.shimmer();
  }
  clover.addEventListener('animationend', () => clover.classList.remove('is-away'));

  slip.addEventListener('contextmenu', (e) => e.preventDefault());
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
