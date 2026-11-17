// pieces.js — the small parts every view is assembled from, so the board,
// the bounty page, the leaderboard and the profile all speak one language.

import { esc, fmtDate, money } from './format.js';

// A tiny element builder: h('div', 'card', 'text') or h('div', 'card', [kids]).
export function h(tag, cls, content) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (typeof content === 'string') el.textContent = content;
  else if (Array.isArray(content)) for (const kid of content) if (kid) el.append(kid);
  else if (content) el.append(content);
  return el;
}

// One status test for the whole app, taken from the deadline alone: a
// bounty past its deadline takes no entries whatever its status still says.
export function statusOf(bounty) {
  const left = new Date(bounty.deadline).getTime() - Date.now();
  if (left <= 0) return { key: 'closed', label: 'Closed' };
  if (left < 24 * 3600 * 1000) return { key: 'closing', label: 'Closing soon' };
  return { key: 'open', label: 'Open' };
}

export const chip = (status) => h('span', 'chip chip-' + status.key, status.label);

// A fact card: a quiet label, one big tabular figure, an optional sub-line.
export function factCard(label, value, sub) {
  const kids = [h('span', 'fact-label', label), h('span', 'fact-value', value)];
  if (sub) kids.push(h('span', 'fact-sub', sub));
  return h('div', 'fact', kids);
}

// The phase stepper: Opened, Now, Deadline, Results by — a bounty's life
// as a sequence, so the one place the design numbers its steps.
export function stepper(bounty) {
  const now = Date.now();
  const opened = new Date(bounty.publishedAt).getTime();
  const deadline = new Date(bounty.deadline).getTime();
  const results = deadline + 24 * 3600 * 1000;
  const steps = [
    { name: 'Opened', at: opened, state: 'done' },
    { name: 'Now', at: now, state: now < deadline ? 'current' : 'done' },
    { name: 'Deadline', at: deadline, state: now < deadline ? 'todo' : 'done' },
    { name: 'Results by', at: results, state: now < results ? 'todo' : 'done' },
  ];
  const wrap = h('ol', 'stepper');
  wrap.setAttribute('aria-label', 'Bounty timeline');
  for (const s of steps) {
    const dot = h('span', 'step-dot');
    dot.setAttribute('aria-hidden', 'true');
    wrap.append(
      h('li', 'step step-' + s.state, [
        dot,
        h('span', 'step-name', s.name),
        h('span', 'step-at', fmtDate(new Date(s.at).toISOString())),
      ]),
    );
  }
  return wrap;
}

// The rewards table: what each place pays now, fee share included, the
// winning row picked out. Falls back to the base rewards map when the
// API's per-place "now" figures are absent.
export function rewardsTable(bounty) {
  const rows = [];
  const now = Array.isArray(bounty.rewardsNow) ? bounty.rewardsNow : [];
  if (now.length) {
    for (const r of now) {
      rows.push({ place: r.place, amount: r.amountUsd, note: 'base ' + money(r.baseUsd) + ' + fees ' + money(r.feeShareUsd) });
    }
  } else if (bounty.rewards) {
    for (const place of Object.keys(bounty.rewards).sort((a, b) => a - b)) {
      rows.push({ place: Number(place), amount: bounty.rewards[place], note: 'base prize' });
    }
  }
  if (!rows.length) return '<p class="empty">No rewards table published.</p>';
  const body = rows
    .map(
      (r) =>
        '<tr' + (r.place === 1 ? ' class="top-row"' : '') + '><td class="place">#' + r.place +
        '</td><td class="pay">' + money(r.amount) + '</td><td class="note">' + esc(r.note) + '</td></tr>',
    )
    .join('');
  return '<table class="rewards"><thead><tr><th>Place</th><th>Pays now</th><th></th></tr></thead><tbody>' + body + '</tbody></table>';
}

// A record as three small segments: wins, draws, losses.
export function wdlChips(judge) {
  if (!judge) return '';
  return (
    '<span class="wdl" role="img" aria-label="Record: ' + judge.wins + ' wins, ' + judge.draws +
    ' draws, ' + judge.losses + ' losses"><span class="wdl-w">' + judge.wins + ' W</span>' +
    '<span class="wdl-d">' + judge.draws + ' D</span>' +
    '<span class="wdl-l">' + judge.losses + ' L</span></span>'
  );
}

// Ranks 1–3 get a medal chip; the rest get their number, plainly.
export function medal(rank) {
  if (rank >= 1 && rank <= 3) return '<span class="medal medal-' + rank + '">' + rank + '</span>';
  return '<span class="rank-num">' + rank + '</span>';
}

// Avatars the API points at; crossorigin is set before src, as the API's
// Cross-Origin-Resource-Policy requires.
export function avatar(url, cls) {
  if (!url) return null;
  const img = document.createElement('img');
  img.className = cls || 'avatar';
  img.alt = '';
  img.loading = 'lazy';
  img.crossOrigin = 'anonymous';
  img.src = url.startsWith('http') ? url : 'https://make.fun' + url;
  img.addEventListener('error', () => img.remove());
  return img;
}
