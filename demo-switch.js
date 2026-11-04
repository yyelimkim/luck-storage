// Demo branch only: the Demo / Actual switch at the top left, and every
// shortcut listed under it. Demo is demo.html (the iPhone home screen), Actual
// is index.html (the app in its preview frame). The choice is remembered, so
// the site's root opens on whichever was picked last (the demo by default).
// On a phone, as the installed app, or inside demo.html's phone (?embed) none
// of this is drawn: there it's always the actual app.
(() => {
  const real = innerWidth <= 500 || matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const embed = /[?&]embed(?:[=&]|$)/.test(location.search);
  if (real || embed) return;

  const isDemo = /demo\.html$/.test(location.pathname);
  const KEYS = [
    ['Home screen', isDemo ? [
      ['Click', 'Luck Corner to open it'],
      ['H', 'back to the home screen'],
      ['Q', 'quit the app (on the home screen)'],
    ] : null],
    ['Onboarding', [
      ['/', 'fill in the details'],
      ['S', 'skip'],
      ['O', 'start over'],
    ]],
    ['In the app', [
      ['← →', 'step through the cards'],
      ['Esc', 'close what’s open'],
      ['O', 'see onboarding again'],
    ]],
  ];

  const box = document.createElement('div');
  box.className = 'ds';
  box.innerHTML = `
    <div class="ds--toggle" role="group" aria-label="Version">
      <button type="button" data-view="demo" class="${isDemo ? 'is-on' : ''}">Demo</button>
      <button type="button" data-view="actual" class="${isDemo ? '' : 'is-on'}">Actual</button>
    </div>
    <div class="ds--keys">${KEYS.filter(([, rows]) => rows).map(([title, rows]) =>
      `<h2>${title}</h2>${rows.map(([k, what]) => `<p><b>${k}</b><span>${what}</span></p>`).join('')}`
    ).join('')}</div>`;
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-view]');
    if (!b || b.classList.contains('is-on')) return;
    const view = b.dataset.view;
    try { localStorage.setItem('lc-view', view); } catch (err) {}
    location.href = view === 'demo' ? 'demo.html' : 'index.html?actual';
  });
  const add = () => document.body.appendChild(box);
  if (document.body) add(); else addEventListener('DOMContentLoaded', add);
})();
