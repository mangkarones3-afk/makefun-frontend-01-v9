// leaderboard.js — a bounty's leaderboard, drawn in windows of WINDOW
// rows: the full field can run to thousands, so the page appends the next
// window on demand instead of building it all. The interval is labelled
// at the level the API itself publishes for each entry.

import { leaderboard as fetchLeaderboard, bounty as fetchBounty, setDrawn, WINDOW } from './api.js';
import { esc, money, kb } from './format.js';
import { h, medal, wdlChips } from './pieces.js';

const pct = (micro) => (Number(micro || 0) / 10000).toFixed(2) + '%';

export function renderLeaderboard(content, go, slug) {
  let alive = true;
  content.innerHTML = '';
  const panel = h('section', 'panel panel-pad');
  panel.append(h('p', 'empty', 'Loading the leaderboard…'));
  content.append(panel);

  Promise.all([fetchLeaderboard(slug), fetchBounty(slug).catch(() => null)])
    .then(([data, bounty]) => {
      if (!alive) return;
      const entries = data.entries || [];
      const payByPlace = new Map();
      if (bounty) {
        if (Array.isArray(bounty.rewardsNow)) {
          for (const r of bounty.rewardsNow) payByPlace.set(r.place, r.amountUsd);
        } else if (bounty.rewards) {
          for (const [place, amount] of Object.entries(bounty.rewards)) payByPlace.set(Number(place), amount);
        }
      }
      panel.replaceChildren();
      panel.append(h('h1', '', data.title || 'Leaderboard'));
      const phase = data.phase?.title ? ' · ' + data.phase.title : '';
      panel.append(h('p', 'lede', entries.length + ' ranked entries' + phase + '. Rows arrive in windows of ' + WINDOW + '.'));

      const table = h('table', 'lb');
      table.innerHTML =
        '<thead><tr><th>Rank</th><th>Hunter</th><th class="n">Win rate</th><th>Interval</th>' +
        '<th>Record</th><th class="n col-dossier">Dossier</th><th class="n">Prize</th></tr></thead>';
      const tbody = h('tbody');
      table.append(tbody);
      panel.append(table);

      const more = h('button', 'showmore', 'Show more');
      more.type = 'button';
      let shown = 0;

      // Avatars are images the API's own answers point at; each carries
      // crossorigin="anonymous", as the API's resource policy requires.
      const avatarHtml = (url) =>
        url
          ? '<img crossorigin="anonymous" alt="" loading="lazy" src="' +
            esc(url.startsWith('http') ? url : 'https://make.fun' + url) + '">'
          : '';
      const rowHtml = (e) => {
        const level = e.interval?.level ? Math.round(Number(e.interval.level) * 100) + '% interval' : 'Interval';
        const range = e.values ? pct(e.values.judge_low) + ' to ' + pct(e.values.judge_high) : '';
        const prize = e.prize_rank && payByPlace.has(e.prize_rank) ? money(payByPlace.get(e.prize_rank)) : '—';
        return (
          '<tr><td>' + medal(e.rank) + '</td>' +
          '<td><div class="who">' + avatarHtml(e.image) + '<span><a href="#/profile/' +
          encodeURIComponent(e.handle) + '">@' + esc(e.handle) + '</a>' +
          '<span class="lb-title" style="display:block">' + esc(e.title || '') + '</span></span></div></td>' +
          '<td class="n rate">' + pct(e.values?.judge) + '</td>' +
          '<td>' + level + '<span class="lb-title" style="display:block">' + range + '</span></td>' +
          '<td>' + wdlChips(e.judge) + '</td>' +
          '<td class="n col-dossier">' + kb(e.values?.bytes) + '</td>' +
          '<td class="n">' + prize + '</td></tr>'
        );
      };

      const draw = () => {
        const next = entries.slice(shown, shown + WINDOW);
        tbody.insertAdjacentHTML('beforeend', next.map(rowHtml).join(''));
        shown += next.length;
        setDrawn(shown);
        more.hidden = shown >= entries.length;
        more.textContent = 'Show more (' + shown + ' of ' + entries.length + ' shown)';
      };
      more.addEventListener('click', draw);
      draw();
      if (entries.length > WINDOW) panel.append(more);
    })
    .catch((err) => {
      if (!alive) return;
      panel.replaceChildren(h('p', 'error', 'This leaderboard could not load: ' + err.message));
    });

  return () => {
    alive = false;
    setDrawn(0);
  };
}
