// app.js — the boot module the shell's one import() fetches. It mounts
// the chrome, then routes: each route's view is a literal import() in the
// dispatch table below, so a view's code loads only when its route does.

import { mountChrome } from './chrome.js';
import { warmBoard } from './api.js';

const ROUTES = {
  board: () => import('./board.js'),
  bounty: () => import('./bounty.js'),
  leaderboard: () => import('./leaderboard.js'),
  profile: () => import('./profile.js'),
};

const TITLES = {
  board: 'Live bounty board · make.fun',
  bounty: 'Bounty · make.fun',
  leaderboard: 'Leaderboard · make.fun',
  profile: 'Profile · make.fun',
};

const root = document.getElementById('v');
window.__shotReady = false;

let cleanup = null;
let navToken = 0;
let readyTimer = null;

function parse(hash) {
  const parts = (hash || '#/').replace(/^#/, '').split('/').filter(Boolean);
  if (parts[0] === 'bounty' && parts[1] && parts[2] === 'leaderboard') {
    return { name: 'leaderboard', slug: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === 'bounty' && parts[1]) return { name: 'bounty', slug: decodeURIComponent(parts[1]) };
  if (parts[0] === 'profile' && parts[1]) return { name: 'profile', handle: decodeURIComponent(parts[1]) };
  return { name: 'board' };
}

function go(href) {
  if (location.hash === href) route();
  else location.hash = href;
}

const chrome = mountChrome(root, go);

// The shell's live rail: mounted lazily the first time a non-board view
// shows (its renderer lives in board.js and reads through the shared
// cache), then kept mounted — routes only toggle its visibility and its
// active row. The board route hides it: the board's own list is the
// master list there, beside its detail pane.
let rail = null;
let railLoading = false;
function syncRail(r) {
  const want = r.name === 'bounty' || r.name === 'leaderboard' || r.name === 'profile';
  chrome.setRail(want);
  if (!want) return;
  const slug = r.slug || null;
  if (rail) {
    rail.setActive(slug);
  } else if (!railLoading) {
    railLoading = true;
    import('./board.js').then((mod) => {
      rail = mod.mountRail(chrome.rail, go);
      rail.setActive(slug);
    }).catch(() => {});
  }
}

// "/" focuses the board search from anywhere — unless the reader is
// already typing in a field. Off the board route it navigates first,
// then dispatches as the board mounts (module load is the slow part,
// so the dispatch repeats while the view settles).
window.addEventListener('keydown', (ev) => {
  if (ev.key !== '/' || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const t = ev.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  ev.preventDefault();
  const focus = () => window.dispatchEvent(new Event('mf:focus-search'));
  if (parse(location.hash).name === 'board') focus();
  else {
    go('#/');
    setTimeout(focus, 80);
    setTimeout(focus, 350);
    setTimeout(focus, 900);
  }
});

// Screenshot scripts (and patient readers) wait for this flag: it turns
// true once the current view has real content on screen, not a spinner.
function armShotReady() {
  window.__shotReady = false;
  if (readyTimer) clearInterval(readyTimer);
  readyTimer = setInterval(() => {
    const painted = chrome.content.querySelector('.brow, .lb tbody tr, .profile-head, .pane h1, .error');
    if (painted) {
      window.__shotReady = true;
      clearInterval(readyTimer);
    }
  }, 120);
}

async function route() {
  const r = parse(location.hash);
  const token = ++navToken;
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
  document.title = TITLES[r.name];
  window.scrollTo(0, 0);
  chrome.setCurrent(
    r.name === 'board' ? '#/' : r.name === 'bounty'
      ? '#/bounty/makefun-frontend-01'
      : r.name === 'leaderboard' ? '#/bounty/makefun-frontend-01/leaderboard' : '',
  );
  syncRail(r);
  armShotReady();
  try {
    const mod = await ROUTES[r.name]();
    if (token !== navToken) return;
    if (r.name === 'board') cleanup = mod.renderBoard(chrome.content, go) || null;
    else if (r.name === 'bounty') cleanup = mod.renderBounty(chrome.content, go, r.slug) || null;
    else if (r.name === 'leaderboard') cleanup = mod.renderLeaderboard(chrome.content, go, r.slug) || null;
    else cleanup = mod.renderProfile(chrome.content, go, r.handle) || null;
  } catch (err) {
    if (token !== navToken) return;
    chrome.content.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'error';
    p.textContent = 'This view could not load: ' + err.message;
    chrome.content.append(p);
  }
}

window.addEventListener('hashchange', route);
route();
// Warm the shared cache with the board once the first view is on its
// way, so the rail (and a later visit to the board) paint from cache.
setTimeout(warmBoard, 400);
