// Onboarding, after the splash, in the shape of Reddit's: the welcome (Get
// started, or I already have an account) → a sheet of ways in (Google,
// Apple, email) → your email → the code sent to it → your username → a
// password → your birthday → all set, then Home. Logging in: email and
// password, then all set.
//
// This is a demo: nothing is sent anywhere, but what you sign up with is
// kept on this phone (store, in mobile.js): your email, your username, your
// birthday, and your password only as a hash, never itself. Logging in
// checks against that and brings your name and birthday back. Pressing /
// fills the step you're on with demo details, and S skips onboarding (the
// hint sits under the phone, outside its screen). Google and Apple stand in
// with the demo's email.
// Your username goes on the profile (a name to change in Settings) and your
// birthday seeds Daily Fortune.
//
// The first version (welcome → account → name → birthday) is on the
// onboarding-v1 branch.

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
  const bar = ob.querySelector('.ob--bar');
  const fill = ob.querySelector('.ob--fill');
  const DEMO = { email: 'yelim@luckcorner.app', password: 'fourleaf8', username: 'yelim', name: 'Yelim', birthday: '2006-04-15' };

  let mode = 'signup';  // or 'login'
  // The accounts made on this phone, by email; and who's signing up or in
  const accounts = () => store.get('accounts', {});
  let pending = null;   // signing up: { email, pw, password }
  let who = null;       // logged in: { name, username, birthday }
  async function hash(pw) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`luck-corner:${pw}`));
    return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let path = [];        // the steps taken, for the way back
  const STEPS = { signup: ['email', 'verify', 'name', 'password', 'birthday'], login: ['login'] };
  // Asking the server (api/): null when it can't say (offline, or not set up)
  async function ask(url, opts) {
    try {
      const r = await fetch(url, opts);
      if ([404, 405, 501, 503].includes(r.status)) return null;  // no such server, or not set up
      return { status: r.status, ...(await r.json().catch(() => ({}))) };
    } catch (e) { return null; }
  }
  const json = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

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
    // how far along: a fifth for each of email, code, username, password, birthday
    const steps = STEPS.signup;
    const i = steps.indexOf(step);
    if (i >= 0) {
      fill.style.setProperty('--done', `${((i + 1) / steps.length) * 100}%`);
      bar.setAttribute('aria-valuenow', String(i + 1));
    }
    if (step === 'name') suggestName();
    // the first field ready to type in (not on a phone, where it'd pop the keyboard)
    const input = next.querySelector('input');
    if (input && root.classList.contains('is-preview') && step !== 'name') setTimeout(() => input.focus({ preventScroll: true }), 350);
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

  // --- Get started: the ways in, on a sheet over the welcome
  const ways = document.getElementById('ob-ways');
  function openWays() { ways.classList.add('is-open'); ways.setAttribute('aria-hidden', 'false'); }
  function closeWays() { ways.classList.remove('is-open'); ways.setAttribute('aria-hidden', 'true'); }
  ways.querySelector('.filter--scrim').addEventListener('click', closeWays);
  // the grabber: drag the sheet down to put it away (past a third of it, or a flick)
  const waysSheet = ways.querySelector('.filter--sheet');
  let drag = null;
  waysSheet.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a')) return;
    drag = { y: e.clientY, t: performance.now(), dy: 0 };
    waysSheet.setPointerCapture(e.pointerId);
    waysSheet.style.transition = 'none';
  });
  waysSheet.addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.dy = Math.max(0, e.clientY - drag.y);
    waysSheet.style.transform = `translateY(${drag.dy}px)`;
  });
  const endDrag = () => {
    if (!drag) return;
    const fast = drag.dy / (performance.now() - drag.t) > 0.5;
    const far = drag.dy > waysSheet.getBoundingClientRect().height / 3;
    drag = null;
    waysSheet.style.transition = '';
    waysSheet.style.transform = '';
    if (fast || far) closeWays();
  };
  waysSheet.addEventListener('pointerup', endDrag);
  waysSheet.addEventListener('pointercancel', endDrag);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeWays(); });

  function begin(m, step) {
    mode = m;
    closeWays();
    if (ob.dataset.step !== 'welcome') { path = []; show('welcome', true); }
    go(step);
  }
  ob.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    const to = b.dataset.go;
    if (to === 'ways') {
      if (ob.dataset.step !== 'welcome') { path = []; show('welcome', true); }
      openWays();
    }
    if (to === 'email') begin('signup', 'email');
    // Google and Apple: the demo's email, straight on
    if (to === 'google' || to === 'apple') {
      begin('signup', 'email');
      fillIn(pages.email);
      pages.email.requestSubmit();
    }
    if (to === 'login') {
      begin('login', 'login');
      const email = pages.login.elements.email;
      if (!email.value) email.value = store.get('email', '') || store.get('last-email', '');
      check(pages.login);
    }
    if (to === 'home') finish('start');
  });

  // --- Each form: its button wakes once it's filled in properly
  const EMAIL = /\S+@\S+\.\S+/;
  const valid = {
    email: (f) => EMAIL.test(f.elements.email.value),
    verify: (f) => /^\d{6}$/.test(f.elements.code.value.trim()),
    name: (f) => userFree === f.elements.username.value.trim().toLowerCase(),
    password: (f) => f.elements.password.value.length >= 8,
    birthday: (f) => !!f.elements.birthday.value,
    login: (f) => EMAIL.test(f.elements.email.value) && f.elements.password.value.length > 0,
  };
  function check(page) {
    const btn = page.querySelector('[type="submit"]');
    if (btn && valid[page.dataset.page]) btn.disabled = !valid[page.dataset.page](page);
  }
  Object.keys(valid).forEach((step) => {
    const f = pages[step];
    f.addEventListener('input', () => check(f));
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!valid[step](f)) return;
      const btn = f.querySelector('[type="submit"]');
      btn.disabled = true;
      try {
        if (step === 'email') {
          if (!(await startSignup(f))) return;
          // a code to the email, to show it's yours (straight on to the
          // username if verifying isn't set up)
          const sent = await sendCode();
          if (sent === false) return;
          go(sent ? 'verify' : 'name');
          return;
        }
        if (step === 'verify' && !(await verifyCode(f))) return;
        if (step === 'password') {
          const password = f.elements.password.value;
          pending = { ...pending, password, pw: await hash(password) };  // (the password itself only till it's sent up, at the end)
        }
        if (step === 'login' && !(await logIn(f))) return;
        next(step);
      } finally { check(f); }
    });
  });
  function next(step) {
    const steps = STEPS[mode];
    const i = steps.indexOf(step);
    let to = i < steps.length - 1 ? steps[i + 1] : 'done';
    if (to === 'verify') to = 'name';  // (verify is only gone to from the email)
    go(to);
  }

  // A word under a field, with a way to log in instead when it helps
  function say(note, text, loginLink = false) {
    note.textContent = text;
    if (!loginLink) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Log in';
    b.dataset.go = 'login';
    note.append(' ', b);
  }

  // --- Email: not taken here, then everyone's
  const eNote = document.getElementById('ob-email-note');
  const TAKEN = 'There’s already an account with this email.';
  async function emailTaken(email) {
    if (accounts()[email]) return true;
    const r = await ask(`/api/accounts?email=${encodeURIComponent(email)}`);
    return !!(r && r.taken);
  }
  // said as you type it, once it looks like an email
  let emailTimer = 0;
  pages.email.elements.email.addEventListener('input', () => {
    clearTimeout(emailTimer);
    say(eNote, '');
    const email = pages.email.elements.email.value.trim().toLowerCase();
    if (!EMAIL.test(email)) return;
    emailTimer = setTimeout(async () => {
      if (await emailTaken(email) && pages.email.elements.email.value.trim().toLowerCase() === email) say(eNote, TAKEN, true);
    }, 450);
  });
  async function startSignup(f) {
    const email = f.elements.email.value.trim().toLowerCase();
    if (await emailTaken(email)) { say(eNote, TAKEN, true); return false; }
    pending = { email };
    return true;
  }

  // --- Verify: a code to your email
  const vNote = document.getElementById('ob-verify-note');
  async function sendCode() {
    const email = pending.email;
    document.getElementById('ob-verify-sub').textContent = `We sent a 6-digit code to ${email}.`;
    const r = await ask('/api/verify', json({ email }));
    if (!r) return null;  // not set up: no verifying
    if (r.status === 200) { vNote.textContent = ''; pages.verify.elements.code.value = ''; return true; }
    say(eNote, r.error || 'The code couldn’t be sent. Try again.');
    return false;
  }
  async function verifyCode(f) {
    const r = await ask('/api/verify', json({ email: pending.email, code: f.elements.code.value.trim() }));
    if (r && r.ok) { vNote.textContent = ''; return true; }
    vNote.textContent = (r && r.error) || 'That code couldn’t be checked. Try again.';
    return false;
  }
  pages.verify.elements.code.addEventListener('input', () => { vNote.textContent = ''; vNote.classList.remove('is-ok'); });
  document.getElementById('ob-resend').addEventListener('click', async () => {
    const r = await ask('/api/verify', json({ email: pending.email }));
    vNote.classList.toggle('is-ok', !!(r && r.status === 200));
    vNote.textContent = r && r.status === 200 ? 'A new code is on its way.' : ((r && r.error) || 'The code couldn’t be sent. Try again.');
  });

  // --- Username: 3 to 20 of a-z, 0-9, . and _; checked as you type that
  // no one has it (on this phone, then everyone). One is ready for you, and
  // a few more to pick from.
  const uNote = document.getElementById('ob-user-note');
  const uField = pages.name.elements.username;
  const uLabel = uField.closest('.ob--field');
  let userFree = null;  // the name last found free
  let userTimer = 0;
  function sayUser(text, ok = false) { uNote.textContent = text; uNote.classList.toggle('is-ok', ok); }
  function checkUser() {
    clearTimeout(userTimer);
    const name = uField.value.trim().toLowerCase();
    if (uField.value !== uField.value.toLowerCase()) uField.value = uField.value.toLowerCase();
    userFree = null;
    uLabel.classList.remove('is-ok');
    check(pages.name);
    if (!name) { sayUser(''); return; }
    if (!/^[a-z0-9._]{3,20}$/.test(name)) { sayUser('3 to 20 letters, numbers, . or _'); return; }
    sayUser('Checking…', true);
    userTimer = setTimeout(async () => {
      const here = Object.values(accounts()).some((a) => a.username === name);
      const r = here ? null : await ask(`/api/accounts?username=${encodeURIComponent(name)}`);
      if (uField.value.trim().toLowerCase() !== name) return;  // typed on since
      if (here || (r && r.taken)) { sayUser(`@${name} is taken`); return; }
      userFree = name;
      uLabel.classList.add('is-ok');
      sayUser('Great name! It’s not taken, so it’s all yours.', true);
      check(pages.name);
    }, 400);
  }
  uField.addEventListener('input', checkUser);
  // the ideas: two luck words and a number, as a username can be
  const WORDS = {
    a: ['lucky', 'golden', 'sunny', 'starry', 'merry', 'charmed', 'minty', 'happy', 'cosy', 'brave', 'gentle', 'jolly'],
    b: ['clover', 'charm', 'acorn', 'pebble', 'wish', 'comet', 'tulip', 'ladybug', 'horseshoe', 'penny', 'acorn', 'dandelion'],
  };
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  function idea() {
    for (;;) {
      const name = `${pick(WORDS.a)}_${pick(WORDS.b)}${Math.floor(Math.random() * 9000) + 1000}`;
      if (name.length <= 20) return name;
    }
  }
  const ideas = document.getElementById('ob-ideas');
  function drawIdeas() {
    ideas.innerHTML = [idea(), idea(), idea()].map((n) => `<button type="button" class="ob--chip">${n}</button>`).join('');
  }
  ideas.addEventListener('click', (e) => {
    const b = e.target.closest('.ob--chip');
    if (!b) return;
    uField.value = b.textContent;
    checkUser();
  });
  document.getElementById('ob-more').addEventListener('click', drawIdeas);
  function suggestName() {
    if (!ideas.children.length) drawIdeas();
    if (!uField.value) { uField.value = idea(); checkUser(); }
  }

  // --- Password: shown on a tap of the eye; the hint says when it's long enough
  const pw = pages.password.elements.password;
  const pwNote = document.getElementById('ob-pw-note');
  const peek = pages.password.querySelector('.ob--peek');
  pw.addEventListener('input', () => {
    const ok = pw.value.length >= 8;
    pwNote.classList.toggle('is-ok', ok);
    pw.closest('.ob--field').classList.toggle('is-ok', ok);
  });
  peek.addEventListener('click', () => {
    const on = pw.type === 'password';
    pw.type = on ? 'text' : 'password';
    peek.setAttribute('aria-pressed', String(on));
    peek.setAttribute('aria-label', on ? 'Hide password' : 'Show password');
  });

  // --- Log in: online first, so it works on any phone; else this phone's
  // own account (or the demo's)
  const lNote = document.getElementById('ob-login-note');
  pages.login.addEventListener('input', () => say(lNote, ''));
  async function logIn(f) {
    const email = f.elements.email.value.trim().toLowerCase();
    const password = f.elements.password.value;
    const hashed = await hash(password);
    const acc = accounts()[email];
    const r = await ask('/api/auth', json({ action: 'login', email, password }));
    if (r && r.status === 200) {
      Guest.adopt(email, r.token, r.account, hashed);
      who = { name: r.account.name, username: r.account.username, birthday: r.account.birthday };
      store.set('email', email);
      return true;
    }
    if (r && (r.status === 401 || r.status === 429)) { say(lNote, r.error); return false; }
    // not online yet: this phone's own account, which then goes up
    if (acc) {
      if (acc.pw !== hashed) { say(lNote, 'That password doesn’t match this account.'); return false; }
      who = { name: acc.name, username: acc.username, birthday: acc.birthday };
      if (r && acc.username) {
        // made here before accounts were online: up it goes, with its things
        const data = store.get('email', '') === email ? Guest.snapshot() : (acc.data || null);
        const up = await ask('/api/auth', json({ action: 'signup', email, password, username: acc.username, name: acc.name, birthday: acc.birthday, data }));
        if (up && up.status === 201) Guest.adopt(email, up.token, up.account, hashed);
      }
    } else {
      say(lNote, r && r.missing ? 'No account with that email yet.' : 'No account with that email on this phone yet.');
      return false;
    }
    store.set('email', email);
    return true;
  }

  // --- All set: your name on the profile, your birthday for the fortune
  const signedUpName = () => userFree || uField.value.trim() || DEMO.username;
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
    // the username stands as the name till it's changed in Settings
    const username = mode === 'login' ? who?.username : (userFree || DEMO.username);
    const name = (mode === 'login' ? who?.name : signedUpName()) || DEMO.name;
    const nameEl = document.querySelector('.profile--name');
    if (nameEl && nameEl.firstChild) nameEl.firstChild.textContent = `${name} `;
    const born = mode === 'login' ? who?.birthday : pages.birthday.elements.birthday.value;
    if (born && typeof birthday !== 'undefined') {
      birthday = born;  // mobile.js's, read by Daily Fortune
      try { localStorage.setItem('birthday', born); } catch (e) { /* kept for this visit only */ }
    }
    // a new account is kept on this phone, to log back into
    if (mode === 'signup' && pending && pending.pw) {
      store.set('accounts', { ...accounts(), [pending.email]: { pw: pending.pw, username, name, birthday: born || null } });
      store.set('email', pending.email);
      // and the account online, so it works on any phone (the username and
      // email taken for everyone with it)
      ask('/api/auth', json({ action: 'signup', email: pending.email, password: pending.password, username, name, birthday: born || null }))
        .then((up) => { if (up && up.status === 201) { Guest.adopt(pending.email, up.token, up.account, pending.pw); Guest.sync(); } });
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
    const name = mode === 'login' ? (who?.name || DEMO.name) : signedUpName();
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
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    check(page);
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
    if (ob.dataset.step === 'welcome') { begin('signup', 'email'); return; }
    fillIn(pages[ob.dataset.step]);
  });

  // from guest mode's "Sign up" (or "Log in"): straight to the account, once
  // everything above is ready
  if (goTo === 'signup') begin('signup', 'email');
  if (goTo === 'login') begin('login', 'login');
})();
