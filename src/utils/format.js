const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});
const timeFormatter = new Intl.DateTimeFormat('en', { timeStyle: 'medium' });

const UNITS = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
  ['second', 1000],
];

function toDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelative(value, now = Date.now()) {
  const date = toDate(value);
  if (!date) return '—';
  const diff = date.getTime() - now;
  if (Math.abs(diff) < 5000) return 'just now';
  for (const [unit, size] of UNITS) {
    if (Math.abs(diff) >= size || unit === 'second') {
      return relativeFormatter.format(Math.round(diff / size), unit);
    }
  }
  return '—';
}

export function formatDateTime(value) {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : '—';
}

export function formatTime(value) {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : '—';
}

export function formatMs(value) {
  if (!Number.isFinite(value)) return '—';
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(value < 10_000 ? 2 : 1)} s`;
}

export function formatPercent(ratio) {
  if (!Number.isFinite(ratio)) return '—';
  const percent = ratio * 100;
  return `${percent === 100 || percent === 0 ? percent.toFixed(0) : percent.toFixed(1)}%`;
}

export function formatCountdown(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function humanize(value) {
  if (!value) return '';
  const text = String(value).replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function labelFor(group, value) {
  return group[value] ?? humanize(value);
}
