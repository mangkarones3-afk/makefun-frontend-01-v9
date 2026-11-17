// profile.js — an account's public profile: who they are, their record
// across every bounty they have entered, and their recent entries, each
// linking onward to its bounty.

import { profile as fetchProfile, setDrawn } from './api.js';
import { money, int, fmtDate } from './format.js';
import { h, factCard, avatar } from './pieces.js';

export function renderProfile(content, go, handle) {
  let alive = true;
  content.innerHTML = '';
  const panel = h('section', 'panel panel-pad');
  panel.append(h('p', 'empty', 'Loading @' + handle + '…'));
  content.append(panel);

  fetchProfile(handle)
    .then((p) => {
      if (!alive) return;
      const rec = p.record || {};
      panel.replaceChildren();
      const head = h('div', 'profile-head');
      const img = avatar(p.avatar?.url || p.image, '');
      if (img) head.append(img);
      const who = h('div');
      who.append(h('h1', '', '@' + p.handle));
      if (p.bio) who.append(h('p', 'bio', p.bio));
      head.append(who);
      panel.append(head);

      const facts = h('div', 'facts', [
        factCard('Entered', int(rec.competitions_entered), 'Bounties entered'),
        factCard('Placed', int(rec.competitions_placed), 'In the paid places'),
        factCard('Won', int(rec.competitions_won), 'First places'),
        factCard('Best placement', rec.best_placement ? '#' + int(rec.best_placement) : '—', 'Across all bounties'),
        factCard('Podiums', int(rec.podium_finishes), 'Top-three finishes'),
        factCard('Prizes', money(rec.prize_usd), 'Won on make.fun'),
      ]);
      panel.append(facts);

      const meta = h('p', 'lede', 'Joined ' + fmtDate(p.joined_at) + (p.github_login ? ' · GitHub @' + p.github_login : ''));
      panel.append(meta);
      if (p.wallet?.address) {
        const line = h('p');
        const link = h('a', '', 'Wallet ' + p.wallet.address);
        link.href = p.wallet.explorer_url || '#';
        link.target = '_blank';
        link.rel = 'noopener';
        line.append(link);
        panel.append(line);
      }
      if (p.profile_url) {
        const line = h('p');
        const link = h('a', '', 'This profile on make.fun');
        link.href = 'https://make.fun' + p.profile_url;
        link.target = '_blank';
        link.rel = 'noopener';
        line.append(link);
        panel.append(line);
      }

      const solutions = Array.isArray(p.solutions) ? p.solutions : [];
      panel.append(h('h2', '', 'Recent entries'));
      if (!solutions.length) {
        panel.append(h('p', 'empty', 'No entries yet.'));
      } else {
        const list = h('ul', 'solutions');
        for (const s of solutions.slice(0, 12)) {
          const li = h('li');
          const title = h('a', '', s.title || 'Entry');
          title.href = '#/bounty/' + (s.competition?.slug || '');
          const comp = h('div', 'comp',
            (s.competition?.title || '') +
            (s.competition?.pot_usd ? ' · pot ' + money(s.competition.pot_usd) : '') +
            (s.competition?.deadline ? ' · closes ' + fmtDate(s.competition.deadline) : '') +
            (s.placement ? ' · placed #' + s.placement : '') +
            (s.prize_usd ? ' · won ' + money(s.prize_usd) : ''));
          li.append(title, comp);
          list.append(li);
        }
        panel.append(list);
        setDrawn(Math.min(12, solutions.length));
      }
    })
    .catch((err) => {
      if (!alive) return;
      panel.replaceChildren(
        h('p', 'error', 'No public profile loaded for @' + handle + ' (' + err.message + '). Check the handle and try again.'),
      );
    });

  return () => {
    alive = false;
    setDrawn(0);
  };
}
