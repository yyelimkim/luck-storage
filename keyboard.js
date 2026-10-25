// The iPhone's keyboard, for the desktop preview only: when a text field in
// the phone is focused, Safari's form bar (‹ › Done) and the keyboard slide
// up from the bottom, as they would on the phone. Its keys type into the
// field (the Mac's keyboard still works too); the suggestion strip offers
// the demo's details where they fit. On a real phone the real one shows.

(() => {
  const stage = document.getElementById('stage');
  const root = document.documentElement;
  const DEMO = { email: 'yelim@luckcorner.app', name: 'Yelim' };
  const ROWS = {
    abc: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'],
    num: ['1234567890', '-/:;()$&@"', '.,?!\''],
  };
  let layout = 'abc';
  let shift = false;
  let field = null;

  const kb = document.createElement('div');
  kb.className = 'kb';
  kb.setAttribute('aria-hidden', 'true');
  kb.innerHTML = `
    <div class="kb--bar">
      <button type="button" data-k="prev" aria-label="Previous field"><svg width="16" height="9" viewBox="0 0 16 9"><path d="M1 8L8 1L15 8"/></svg></button>
      <button type="button" data-k="next" aria-label="Next field"><svg width="16" height="9" viewBox="0 0 16 9"><path d="M1 1L8 8L15 1"/></svg></button>
      <span></span>
      <button type="button" data-k="done" class="kb--done">Done</button>
    </div>
    <div class="kb--pad">
      <div class="kb--suggest"><button type="button" data-k="suggest"></button></div>
      <div class="kb--keys"></div>
      <div class="kb--foot">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3 3 16 0 19M12 2.5c-3 3-3 16 0 19"/></svg>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>
      </div>
    </div>`;
  stage.appendChild(kb);
  const keys = kb.querySelector('.kb--keys');
  const suggest = kb.querySelector('[data-k="suggest"]');

  function draw() {
    const [r1, r2, r3] = ROWS[layout];
    const key = (c) => `<button type="button" class="kb--key" data-c="${c}">${shift && layout === 'abc' ? c.toUpperCase() : c}</button>`;
    keys.innerHTML = `
      <div class="kb--row">${[...r1].map(key).join('')}</div>
      <div class="kb--row is-mid">${[...r2].map(key).join('')}</div>
      <div class="kb--row">
        <button type="button" class="kb--key is-mod${shift ? ' is-on' : ''}" data-k="${layout === 'abc' ? 'shift' : 'abc'}">${layout === 'abc'
          ? '<svg width="20" height="18" viewBox="0 0 20 18"><path d="M10 1.5L1.5 10H6v6.5h8V10h4.5Z"/></svg>' : 'ABC'}</button>
        ${[...r3].map(key).join('')}
        <button type="button" class="kb--key is-mod" data-k="back" aria-label="Delete"><svg width="24" height="18" viewBox="0 0 24 18"><path d="M8 1.5h13.5v15H8L1.5 9Z"/><path d="M11.5 5.5l7 7M18.5 5.5l-7 7"/></svg></button>
      </div>
      <div class="kb--row">
        <button type="button" class="kb--key is-mod is-wide" data-k="${layout === 'abc' ? 'num' : 'abc'}">${layout === 'abc' ? '123' : 'ABC'}</button>
        <button type="button" class="kb--key is-space" data-k="space">space</button>
        <button type="button" class="kb--key is-mod is-return" data-k="return">${field && field.form && field.type !== 'textarea' ? 'go' : 'return'}</button>
      </div>`;
  }

  // Typing into the field, as the key would
  function put(text) {
    if (!field) return;
    // email fields keep no cursor position, so they're typed at the end
    if (field.selectionStart == null) {
      if (field.maxLength > 0 && field.value.length + text.length > field.maxLength) return;
      field.value += text;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    const s = field.selectionStart;
    const e = field.selectionEnd;
    if (field.maxLength > 0 && field.value.length - (e - s) + text.length > field.maxLength) return;
    field.setRangeText(text, s, e, 'end');
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function back() {
    if (!field) return;
    if (field.selectionStart == null) {
      field.value = field.value.slice(0, -1);
      field.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    let s = field.selectionStart;
    const e = field.selectionEnd;
    if (s === e && s > 0) s -= 1;
    field.setRangeText('', s, e, 'end');
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const fields = () => [...stage.querySelectorAll('input, textarea')].filter((f) => typesHere(f) && f.offsetParent);
  function hop(by) {
    const all = fields();
    const next = all[all.indexOf(field) + by];
    if (next) next.focus();
  }

  // Keys: pressed without taking the focus from the field
  kb.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button');
    e.preventDefault();
    if (!b) return;
    b.classList.add('is-down');
    setTimeout(() => b.classList.remove('is-down'), 110);
    if (window.Sounds && b.classList.contains('kb--key')) Sounds.tap();
    const c = b.dataset.c;
    const k = b.dataset.k;
    if (c) {
      put(shift && layout === 'abc' ? c.toUpperCase() : c);
      if (shift) { shift = false; draw(); }
      return;
    }
    if (k === 'shift') { shift = !shift; draw(); }
    if (k === 'num' || k === 'abc') { layout = k; shift = false; draw(); }
    if (k === 'space') put(' ');
    if (k === 'back') back();
    if (k === 'prev') hop(-1);
    if (k === 'next') hop(1);
    if (k === 'done') field && field.blur();
    if (k === 'return') {
      if (field && field.tagName === 'TEXTAREA') put('\n');
      else if (field && field.form) field.form.requestSubmit();
    }
    if (k === 'suggest' && b.textContent) {
      field.value = b.textContent;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  // (the keys are buttons for the pointer, not a click sound of their own)
  kb.querySelectorAll('button').forEach((b) => { b.dataset.silent = ''; });
  new MutationObserver(() => keys.querySelectorAll('button').forEach((b) => { b.dataset.silent = ''; }))
    .observe(keys, { childList: true, subtree: true });

  // Which fields bring it up: text you type (a date brings up its own picker)
  const typesHere = (f) => f.tagName === 'TEXTAREA' || ['text', 'email', 'password', 'search', 'tel', 'url', ''].includes(f.type);
  stage.addEventListener('focusin', (e) => {
    const f = e.target;
    if (!root.classList.contains('is-preview') || !f.matches('input, textarea') || !typesHere(f)) return;
    field = f;
    shift = f.type !== 'email' && f.type !== 'password' && !f.value;  // capitals to start, as iOS
    layout = 'abc';
    const hint = DEMO[f.name] || '';
    suggest.textContent = hint && f.value !== hint ? hint : '';
    draw();
    stage.classList.add('is-typing');
  });
  stage.addEventListener('focusout', () => {
    setTimeout(() => {
      if (document.activeElement && stage.contains(document.activeElement) && document.activeElement.matches('input, textarea')) return;
      field = null;
      stage.classList.remove('is-typing');
    }, 0);
  });
  stage.addEventListener('input', (e) => {
    if (e.target !== field) return;
    const hint = DEMO[field.name] || '';
    suggest.textContent = hint && field.value !== hint && hint.startsWith(field.value) ? hint : '';
  });
})();
