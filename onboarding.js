// Onboarding, after the splash: welcome (three slides) → an account (create
// one, or log in) → your name → your birthday → all set, then Home. Signing
// up takes all the steps; logging in goes straight to all set.
//
// This is a demo: nothing is sent anywhere. Pressing / fills the step you're
// on with demo details (the hint sits under the phone, outside its screen).
// Your name goes on the profile and your birthday seeds Daily Fortune.

(() => {
  const ob = document.getElementById('ob');
  if (!ob) return;
  const root = document.documentElement;
  const pages = Object.fromEntries([...ob.querySelectorAll('.ob--page')].map((p) => [p.dataset.page, p]));
  const fill = ob.querySelector('.ob--fill');
  const bar = ob.querySelector('.ob--bar');
  const DEMO = { email: 'yelim@luckcorner.app', password: 'fourleaf8', name: 'Yelim', birthday: '2006-04-15' };

  let mode = 'signup';  // or 'login'
  let path = [];        // the steps taken, for the way back
  const STEPS = { signup: ['account', 'name', 'birthday'], login: ['account'] };

  root.classList.add('is-onboarding');

  function show(step, back = false) {
    const from = ob.dataset.step;
    if (from === step) return;
    const old = pages[from];
    old.classList.remove('is-on');
    old.classList.toggle('is-back', !back);
    const next = pages[step];
    next.classList.remove('is-back');
    if (back) next.classList.add('is-back');
    void next.offsetWidth;
    next.classList.add('is-on');
    next.classList.remove('is-back');
    ob.dataset.step = step;
    // how far along: a third for each of account, name, birthday
    const steps = STEPS[mode];
    const i = steps.indexOf(step);
    bar.style.visibility = mode === 'login' ? 'hidden' : '';
    fill.style.setProperty('--done', `${((i + 1) / steps.length) * 100}%`);
    bar.setAttribute('aria-valuenow', String(i + 1));
    // the first field ready to type in (not on a phone, where it'd pop the keyboard)
    const input = next.querySelector('input');
    if (input && root.classList.contains('is-preview')) setTimeout(() => input.focus({ preventScroll: true }), 350);
    check(next);
  }
  function go(step) { path.push(ob.dataset.step); show(step); }
  ob.querySelector('.ob--back').addEventListener('click', () => { if (path.length) show(path.pop(), true); });
  pages.welcome.classList.add('is-on');

  // --- Welcome: the slides and their dots
  const slides = document.getElementById('ob-slides');
  const dots = [...ob.querySelectorAll('.ob--dots button')];
  slides.addEventListener('scroll', () => {
    const i = Math.round(slides.scrollLeft / slides.clientWidth);
    dots.forEach((d, j) => d.setAttribute('aria-selected', String(i === j)));
  }, { passive: true });
  dots.forEach((d, j) => d.addEventListener('click', () => slides.scrollTo({ left: j * slides.clientWidth, behavior: 'smooth' })));
  // and they turn by themselves till you touch them
  let auto = setInterval(() => {
    const i = Math.round(slides.scrollLeft / slides.clientWidth);
    slides.scrollTo({ left: ((i + 1) % dots.length) * slides.clientWidth, behavior: 'smooth' });
  }, 3200);
  slides.addEventListener('pointerdown', () => clearInterval(auto), { once: true });

  // --- The account: create one, or log in
  const title = document.getElementById('ob-account-title');
  const sub = document.getElementById('ob-account-sub');
  const swap = document.getElementById('ob-switch');
  const password = pages.account.querySelector('[name="password"]');
  function setMode(m) {
    mode = m;
    const login = m === 'login';
    title.textContent = login ? 'Welcome back' : 'Create your account';
    sub.textContent = login ? 'Log in to pick up your luck where you left it.' : 'Keep your luck safe across devices.';
    pages.account.querySelector('[type="submit"]').textContent = login ? 'Log in' : 'Continue';
    swap.innerHTML = login ? 'New here? <u>Create an account</u>' : 'Already have an account? <u>Log in</u>';
    password.autocomplete = login ? 'current-password' : 'new-password';
    password.placeholder = login ? 'Your password' : 'At least 8 characters';
    check(pages.account);
  }
  swap.addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));
  ob.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    const to = b.dataset.go;
    if (to === 'signup' || to === 'login') { setMode(to); go('account'); }
    if (to === 'apple') { fillIn(pages.account); next('account'); }
    if (to === 'home') finish();
  });

  // --- Each form: its button wakes once it's filled in properly
  const valid = {
    account: (f) => /\S+@\S+\.\S+/.test(f.elements.email.value) && f.elements.password.value.length >= (mode === 'login' ? 1 : 8),
    name: (f) => f.elements.name.value.trim().length > 0,  // (f.name is the form's own name)
    birthday: (f) => !!f.elements.birthday.value,
  };
  function check(page) {
    const btn = page.querySelector('[type="submit"]');
    if (btn) btn.disabled = !valid[page.dataset.page](page);
  }
  ['account', 'name', 'birthday'].forEach((step) => {
    const f = pages[step];
    f.addEventListener('input', () => check(f));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (valid[step](f)) next(step);
    });
  });
  function next(step) {
    const steps = STEPS[mode];
    const i = steps.indexOf(step);
    go(i < steps.length - 1 ? steps[i + 1] : 'done');
  }

  // --- All set: your name on the profile, your birthday for the fortune
  function finish() {
    const name = (mode === 'login' ? DEMO.name : pages.name.elements.name.value.trim()) || DEMO.name;
    const nameEl = document.querySelector('.profile--name');
    if (nameEl && nameEl.firstChild) nameEl.firstChild.textContent = `${name} `;
    const born = mode === 'login' ? null : pages.birthday.elements.birthday.value;
    if (born && typeof birthday !== 'undefined') {
      birthday = born;  // mobile.js's, read by Daily Fortune
      try { localStorage.setItem('birthday', born); } catch (e) { /* kept for this visit only */ }
    }
    ob.classList.add('is-done');
    root.classList.remove('is-onboarding');
    clearInterval(auto);
    setTimeout(() => ob.remove(), 600);
  }
  // the done step's words, as you arrive
  new MutationObserver(() => {
    if (ob.dataset.step !== 'done') return;
    const name = mode === 'login' ? DEMO.name : pages.name.elements.name.value.trim();
    document.getElementById('ob-done-title').textContent = mode === 'login' ? `Welcome back, ${name}` : `You're all set, ${name}`;
    document.getElementById('ob-done-sub').textContent = mode === 'login'
      ? 'Your luck is right where you left it.'
      : 'Here are 12 clovers to start with.';
    if (window.Sounds) Sounds.claim();
  }).observe(ob, { attributes: true, attributeFilter: ['data-step'] });

  // --- Demo: / fills in the step you're on
  function fillIn(page) {
    page.querySelectorAll('input').forEach((input) => {
      if (DEMO[input.name] != null) input.value = DEMO[input.name];
    });
    if (page.querySelector('[type="submit"]')) check(page);
  }
  addEventListener('keydown', (e) => {
    if (e.key !== '/' || !root.classList.contains('is-onboarding')) return;
    e.preventDefault();
    const page = pages[ob.dataset.step];
    if (ob.dataset.step === 'welcome') { setMode('signup'); go('account'); return; }
    fillIn(page);
  });
})();
