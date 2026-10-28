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
  // Signed in, or in as a guest, before (in this browser): straight to Home,
  // with the name they gave. Logging out brings the welcome back.
  let seen = false;
  try { seen = ['1', 'guest'].includes(localStorage.getItem('onboarded')); } catch (e) { /* no storage: show it */ }
  // Demo: O brings onboarding back on cue, even signed in (for this one
  // load; your account and luck stay as they are)
  let onCue = false;
  try { onCue = sessionStorage.getItem('onboard-cue') === '1'; sessionStorage.removeItem('onboard-cue'); } catch (e) { /* no cue */ }
  addEventListener('keydown', (e) => {
    if ((e.key !== 'o' && e.key !== 'O') || (e.target.closest && e.target.closest('input, textarea'))) return;
    try { sessionStorage.setItem('onboard-cue', '1'); } catch (e2) { return; }
    location.reload();
  });
  if (seen && !onCue) {
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
  const DEMO = { email: 'yelim@luckcorner.app', password: 'fourleaf8', username: 'lucky4eva', name: 'Yelim', birthday: '2006-04-15' };

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
  const STEPS = { signup: ['account', 'verify', 'name', 'birthday'], login: ['account'] };
  // Asking the server (api/): null when it can't say (offline, or not set up)
  async function ask(url, opts) {
    try {
      const r = await fetch(url, opts);
      if ([404, 405, 501, 503].includes(r.status)) return null;  // no such server, or not set up
      return { status: r.status, ...(await r.json().catch(() => ({}))) };
    } catch (e) { return null; }
  }

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
    bar.setAttribute('aria-valuemax', String(steps.length));
    // the first field ready to type in (not on a phone, where it'd pop the keyboard)
    const input = next.querySelector('input');
    if (input && root.classList.contains('is-preview')) setTimeout(() => input.focus({ preventScroll: true }), 350);
    check(next);
  }
  function go(step) { path.push(ob.dataset.step); show(step); }
  ob.querySelector('.ob--back').addEventListener('click', () => { if (path.length) show(path.pop(), true); });
  pages.welcome.classList.add('is-on');
  // from guest mode's "Sign up" (or "Log in"): straight to the account
  let goTo = null;
  try { goTo = sessionStorage.getItem('onboard-go'); sessionStorage.removeItem('onboard-go'); } catch (e) { /* the welcome */ }

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
    if (login && !email.value) email.value = store.get('email', '') || store.get('last-email', '');
    say('');
    check(pages.account);
  }
  swap.addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));
  ob.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    const to = b.dataset.go;
    if (to === 'signup' || to === 'login') { setMode(to); go('account'); }
    if (to === 'apple') { fillIn(pages.account); pages.account.requestSubmit(); }
    if (to === 'home') finish('start');
    if (to === 'guest') asGuest();
  });

  // --- Each form: its button wakes once it's filled in properly
  const valid = {
    account: (f) => /\S+@\S+\.\S+/.test(f.elements.email.value) && f.elements.password.value.length >= (mode === 'login' ? 1 : 8),
    name: (f) => f.elements.name.value.trim().length > 0 && userFree === f.elements.username.value.trim().toLowerCase(),  // (f.name is the form's own name)
    verify: (f) => /^\d{6}$/.test(f.elements.code.value.trim()),
    birthday: (f) => !!f.elements.birthday.value,
  };
  function check(page) {
    const btn = page.querySelector('[type="submit"]');
    if (btn) btn.disabled = !valid[page.dataset.page](page);
  }
  ['account', 'verify', 'name', 'birthday'].forEach((step) => {
    const f = pages[step];
    f.addEventListener('input', () => { check(f); if (step === 'account') say(''); });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!valid[step](f)) return;
      const btn = f.querySelector('[type="submit"]');
      btn.disabled = true;
      try {
        if (step === 'account') {
          if (!(await account(f))) return;
          if (mode === 'signup') {
            // a code to the email, to show it's yours (straight on to your
            // name if verifying isn't set up)
            const sent = await sendCode();
            if (sent === false) return;
            go(sent ? 'verify' : 'name');
            return;
          }
        }
        if (step === 'verify' && !(await verifyCode(f))) return;
        next(step);
      } finally { check(f); }
    });
  });

  // A word under the password when the account doesn't check out
  const note = document.createElement('p');
  note.className = 'ob--note';
  note.setAttribute('role', 'alert');
  password.closest('.ob--field').after(note);
  // (with a way to log in instead, when the email's already got an account)
  function say(text, loginLink = false) {
    note.textContent = text;
    if (!loginLink) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Log in';
    b.addEventListener('click', () => setMode('login'));
    note.append(' ', b);
  }
  const TAKEN = 'There’s already an account with this email.';
  // is the email taken? this phone's accounts, then everyone's
  async function emailTaken(email) {
    if (accounts()[email] || email === DEMO.email) return true;
    const r = await ask(`/api/accounts?email=${encodeURIComponent(email)}`);
    return !!(r && r.taken);
  }
  // said as you type it, once it looks like an email
  let emailTimer = 0;
  pages.account.elements.email.addEventListener('input', () => {
    clearTimeout(emailTimer);
    if (mode !== 'signup') return;
    const email = pages.account.elements.email.value.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(email)) return;
    emailTimer = setTimeout(async () => {
      if (await emailTaken(email) && mode === 'signup' && pages.account.elements.email.value.trim().toLowerCase() === email) say(TAKEN, true);
    }, 450);
  });

  // --- Verify: a code to your email
  const vNote = document.getElementById('ob-verify-note');
  async function sendCode() {
    const email = pending.email;
    document.getElementById('ob-verify-sub').textContent = `We sent a 6-digit code to ${email}.`;
    const r = await ask('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    if (!r) return null;  // not set up: no verifying
    if (r.status === 200) { vNote.textContent = ''; pages.verify.elements.code.value = ''; return true; }
    say(r.error || 'The code couldn’t be sent. Try again.');
    return false;
  }
  async function verifyCode(f) {
    const r = await ask('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: pending.email, code: f.elements.code.value.trim() }) });
    if (r && r.ok) { vNote.textContent = ''; return true; }
    vNote.textContent = (r && r.error) || 'That code couldn’t be checked. Try again.';
    return false;
  }
  pages.verify.elements.code.addEventListener('input', () => { vNote.textContent = ''; });
  document.getElementById('ob-resend').addEventListener('click', async () => {
    const r = await ask('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: pending.email }) });
    vNote.classList.toggle('is-ok', !!(r && r.status === 200));
    vNote.textContent = r && r.status === 200 ? 'A new code is on its way.' : ((r && r.error) || 'The code couldn’t be sent. Try again.');
  });
  pages.verify.elements.code.addEventListener('input', () => vNote.classList.remove('is-ok'));

  // --- Username: 3 to 20 of a-z, 0-9, . and _; checked as you type that
  // no one has it (on this phone, then everyone)
  const uNote = document.getElementById('ob-user-note');
  const uField = pages.name.elements.username;
  let userFree = null;  // the name last found free
  let userTimer = 0;
  function sayUser(text, ok = false) { uNote.textContent = text; uNote.classList.toggle('is-ok', ok); }
  uField.addEventListener('input', () => {
    clearTimeout(userTimer);
    const name = uField.value.trim().toLowerCase();
    if (uField.value !== uField.value.toLowerCase()) uField.value = uField.value.toLowerCase();
    userFree = null;
    check(pages.name);
    if (!name) { sayUser(''); return; }
    if (!/^[a-z0-9._]{3,20}$/.test(name)) { sayUser('3 to 20 letters, numbers, . or _'); return; }
    sayUser('Checking…', true);
    userTimer = setTimeout(async () => {
      const here = Object.values(accounts()).some((a) => a.username === name) || name === DEMO.username;
      const r = here ? null : await ask(`/api/accounts?username=${encodeURIComponent(name)}`);
      if (uField.value.trim().toLowerCase() !== name) return;  // typed on since
      if (here || (r && r.taken)) { sayUser(`@${name} is taken`); return; }
      userFree = name;
      sayUser(`@${name} is available`, true);
      check(pages.name);
    }, 400);
  });

  // Signing up: the email's not taken here. Logging in: the account's here
  // and the password matches (or it's the demo's)
  async function account(f) {
    const email = f.elements.email.value.trim().toLowerCase();
    const pw = await hash(f.elements.password.value);
    const acc = accounts()[email];
    if (mode === 'signup') {
      if (await emailTaken(email)) { say(TAKEN, true); return false; }
      pending = { email, pw };
      return true;
    }
    if (acc) {
      if (acc.pw !== pw) { say('That password doesn’t match this account.'); return false; }
      who = { name: acc.name, username: acc.username, birthday: acc.birthday };
    } else if (email === DEMO.email) {
      who = { name: DEMO.name, username: DEMO.username, birthday: DEMO.birthday };
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

  // --- In as a guest: no account, straight to Home with the first clovers;
  // Settings has the way to sign up or log in later
  function asGuest() {
    Guest.start();
    luck = 3;  // a guest's first clovers, as anyone's
    saveLuck();
    // straight back in, everything drawn afresh from nothing (no splash)
    try { sessionStorage.setItem('no-splash', '1'); } catch (e) { /* it plays */ }
    location.reload();
  }

  // --- All set: your name on the profile, your birthday for the fortune
  function finish(how) {
    // Logging in: your things back, just as you left them
    if (mode === 'login' && Guest.bringBack(store.get('email', ''))) {
      try {
        localStorage.setItem('onboarded', '1');
        sessionStorage.setItem('no-splash', '1');
      } catch (e) { /* this visit only */ }
      location.reload();
      return;
    }
    // Signing up: a new account starts from nothing
    if (mode === 'signup' && pending) { Guest.putAway(); Guest.clear(); }  // (anyone signed in here: theirs put away first)
    const name = (mode === 'login' ? who?.name : pages.name.elements.name.value.trim()) || DEMO.name;
    const nameEl = document.querySelector('.profile--name');
    if (nameEl && nameEl.firstChild) nameEl.firstChild.textContent = `${name} `;
    const born = mode === 'login' ? who?.birthday : pages.birthday.elements.birthday.value;
    if (born && typeof birthday !== 'undefined') {
      birthday = born;  // mobile.js's, read by Daily Fortune
      try { localStorage.setItem('birthday', born); } catch (e) { /* kept for this visit only */ }
    }
    // a new account is kept on this phone, to log back into
    const username = mode === 'login' ? who?.username : (userFree || DEMO.username);
    if (mode === 'signup' && pending) {
      store.set('accounts', { ...accounts(), [pending.email]: { pw: pending.pw, username, name, birthday: born || null } });
      store.set('email', pending.email);
      // and the username and email taken, for everyone
      ask('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email: pending.email }) });
    }
    try { if (username) localStorage.setItem('username', username); } catch (e) { /* this visit only */ }
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
    // the demo's username is its own, so free for it
    if (page === pages.name) { userFree = DEMO.username; sayUser(`@${DEMO.username} is available`, true); }
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

  // from guest mode's "Sign up" (or "Log in"): straight to the account, once
  // everything above is ready
  if (goTo === 'signup' || goTo === 'login') { setMode(goTo); go('account'); }
})();
