// Guest mode: in without an account, nothing kept. Entering as a guest sets
// aside what's kept on this phone (an account's luck, wishes and the rest),
// and the guest starts from nothing; the visit lasts as long as the tab. The
// next visit starts fresh at the welcome, the guest's things gone and what
// was set aside back. Runs before the app's other scripts, so they only ever
// read what's current.
const Guest = (() => {
  // what a visit keeps on this phone (accounts themselves, and the sound
  // settings, belong to the phone, so stay)
  const KEYS = ['luck', 'earned', 'wishes', 'sent', 'played', 'name', 'birthday', 'username', 'email', 'anon'];
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* this visit only */ } };
  const on = () => get('onboarded') === 'guest';

  function start() {
    // (what's already set aside stays: never overwritten by a guest's things)
    if (!get('account-stash')) {
      const stash = {};
      KEYS.forEach((k) => { stash[k] = get(k); });
      set('account-stash', JSON.stringify(stash));
    }
    KEYS.forEach((k) => set(k, null));
    set('onboarded', 'guest');
    set('name', 'Guest');
    try { sessionStorage.setItem('guest-live', '1'); } catch (e) { /* no session: ends on reload */ }
    document.documentElement.classList.add('is-guest');
  }
  // the guest's things gone; what was set aside, back. (Their wishes stay on
  // this phone's tree, as anyone's: wishes are the tree's, not the guest's.)
  function end() {
    try {
      const theirs = JSON.parse(get('wishes') || '[]');
      if (on() && Array.isArray(theirs) && theirs.length) {
        const kept = JSON.parse(get('tree-local') || '[]');
        set('tree-local', JSON.stringify([...kept, ...theirs.map((w) => ({ ...w, own: undefined }))]));
      }
    } catch (e) { /* none to keep */ }
    let stash = {};
    try { stash = JSON.parse(get('account-stash') || '{}') || {}; } catch (e) { /* nothing set aside */ }
    KEYS.forEach((k) => set(k, stash[k] ?? null));
    set('account-stash', null);
    set('onboarded', stash.email ? '1' : null);
    try { sessionStorage.removeItem('guest-live'); } catch (e) { /* none */ }
    document.documentElement.classList.remove('is-guest');
  }
  // leaving guest mode for the welcome's sign up (or log in)
  function join(step = 'signup') {
    end();
    set('onboarded', null);
    try { sessionStorage.setItem('onboard-go', step); } catch (e) { /* the welcome, then */ }
    location.href = location.pathname;
  }

  // a new visit after a guest one: start over
  let live = false;
  try { live = sessionStorage.getItem('guest-live') === '1'; } catch (e) { /* not known */ }
  if (on() && !live) { end(); set('onboarded', null); }
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

  return { on, start, end, join, arrived, visitor, settle };
})();
