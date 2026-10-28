// Who's here, and what's kept for them. Each account on this phone keeps its
// own things (clovers, earned luck, wishes, the rest) in its record under
// 'accounts': logging out puts them away there, logging in brings them back.
// A guest starts from nothing and nothing of theirs is kept: the visit lasts
// as long as the tab, and the next one starts fresh at the welcome. (Their
// wishes stay on this phone's tree, as anyone's: wishes are the tree's.)
// Runs before the app's other scripts, so they only ever read what's current.
const Guest = (() => {
  // what's someone's own (accounts themselves, and the sound settings,
  // belong to the phone, so stay)
  const KEYS = ['luck', 'earned', 'wishes', 'sent', 'played', 'name', 'birthday', 'username', 'anon'];
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* this visit only */ } };
  const json = (k, fallback) => { try { const v = JSON.parse(get(k)); return v == null ? fallback : v; } catch (e) { return fallback; } };
  const on = () => get('onboarded') === 'guest';
  const email = () => json('email', '');

  // put away what's here into the account it belongs to
  function putAway(who = email()) {
    if (!who) return;
    const accounts = json('accounts', {});
    if (!accounts[who]) return;
    const data = {};
    KEYS.forEach((k) => { data[k] = get(k); });
    accounts[who] = { ...accounts[who], data };
    set('accounts', JSON.stringify(accounts));
  }
  // bring back an account's things (true if it had any put away)
  function bringBack(who) {
    const data = json('accounts', {})[who]?.data;
    if (!data) return false;
    KEYS.forEach((k) => set(k, data[k] ?? null));
    return true;
  }
  const clear = () => KEYS.forEach((k) => set(k, null));
  // a guest's wishes, left on this phone's tree as anyone's
  function leaveWishes() {
    const theirs = json('wishes', []);
    if (!Array.isArray(theirs) || !theirs.length) return;
    set('tree-local', JSON.stringify([...json('tree-local', []), ...theirs]));
  }

  // Logging out: your things put away in your account, the phone cleared
  // (your email kept only to fill in next time you log in)
  function logOut() {
    putAway();
    clear();
    if (email()) set('last-email', JSON.stringify(email()));
    set('onboarded', null);
    set('email', null);
  }
  function start() {
    if (get('onboarded') === '1') logOut();
    clear();
    set('onboarded', 'guest');
    set('name', 'Guest');
    try { sessionStorage.setItem('guest-live', '1'); } catch (e) { /* no session: ends on reload */ }
    document.documentElement.classList.add('is-guest');
  }
  // the guest's things gone (their wishes left on the tree)
  function end() {
    leaveWishes();
    clear();
    set('onboarded', null);
    try { sessionStorage.removeItem('guest-live'); } catch (e) { /* none */ }
    document.documentElement.classList.remove('is-guest');
  }
  // leaving guest mode for the welcome's sign up (or log in)
  function join(step = 'signup') {
    end();
    try { sessionStorage.setItem('onboard-go', step); } catch (e) { /* the welcome, then */ }
    location.href = location.pathname;
  }

  // (from before accounts kept their own things: whatever was set aside
  // comes back, where nothing's taken its place)
  const old = get('account-stash');
  if (old) {
    try {
      const stash = JSON.parse(old) || {};
      if (!on()) KEYS.forEach((k) => { if (get(k) == null && stash[k] != null) set(k, stash[k]); });
    } catch (e) { /* nothing to bring back */ }
    set('account-stash', null);
  }

  // a new visit after a guest one: start over
  let live = false;
  try { live = sessionStorage.getItem('guest-live') === '1'; } catch (e) { /* not known */ }
  if (on() && !live) end();

  // Arriving from a shared card's link, new here: no splash or welcome, but
  // in as a guest (3 clovers) with that card open; once they've claimed its
  // luck, they're asked to sign up or carry on as a guest (mobile.js)
  const arrived = new URLSearchParams(location.search).has('card');
  if (arrived && !get('onboarded')) {
    start();
    set('luck', '3');
    try { sessionStorage.setItem('link-visitor', '1'); } catch (e) { /* no nudge, then */ }
  }
  if (on()) document.documentElement.classList.add('is-guest');
  const visitor = () => { try { return on() && sessionStorage.getItem('link-visitor') === '1'; } catch (e) { return false; } };
  const settle = () => { try { sessionStorage.removeItem('link-visitor'); } catch (e) { /* none */ } };

  return { on, start, end, join, logOut, putAway, bringBack, clear, arrived, visitor, settle };
})();
