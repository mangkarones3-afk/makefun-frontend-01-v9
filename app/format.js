// format.js — turning API values into the words and figures the page shows.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const num = new Intl.NumberFormat('en-US');

// money accepts the API's shapes: a number of dollars, or a string like "783.00".
export const money = (v) => usd.format(Number(v) || 0);
export const int = (v) => num.format(Number(v) || 0);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

// Dates are read in UTC so the page says the same thing in every timezone.
export function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return (
    MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + pad(d.getUTCHours()) + ':' +
    pad(d.getUTCMinutes()) + ' UTC'
  );
}

// "14:32 UTC" — the time of day alone, for "as of" lines.
export function fmtTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ' UTC';
}

export const msLeft = (iso) => new Date(iso).getTime() - Date.now();

// "2d 4h left" / "5h 12m left" / "Closed" — the compact form rows carry.
export function timeLeft(iso) {
  const ms = msLeft(iso);
  if (ms <= 0) return 'Closed';
  const m = Math.floor(ms / 60000);
  if (m >= 2880) return Math.floor(m / 1440) + 'd ' + Math.floor((m % 1440) / 60) + 'h left';
  if (m >= 120) return Math.floor(m / 60) + 'h ' + (m % 60) + 'm left';
  if (m >= 1) return m + 'm left';
  return 'Under a minute left';
}

// The pane's deadline clock: "1d 05:12:33" ticking down to the deadline.
export function countdown(iso) {
  const ms = msLeft(iso);
  if (ms <= 0) return 'Closed';
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const clock = pad(Math.floor((s % 86400) / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
  return days > 0 ? days + 'd ' + clock : clock;
}

export const clamp = (s, n) => {
  const t = String(s ?? '');
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};

export const kb = (bytes) => {
  const b = Number(bytes) || 0;
  return b >= 1024 ? (b / 1024).toFixed(1) + ' KB' : b + ' B';
};

// A small markdown renderer for bounty descriptions: headings, lists,
// **bold**, `code`, links and paragraphs. Input is escaped first, so a
// description can never inject markup of its own.
export function md(text) {
  const inline = (s) =>
    s
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const out = [];
  let list = null; // { tag: 'ul' | 'ol', items: string }
  const closeList = () => {
    if (list) {
      out.push('<' + list.tag + '>' + list.items + '</' + list.tag + '>');
      list = null;
    }
  };
  const addItem = (tag, text) => {
    if (!list || list.tag !== tag) {
      closeList();
      list = { tag, items: '' };
    }
    list.items += '<li>' + inline(esc(text)) + '</li>';
  };
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trimEnd();
    const head = line.match(/^(#{1,3})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (head) {
      closeList();
      const level = head[1].length + 1;
      out.push('<h' + level + '>' + inline(esc(head[2])) + '</h' + level + '>');
    } else if (bullet) {
      addItem('ul', bullet[1]);
    } else if (numbered) {
      addItem('ol', numbered[1]);
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      out.push('<p>' + inline(esc(line)) + '</p>');
    }
  }
  closeList();
  return out.join('');
}
