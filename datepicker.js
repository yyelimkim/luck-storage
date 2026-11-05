// The calendar: every date field opens this sheet in place of the system's
// picker. It's the filter's sheet (close on the left, Confirm on the right,
// over a Neutral 100 rule), then the month with its arrows, the weekdays and
// the days. One day at a time, no ranges. Tap the month's name for the years.
// The field keeps its own YYYY-MM-DD value; picking sets it and fires
// input and change, as the system picker would.
const DatePick = (() => {
  const el = document.getElementById('datepick');
  if (!el) return { open() {} };
  const title = el.querySelector('.datepick--title');
  const label = el.querySelector('.datepick--label');
  const prev = el.querySelector('[data-step="-1"]');
  const next = el.querySelector('[data-step="1"]');
  const days = el.querySelector('.datepick--days');
  const years = el.querySelector('.datepick--years');
  const confirm = el.querySelector('.filter--confirm');
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = (s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00`) : null);

  let field = null;   // the input it's open for
  let picked = null;  // the day chosen here, before Confirm
  let view = null;    // the first of the month on show
  let min = null;
  let max = null;
  const inRange = (d) => (!min || d >= min) && (!max || d <= max);

  function drawDays() {
    title.setAttribute('aria-expanded', 'false');
    el.classList.remove('is-years');
    label.textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const last = new Date(view.getFullYear(), view.getMonth() + 1, 0);
    prev.disabled = !!min && first <= min;
    next.disabled = !!max && last >= max;
    // always six weeks, so the sheet keeps its height month to month
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const sel = picked && iso(picked);
    const today = iso(new Date());
    let html = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = iso(d);
      const cls = [d.getMonth() !== view.getMonth() && 'is-out', key === sel && 'is-on', key === today && 'is-today'].filter(Boolean).join(' ');
      html += `<button type="button" class="${cls}" data-day="${key}"${inRange(d) ? '' : ' disabled'} aria-label="${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}"${key === sel ? ' aria-pressed="true"' : ''}>${d.getDate()}</button>`;
    }
    days.innerHTML = html;
  }

  function drawYears() {
    title.setAttribute('aria-expanded', 'true');
    el.classList.add('is-years');
    label.textContent = String(view.getFullYear());
    const from = min ? min.getFullYear() : 1900;
    const to = max ? max.getFullYear() : new Date().getFullYear() + 10;
    let html = '';
    for (let y = to; y >= from; y--) {
      html += `<button type="button" data-year="${y}"${y === view.getFullYear() ? ' class="is-on" aria-pressed="true"' : ''}>${y}</button>`;
    }
    years.innerHTML = html;
    const on = years.querySelector('.is-on');
    if (on) years.scrollTop = on.offsetTop - years.clientHeight / 2 + on.offsetHeight / 2;
  }

  function open(input) {
    field = input;
    min = parse(input.min);
    max = parse(input.max) || parse(iso(new Date()));  // every date here is a birthday: none to come
    picked = parse(input.value);
    const at = picked || (max && max < new Date() ? max : new Date());
    view = new Date(at.getFullYear(), at.getMonth(), 1);
    confirm.disabled = !picked;
    drawDays();
    // a birthday not given yet: start on the years, rather than a month away
    if (!picked && input.dataset.datepick !== 'days') { view = new Date(2000, at.getMonth(), 1); drawYears(); }
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
  }
  function close() {
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    field = null;
  }

  title.addEventListener('click', () => (el.classList.contains('is-years') ? drawDays() : drawYears()));
  [prev, next].forEach((b) => b.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() + Number(b.dataset.step), 1);
    drawDays();
  }));
  days.addEventListener('click', (e) => {
    const b = e.target.closest('[data-day]');
    if (!b || b.disabled) return;
    picked = parse(b.dataset.day);
    if (picked.getMonth() !== view.getMonth()) view = new Date(picked.getFullYear(), picked.getMonth(), 1);
    confirm.disabled = false;
    drawDays();
  });
  years.addEventListener('click', (e) => {
    const b = e.target.closest('[data-year]');
    if (!b) return;
    view = new Date(Number(b.dataset.year), view.getMonth(), 1);
    drawDays();
  });
  confirm.addEventListener('click', () => {
    if (!field || !picked) return;
    const input = field;
    input.value = iso(picked);
    close();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  el.querySelector('.filter--close').addEventListener('click', close);
  el.querySelector('.filter--scrim').addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && field) close(); });

  // Every date field: read-only to the system (no picker of its own), this
  // sheet on a tap instead
  document.querySelectorAll('input[type="date"]').forEach((input) => { input.readOnly = true; });
  document.addEventListener('mousedown', (e) => {
    if (e.target.matches?.('input[type="date"]')) e.preventDefault();
  }, true);
  document.addEventListener('click', (e) => {
    const input = e.target.closest?.('input[type="date"]');
    if (!input) return;
    e.preventDefault();
    open(input);
  }, true);

  return { open };
})();
