// Onboarding, after the splash: welcome (one screen) → an account (create
// one, or log in) → your name → your birthday → all set, then Home. Signing
// up takes all the steps; logging in goes straight to all set.
//
// This is a demo: nothing is sent anywhere, but what you sign up with is
// kept on this phone (store, in mobile.js): your email, your name, your
// birthday, and your password only as a hash, never itself. Logging in
// checks against that and brings your name and birthday back. Pressing /
// fills the step you're on with demo details, and S skips onboarding (the
// hint sits under the phone, outside its screen).
// Your name goes on the profile and your birthday seeds Daily Fortune.

(() => {
  const ob = document.getElementById('ob');
  if (!ob) return;
  const root = document.documentElement;
  // Returning (this browser has been through it before): straight to Home,
  // with the name they gave. ?onboarding brings it back on cue (and O, in
  // the desktop preview, reloads with it).
  const ON_CUE = /[?&]onboarding(?:[=&?]|$)/.test(location.search);
  let seen = false;
  try { seen = localStorage.getItem('onboarded') === '1'; } catch (e) { /* no storage: show it */ }
  addEventListener('keydown', (e) => {
    if ((e.key === 'o' || e.key === 'O') && root.classList.contains('is-preview') && !root.classList.contains('is-onboarding')
      && !(e.target.closest && e.target.closest('input, textarea'))) location.search = '?onboarding';
  });
  if (seen && !ON_CUE) {
    let name = '';
    try { name = localStorage.getItem('name') || ''; } catch (e) { /* the default name stays */ }
    const nameEl = document.querySelector('.profile--name');
    if (name && nameEl && nameEl.firstChild) nameEl.firstChild.textContent = `${name} `;
    ob.remove();
    return;
  }
  const pages = Object.fromEntries([...ob.querySelectorAll('.ob--page')].map((p) => [p.dataset.page, p]));
  const fill = ob.querySelector('.ob--fill');
  const bar = ob.querySelector('.ob--bar');
  const DEMO = { email: 'yelim@luckcorner.app', password: 'fourleaf8', name: 'Yelim', birthday: '2006-04-15' };

  let mode = 'signup';  // or 'login'
  // The accounts made on this phone, by email; and who's signing up or in
  const accounts = () => store.get('accounts', {});
  let pending = null;   // signing up: { email, pw }
  let who = null;       // logged in: { name, birthday }
  async function hash(pw) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`luck-corner:${pw}`));
    return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let path = [];        // the steps taken, for the way back
  const STEPS = { signup: ['account', 'name', 'birthday'], login: ['account'] };

  root.classList.add('is-onboarding');
  // the count starts empty: the first clovers come in at the end (shown
  // again on cue to someone who's been before, their clovers stay as they are)
  const START_LUCK = Number(countNum.textContent);
  if (!seen) {
    luck = 0;
    countNum.textContent = '0';
  }

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

  // --- Welcome: every card in a ring, turning (mobile.css)
  const ring = document.getElementById('ob-ring');
  const R = 340;
  ring.style.setProperty('--r', `${R}px`);
  ring.innerHTML = IMAGES.map((name, i) =>
    `<img src="${englishSrc(name)}" alt="" style="--a:${(i * 360) / IMAGES.length}deg">`).join('');

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
    swap.innerHTML = login
      ? '<span class="ob--muted">New here?</span> <u>Create an account</u>'
      : '<span class="ob--muted">Already have an account?</span> <u>Log in</u>';
    password.autocomplete = login ? 'current-password' : 'new-password';
    password.placeholder = login ? 'Your password' : 'At least 8 characters';
    // logging in, the email you used last time is already there
    const email = pages.account.elements.email;
    if (login && !email.value) email.value = store.get('email', '');
    say('');
    check(pages.account);
  }
  swap.addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));
  ob.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    const to = b.dataset.go;
    if (to === 'signup' || to === 'login') { setMode(to); go('account'); }
    if (to === 'apple') { fillIn(pages.account); account(pages.account).then((ok) => ok && next('account')); }
    if (to === 'home') finish('start');
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
    f.addEventListener('input', () => { check(f); if (step === 'account') say(''); });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!valid[step](f)) return;
      if (step === 'account' && !(await account(f))) return;
      next(step);
    });
  });

  // A word under the password when the account doesn't check out
  const note = document.createElement('p');
  note.className = 'ob--note';
  note.setAttribute('role', 'alert');
  password.closest('.ob--field').after(note);
  function say(text) { note.textContent = text; }

  // Signing up: the email's not taken here. Logging in: the account's here
  // and the password matches (or it's the demo's)
  async function account(f) {
    const email = f.elements.email.value.trim().toLowerCase();
    const pw = await hash(f.elements.password.value);
    const acc = accounts()[email];
    if (mode === 'signup') {
      if (acc) { say('There’s already an account with this email. Log in instead.'); return false; }
      pending = { email, pw };
      return true;
    }
    if (acc) {
      if (acc.pw !== pw) { say('That password doesn’t match this account.'); return false; }
      who = { name: acc.name, birthday: acc.birthday };
    } else if (email === DEMO.email) {
      who = { name: DEMO.name, birthday: DEMO.birthday };
    } else {
      say('No account with that email on this phone yet.');
      return false;
    }
    store.set('email', email);
    return true;
  }
  function next(step) {
    const steps = STEPS[mode];
    const i = steps.indexOf(step);
    go(i < steps.length - 1 ? steps[i + 1] : 'done');
  }

  // --- All set: your name on the profile, your birthday for the fortune
  function finish(how) {
    const name = (mode === 'login' ? who?.name : pages.name.elements.name.value.trim()) || DEMO.name;
    const nameEl = document.querySelector('.profile--name');
    if (nameEl && nameEl.firstChild) nameEl.firstChild.textContent = `${name} `;
    const born = mode === 'login' ? who?.birthday : pages.birthday.elements.birthday.value;
    if (born && typeof birthday !== 'undefined') {
      birthday = born;  // mobile.js's, read by Daily Fortune
      try { localStorage.setItem('birthday', born); } catch (e) { /* kept for this visit only */ }
    }
    // a new account is kept on this phone, to log back into
    if (mode === 'signup' && pending) {
      store.set('accounts', { ...accounts(), [pending.email]: { pw: pending.pw, name, birthday: born || null } });
      store.set('email', pending.email);
    }
    // remembered: next time, straight to Home
    try {
      localStorage.setItem('onboarded', '1');
      localStorage.setItem('name', name);
    } catch (e) { /* this visit only */ }
    ob.classList.add('is-done');
    root.classList.remove('is-onboarding');
    // the clover flies up into the count, as luck does, and the count rolls up
    const clover = pages.done.querySelector('.ob--done img');
    if (seen) {
      // been here before: their clovers as they were
    } else if (how === 'start') {
      flyClover(clover, true).then(() => changeLuck(START_LUCK));
    } else {
      luck = START_LUCK;
      countNum.textContent = String(START_LUCK);
      saveLuck();
    }
    setTimeout(() => ob.remove(), 600);
  }
  // the done step's words, as you arrive
  new MutationObserver(() => {
    if (ob.dataset.step !== 'done') return;
    const name = mode === 'login' ? (who?.name || DEMO.name) : pages.name.elements.name.value.trim();
    document.getElementById('ob-done-title').textContent = mode === 'login' ? `Welcome back, ${name}` : `You're all set, ${name}`;
    document.getElementById('ob-done-sub').textContent = mode === 'login'
      ? 'Your luck is right where you left it.'
      : 'Here are 3 clovers to start with.';
    Sounds.claim();
  }).observe(ob, { attributes: true, attributeFilter: ['data-step'] });

  // --- Demo: / fills in the step you're on
  function fillIn(page) {
    page.querySelectorAll('input').forEach((input) => {
      if (DEMO[input.name] != null) input.value = DEMO[input.name];
    });
    if (page.querySelector('[type="submit"]')) check(page);
  }
  addEventListener('keydown', (e) => {
    if (!root.classList.contains('is-onboarding')) return;
    // S skips onboarding altogether (unless you're typing in a field)
    if ((e.key === 's' || e.key === 'S') && !(e.target.closest && e.target.closest('input'))) {
      e.preventDefault();
      finish();
      return;
    }
    if (e.key !== '/') return;
    e.preventDefault();
    const page = pages[ob.dataset.step];
    if (ob.dataset.step === 'welcome') { setMode('signup'); go('account'); return; }
    fillIn(page);
  });
})();
