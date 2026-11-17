// chrome.js — the frame every view sits in: the ink header band with the
// wordmark, navigation and a profile lookup; the live bar, where the app's
// own request counters sit as a product feature (a pulse dot, the word
// Live, and labeled stat groups — not a debug strip); the strategy caption
// beneath it; and the stylesheet, which travels with this module so the
// shell's first load stays a single small file.

import { watchStats } from './api.js';
import { h } from './pieces.js';

const CSS = `
:root{
  --ink:#10161b; --paper:#f6f8f6; --panel:#ffffff; --line:#e2e8e3;
  --text:#1c2420; --muted:#4e5a63; --accent:#0c7a3e; --accent-soft:#e5f2ea;
  --amber:#b45309; --amber-soft:#fdf0e0; --red:#b3261e; --red-soft:#fbeae8;
  --gold:#a87b12; --gold-soft:#f7ecd2; --silver:#6d7680; --silver-soft:#eceff1;
  --bronze:#9a5b33; --bronze-soft:#f6e8dd;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--paper);color:var(--text);
  font-family:ui-sans-system,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-size:15px;line-height:1.55}
a{color:var(--accent);text-decoration:none;text-underline-offset:2px}
a:hover{text-decoration:underline}
::selection{background:var(--accent-soft)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.num,.fact-value,.pay,.clock,td.n,th.n{font-variant-numeric:tabular-nums}

/* header */
.topbar{background:var(--ink);color:#eef2ee}
.topbar-in{max-width:1180px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.wordmark{color:#fff;font-weight:800;font-size:19px;letter-spacing:-.01em}
.wordmark .dot{color:#37c978}
.wordmark:hover{text-decoration:none}
.mainnav{display:flex;gap:16px}
.mainnav a{color:#c8d2c9;font-size:14px}
.mainnav a[aria-current="page"]{color:#fff;font-weight:600}
.lookup{margin-left:auto;display:flex;gap:8px}
.lookup input{background:#1b242c;border:1px solid #33404a;color:#eef2ee;border-radius:8px;
  padding:6px 10px;font-size:14px;width:170px}
.lookup input::placeholder{color:#8b98a0}
.lookup button{background:var(--accent);border:0;color:#fff;border-radius:8px;padding:6px 12px;
  font-size:14px;cursor:pointer;font-weight:600}

/* live bar */
.livebar{background:var(--panel);border-bottom:1px solid var(--line)}
.livebar-in{max-width:1180px;margin:0 auto;padding:8px 20px;display:flex;align-items:center;gap:26px;flex-wrap:wrap}
.live-flag{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:var(--text)}
.pulse{width:9px;height:9px;border-radius:50%;background:var(--accent);animation:pulse 2s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(12,122,62,.35)}70%{box-shadow:0 0 0 7px rgba(12,122,62,0)}100%{box-shadow:0 0 0 0 rgba(12,122,62,0)}}
@media (prefers-reduced-motion:reduce){.pulse{animation:none}}
.statgroup{display:flex;align-items:baseline;gap:7px}
.statgroup .k{font-size:12.5px;color:var(--muted)}
.statgroup .v{font-size:14px;font-weight:700}
.caption{max-width:1180px;margin:0 auto;padding:6px 20px 0;font-size:12.5px;color:var(--muted)}

/* layout */
.shell{max-width:1180px;margin:0 auto}
#content{padding:18px 20px 30px}
.rail{display:none}
@media (min-width:1024px){
  .shell.has-rail{max-width:1440px;display:grid;grid-template-columns:268px minmax(0,1fr);
    gap:20px;padding:0 20px}
  .shell.has-rail #content{padding:18px 0 30px}
  .shell.has-rail .rail{display:block;position:sticky;top:18px;margin-top:18px;
    max-height:calc(100vh - 36px);overflow-y:auto;scrollbar-width:thin}
  .rail::-webkit-scrollbar{width:8px}
  .rail::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px}
}
.rail-head{padding:13px 15px 10px;border-bottom:1px solid var(--line);
  display:flex;align-items:baseline;gap:8px}
.rail-title{font-weight:700;font-size:14px}
.rail-count{font-size:12.5px;color:var(--muted)}
.rail-note{margin:0;padding:9px 15px 12px;font-size:12px;color:var(--muted);line-height:1.45}
.rrow{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);
  padding:10px 15px;cursor:pointer;color:var(--text)}
.rrow:last-child{border-bottom:0}
.rrow:hover{background:var(--paper)}
.rrow.sel{background:var(--accent-soft);box-shadow:inset 3px 0 0 var(--accent)}
.rrow:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.rrow-title{display:block;font-weight:600;font-size:13.5px;line-height:1.35}
.rrow-meta{display:flex;gap:10px;margin-top:3px;font-size:12.5px;color:var(--muted);flex-wrap:wrap}
.rrow-meta .pot{color:var(--accent);font-weight:700}
.board{display:grid;grid-template-columns:400px 1fr;gap:18px;align-items:start}
@media (max-width:820px){.board{grid-template-columns:1fr}}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px}
.panel-pad{padding:20px 22px}
h1{font-size:25px;line-height:1.22;margin:0 0 8px;letter-spacing:-.015em}
h2{font-size:16px;font-weight:700;margin:26px 0 10px;letter-spacing:-.005em}
.lede{color:var(--muted);margin:0 0 14px;line-height:1.55}
.empty{color:var(--muted)}
.error{background:var(--red-soft);border:1px solid var(--red);color:var(--red);
  border-radius:10px;padding:12px 14px}

/* toolbar */
.toolbar{padding:14px 16px;border-bottom:1px solid var(--line);display:grid;gap:10px}
.search{width:100%;padding:9px 12px;font-size:14.5px;border:1px solid var(--line);
  border-radius:9px;background:var(--paper);color:var(--text)}
.chips{display:flex;gap:7px;flex-wrap:wrap}
.fchip{border:1px solid var(--line);background:var(--panel);color:var(--muted);border-radius:999px;
  padding:4px 12px;font-size:13px;cursor:pointer}
.fchip[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff;font-weight:600}
.sortrow{display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--muted)}
.sortrow select{font-size:13.5px;padding:5px 8px;border:1px solid var(--line);border-radius:8px;
  background:var(--panel);color:var(--text)}
.board-count{padding:9px 16px;font-size:13px;color:var(--muted);border-bottom:1px solid var(--line)}

/* board rows */
.brow{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);
  padding:13px 16px;cursor:pointer;color:var(--text)}
.brow:last-child{border-bottom:0}
.brow:hover{background:var(--paper)}
.brow.sel{background:var(--accent-soft);box-shadow:inset 3px 0 0 var(--accent)}
.brow-top{display:flex;align-items:baseline;gap:10px}
.brow-title{font-weight:600;font-size:14.5px;line-height:1.35;flex:1}
.brow-entries{font-size:12.5px;color:var(--muted);white-space:nowrap}
.brow-meta{display:flex;gap:14px;margin-top:4px;font-size:13px;color:var(--muted);flex-wrap:wrap}
.brow-meta .pot{color:var(--accent);font-weight:700}
.chip{font-size:11.5px;font-weight:700;padding:2px 9px;border-radius:999px;white-space:nowrap}
.chip-open{background:var(--accent-soft);color:var(--accent)}
.chip-closing{background:var(--amber-soft);color:var(--amber)}
.chip-closed{background:var(--red-soft);color:var(--red)}

/* detail pane */
.pane-head{display:flex;gap:10px;align-items:flex-start}
.pane-head h1{flex:1}
.summary{color:var(--muted);margin:2px 0 14px;display:-webkit-box;-webkit-line-clamp:2;
  -webkit-box-orient:vertical;overflow:hidden}
.clock-block{margin:16px 0 4px}
.clock-label{font-size:13px;color:var(--muted)}
.clock{font-size:40px;font-weight:800;letter-spacing:-.01em;color:var(--accent);line-height:1.1}
.clock.is-closed{color:var(--red)}
.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}
@media (max-width:560px){.facts{grid-template-columns:repeat(2,1fr)}.clock{font-size:32px}}
.fact{border:1px solid var(--line);border-radius:11px;padding:11px 14px;display:grid;gap:2px;background:var(--panel)}
.fact-label{font-size:12.5px;color:var(--muted)}
.fact-value{font-size:19px;font-weight:800;letter-spacing:-.01em}
.fact-sub{font-size:12px;color:var(--muted)}

/* stepper */
.stepper{display:flex;list-style:none;margin:18px 0 4px;padding:0}
.step{flex:1;position:relative;padding-top:16px}
.step::before{content:"";position:absolute;top:5px;left:0;right:0;height:2px;background:var(--line)}
.step:first-child::before{left:50%}
.step:last-child::before{right:50%}
.step-dot{position:absolute;top:0;left:calc(50% - 6px);width:12px;height:12px;border-radius:50%;
  background:var(--panel);border:2px solid var(--line)}
.step-done .step-dot{background:var(--accent);border-color:var(--accent)}
.step-current .step-dot{background:var(--panel);border-color:var(--accent);
  box-shadow:0 0 0 4px var(--accent-soft)}
.step-name{display:block;text-align:center;font-size:13px;font-weight:600}
.step-at{display:block;text-align:center;font-size:11.5px;color:var(--muted)}

/* tables */
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-size:12.5px;color:var(--muted);font-weight:600;padding:8px 10px;border-bottom:1px solid var(--line)}
td{padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:middle}
.rewards .pay{font-weight:700;color:var(--accent)}
.rewards .note{color:var(--muted);font-size:12.5px}
.rewards .top-row td{background:var(--accent-soft)}
.lb .who{display:flex;align-items:center;gap:9px}
.lb .who img{width:26px;height:26px;border-radius:50%}
.lb-title{color:var(--muted);font-size:12.5px}
.rate{font-weight:800}
.medal{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;
  border-radius:50%;font-weight:800;font-size:13px}
.medal-1{background:var(--gold-soft);color:var(--gold)}
.medal-2{background:var(--silver-soft);color:var(--silver)}
.medal-3{background:var(--bronze-soft);color:var(--bronze)}
.rank-num{font-weight:600;color:var(--muted)}
.wdl{display:inline-flex;gap:4px}
.wdl span{font-size:12px;font-weight:700;padding:2px 7px;border-radius:6px;background:var(--paper);border:1px solid var(--line)}
.wdl .wdl-w{color:var(--accent)}
.wdl .wdl-l{color:var(--red)}
.showmore{margin:14px 0 4px;background:var(--ink);color:#fff;border:0;border-radius:9px;
  padding:9px 16px;font-size:14px;font-weight:600;cursor:pointer}

/* profile */
.profile-head{display:flex;gap:16px;align-items:center}
.profile-head img{width:72px;height:72px;border-radius:50%}
.profile-head .bio{color:var(--muted);margin:4px 0 0}

/* with the rail beside it at screenshot widths, the leaderboard sheds
   its least vital column rather than squeezing all seven */
@media (min-width:1024px) and (max-width:1179px){
  .shell.has-rail .col-dossier{display:none}
}
.solutions{list-style:none;margin:0;padding:0}
.solutions li{padding:10px 0;border-bottom:1px solid var(--line)}
.solutions li:last-child{border-bottom:0}
.solutions .comp{color:var(--muted);font-size:13px}

/* bounty page */
.body-text{max-width:72ch}
.body-text h2{font-size:16px}
.body-text code{background:var(--paper);border:1px solid var(--line);border-radius:5px;padding:0 5px;font-size:13px}

/* footer */
.foot{border-top:1px solid var(--line);margin-top:10px}
.foot-in{max-width:1180px;margin:0 auto;padding:16px 20px 26px;color:var(--muted);font-size:13px;
  display:flex;gap:20px;flex-wrap:wrap}
`;

export function mountChrome(root, go) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const header = h('header', 'topbar');
  const bar = h('div', 'topbar-in');
  const mark = h('a', 'wordmark');
  mark.href = '#/';
  mark.innerHTML = 'make.fun<span class="dot">.</span> board';
  const nav = h('nav', 'mainnav');
  const links = [
    ['Board', '#/'],
    ['This bounty', '#/bounty/makefun-frontend-01'],
    ['Leaderboard', '#/bounty/makefun-frontend-01/leaderboard'],
  ];
  const linkEls = links.map(([label, href]) => {
    const a = h('a', '', label);
    a.href = href;
    a.dataset.route = href;
    nav.append(a);
    return a;
  });
  const lookup = h('form', 'lookup');
  const input = h('input');
  input.type = 'search';
  input.placeholder = 'Profile handle, e.g. mangkarones';
  input.setAttribute('aria-label', 'Profile handle');
  const button = h('button', '', 'View profile');
  button.type = 'submit';
  lookup.append(input, button);
  lookup.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const handle = input.value.trim().replace(/^@/, '');
    if (handle) go('#/profile/' + encodeURIComponent(handle));
  });
  bar.append(mark, nav, lookup);
  header.append(bar);

  const livebar = h('div', 'livebar');
  const liveIn = h('div', 'livebar-in');
  const flag = h('div', 'live-flag', [h('span', 'pulse'), h('span', '', 'Live')]);
  liveIn.append(flag);
  const groups = {};
  for (const [key, label] of [
    ['requests', 'API requests'],
    ['unchanged', 'ETag revalidated'],
    ['cached', 'Served from cache'],
    ['drawn', 'Rows on screen'],
  ]) {
    const value = h('span', 'v num', '0');
    groups[key] = value;
    liveIn.append(h('div', 'statgroup', [h('span', 'k', label), value]));
  }
  livebar.append(liveIn);
  watchStats((s) => {
    for (const key of Object.keys(groups)) groups[key].textContent = String(s[key]);
  });

  const caption = h('p', 'caption');
  caption.textContent =
    'A 411-byte shell (282 B at gzip-9) boots this client by import(); each view loads only its own module. ' +
    'Figures come from the make.fun public API and refresh through one shared cache — the board rail beside the wider views reads through the same cache, so it costs no requests of its own.';

  const content = h('main');
  content.id = 'content';
  // The master-detail shell: on wide screens a live board rail sits in
  // the aside beside whichever view is showing; below that width, and on
  // the board route itself, the shell is a plain single column and the
  // rail is not displayed. The rail's rows are rendered by board.js.
  const shell = h('div', 'shell');
  const rail = h('aside', 'rail panel');
  rail.id = 'rail';
  rail.setAttribute('aria-label', 'Live board');
  shell.append(rail, content);
  const foot = h('footer', 'foot');
  const footIn = h('div', 'foot-in');
  const footNote = h('span', '', 'A static client for make.fun. It reads the public API only — no sign-in, no writes.');
  const bountyLink = h('a', '', 'The bounty this client was built for');
  bountyLink.href = 'https://make.fun/bounty/makefun-frontend-01';
  footIn.append(footNote, bountyLink);
  foot.append(footIn);

  root.append(header, livebar, caption, shell, foot);

  return {
    content,
    rail,
    setRail(on) {
      shell.classList.toggle('has-rail', !!on);
    },
    setCurrent(href) {
      for (const a of linkEls) {
        if (a.dataset.route === href) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
    },
  };
}
