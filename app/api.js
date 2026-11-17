// api.js — the one door to make.fun's public API.
//
// Every view reads through this module, so the whole app shares one cache:
// an answer stays fresh for FRESH_MS, then revalidates with If-None-Match
// (the API binds its ETags to the minute, so a 304 costs no body), and two
// callers asking for the same path at the same time share one request.
// The counters below feed the header's live cluster, so what the strategy
// claims is what the page can be seen doing.

export const API_ORIGIN = 'https://make.fun';
const API = API_ORIGIN + '/api';

export const WINDOW = 60; // leaderboard rows drawn per window
export const FRESH_MS = 45000; // a cached answer is fresh for 45 seconds
export const STRATEGY =
  'One shared cache for every view: answers stay fresh 45 s, then revalidate by ETag; ' +
  'identical requests in flight are shared; long lists render in windows of 60 rows.';

export const stats = { requests: 0, unchanged: 0, cached: 0, drawn: 0 };

let listener = null;
export function watchStats(fn) {
  listener = fn;
}
function emit() {
  if (listener) listener({ ...stats });
}
export function setDrawn(n) {
  if (stats.drawn !== n) {
    stats.drawn = n;
    emit();
  }
}

const cache = new Map(); // url -> { etag, body, at }
const inflight = new Map(); // url -> Promise<body>

export function get(path) {
  const url = API + path;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < FRESH_MS) {
    stats.cached += 1;
    emit();
    return Promise.resolve(hit.body);
  }
  if (inflight.has(url)) return inflight.get(url);
  const pending = (async () => {
    const headers = {};
    if (hit && hit.etag) headers['If-None-Match'] = hit.etag;
    stats.requests += 1;
    emit();
    const res = await fetch(url, { headers });
    if (res.status === 304 && hit) {
      hit.at = Date.now();
      stats.unchanged += 1;
      emit();
      return hit.body;
    }
    if (!res.ok) throw new Error('make.fun answered ' + res.status + ' for ' + path);
    const body = await res.json();
    cache.set(url, { etag: res.headers.get('etag'), body, at: Date.now() });
    return body;
  })();
  inflight.set(url, pending);
  const settle = () => {
    if (inflight.get(url) === pending) inflight.delete(url);
  };
  pending.then(settle, settle);
  return pending;
}

// The board: one page of competitions normally covers the whole board; a
// cursor is followed only while the API keeps offering one (3 pages max).
export async function board() {
  const items = [];
  const seen = new Set();
  let path = '/competitions?limit=100';
  for (let page = 0; page < 3 && path; page += 1) {
    const data = await get(path);
    for (const item of data.items || []) {
      if (seen.has(item.slug)) continue; // cursor pages may overlap
      seen.add(item.slug);
      items.push(item);
    }
    path = data.next_cursor
      ? '/competitions?limit=100&cursor=' + encodeURIComponent(data.next_cursor)
      : null;
  }
  return items;
}

export const bounty = (slug) => get('/competitions/' + encodeURIComponent(slug));
export const leaderboard = (slug) =>
  get('/competitions/' + encodeURIComponent(slug) + '/leaderboard');
export const profile = (handle) => get('/profiles/' + encodeURIComponent(handle));

// Warm the shared cache with the board ahead of need: the shell's rail
// and the board view both read it, so one early fetch lets either paint
// from cache. Failures are silent — a cold cache is the normal fallback.
export function warmBoard() {
  board().catch(() => {});
}
