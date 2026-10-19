import { formatDateTime, formatRelative } from '../../utils/format.js';
import { useNow } from '../../hooks/useNow.js';

export function RelativeTime({ value, className }) {
  const now = useNow(15_000);
  if (!value) return <span className={className}>—</span>;
  return (
    <time
      dateTime={new Date(value).toISOString()}
      title={formatDateTime(value)}
      className={className}
    >
      {formatRelative(value, now)}
    </time>
  );
}
