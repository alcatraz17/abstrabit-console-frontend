import { LABELS } from '../../common/constants.js';
import { cx } from '../../utils/cx.js';
import { labelFor } from '../../utils/format.js';

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  accent: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

const STATUS_TONES = {
  done: 'success',
  succeeded: 'success',
  connected: 'success',
  resolved: 'success',
  processing: 'info',
  received: 'info',
  pending: 'info',
  running: 'info',
  acknowledged: 'info',
  partial: 'warning',
  retrying: 'warning',
  needs_attention: 'warning',
  escalated: 'warning',
  open: 'accent',
  failed: 'danger',
  dead: 'danger',
  blocked: 'neutral',
  skipped: 'neutral',
  disconnected: 'neutral',
};

const PRIORITY_TONES = { high: 'danger', normal: 'neutral', low: 'info' };

export function Badge({ tone = 'neutral', children, className, title }) {
  return (
    <span
      title={title}
      className={cx(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, children, title }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? 'neutral'} title={title}>
      {children ?? labelFor(LABELS.status, status)}
    </Badge>
  );
}

export function PriorityBadge({ priority }) {
  if (!priority) return null;
  return <Badge tone={PRIORITY_TONES[priority] ?? 'neutral'}>{labelFor({}, priority)}</Badge>;
}
