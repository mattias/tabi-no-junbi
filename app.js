"use strict";
const $ = id => document.getElementById(id);
const KEY = 'tabi-no-junbi';

// Ticks and the chosen path live in this browser only. Storage can be blocked, so the page works without it.
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
const state = load();
state.done ||= {};

const steps = [...document.querySelectorAll('[data-step]')];
const tocLinks = new Map([...document.querySelectorAll('.toc ol ol a')].map(a => [a.hash.slice(1), a]));

function showProgress() {
  const n = steps.filter(s => state.done[s.id]).length;
  const pct = steps.length ? n / steps.length * 100 : 0;
  $('progress-text').textContent = `${n} of ${steps.length} steps done`;
  $('progress-bar').style.width = $('mini-bar').style.width = pct + '%';
  $('mini-count').textContent = `${n} / ${steps.length}`;
  for (const s of steps) {
    s.classList.toggle('done', !!state.done[s.id]);
    tocLinks.get(s.id)?.classList.toggle('done', !!state.done[s.id]);
  }
}

for (const s of steps) {
  const box = s.querySelector('.check input');
  box.checked = !!state.done[s.id];
  box.addEventListener('change', () => {
    state.done[s.id] = box.checked;
    save(state);
    showProgress();
    // Move on to the next step once this one is ticked.
    const next = steps[steps.indexOf(s) + 1];
    if (box.checked && next && !state.done[next.id] && s.closest('.chapter') === next.closest('.chapter')) {
      setTimeout(() => next.scrollIntoView({ block: 'start' }), 250);
    }
  });
}

$('reset').addEventListener('click', () => {
  if (!confirm('Clear all your ticks?')) return;
  state.done = {};
  save(state);
  steps.forEach(s => { s.querySelector('.check input').checked = false; });
  showProgress();
});

// Copy buttons
for (const b of document.querySelectorAll('[data-copy]')) {
  b.addEventListener('click', async () => {
    const text = b.previousElementSibling.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers: select the text so Ctrl+C works.
      const r = document.createRange();
      r.selectNodeContents(b.previousElementSibling);
      getSelection().removeAllRanges();
      getSelection().addRange(r);
      b.textContent = 'Press Ctrl+C';
      return;
    }
    b.textContent = 'Copied ✓';
    b.classList.add('ok');
    setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('ok'); }, 2200);
  });
}

// Path chooser: shows which chapters to follow and highlights them.
const ROUTES = {
  new: { text: 'Follow <b>chapter one</b>, then pick any extra tools you like from <b>chapter two</b>.', parts: ['basics'], go: 'basics' },
  migaku: { text: 'Follow <b>chapter one</b>, then <b>chapter three</b> to bring your Migaku cards over.', parts: ['basics', 'migaku'], go: 'basics' },
  other: { text: 'Read <b>chapter four</b> first to see what to swap, then follow <b>chapter one</b>.', parts: ['languages', 'basics'], go: 'languages' },
};
function choose(p, jump) {
  state.path = p;
  save(state);
  for (const b of document.querySelectorAll('.path')) b.setAttribute('aria-pressed', b.dataset.path === p);
  document.querySelectorAll('.chapter').forEach(c => c.classList.toggle('recommended', !!p && ROUTES[p].parts.includes(c.id)));
  $('route').innerHTML = p ? ROUTES[p].text + ` <a href="#${ROUTES[p].go}">Start here ↓</a>` : '';
  if (jump) setTimeout(() => $(ROUTES[p].go).scrollIntoView({ block: 'start' }), 600);
}
for (const b of document.querySelectorAll('.path')) b.addEventListener('click', () => choose(b.dataset.path, true));
if (ROUTES[state.path]) choose(state.path, false);

// A link to a folded tool opens it, also when the address already points there.
function openTool() { const d = location.hash && document.querySelector(`details${location.hash}`); if (d) d.open = true; }
addEventListener('hashchange', openTool);
openTool();
for (const a of document.querySelectorAll('a[data-open]')) a.addEventListener('click', () => setTimeout(openTool));

// Mobile chapter menu
const toc = $('toc'), toggle = $('toc-toggle');
toggle.addEventListener('click', () => {
  const open = toc.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
toc.addEventListener('click', e => {
  if (e.target.closest('a') && toc.classList.contains('open')) { toc.classList.remove('open'); toggle.setAttribute('aria-expanded', false); }
});

// Marks the step you are reading in the chapter list.
const seen = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    tocLinks.forEach(a => a.classList.remove('here'));
    tocLinks.get(e.target.id)?.classList.add('here');
  }
}, { rootMargin: '-20% 0px -70% 0px' });
steps.forEach(s => seen.observe(s));

// Stars, blue flowers and falling petals.
(function scene() {
  let st = '';
  for (let i = 0; i < 140; i++) st += `<circle cx="${Math.random() * 1600}" cy="${Math.random() * 600}" r="${Math.random() * 1.4 + .2}" opacity="${Math.random() * .7 + .2}"/>`;
  $('stars').innerHTML = st;
  let m = '';
  for (let i = 0; i < 90; i++) { const y = 850 + Math.random() * 150; m += `<circle cx="${Math.random() * 1600}" cy="${y}" r="${4 + (y - 850) / 14}" fill="url(#flower)" opacity=".85"/>`; }
  $('meadow').innerHTML = m;
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.left = Math.random() * 110 + 'vw';
    p.style.animationDuration = 14 + Math.random() * 16 + 's';
    p.style.animationDelay = -Math.random() * 30 + 's';
    p.style.scale = .6 + Math.random() * .8;
    document.body.appendChild(p);
  }
})();

showProgress();
