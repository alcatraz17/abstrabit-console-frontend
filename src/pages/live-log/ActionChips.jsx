import { LABELS } from '../../common/constants.js';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { labelFor } from '../../utils/format.js';

function actionSummary(action) {
  const kind = labelFor(LABELS.jobKind, action.kind);
  const status = labelFor(LABELS.status, action.status);
  const attempts =
    action.status === 'retrying' || action.status === 'dead'
      ? ` (${action.attempts}/${action.maxAttempts})`
      : '';
  return `${kind}: ${status}${attempts}`;
}

export function ActionChips({ actions }) {
  if (actions.length === 0) return <span className="text-xs text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {actions.map((action) => (
        <StatusBadge
          key={action.id}
          status={action.status}
          title={
            action.lastError
              ? `${actionSummary(action)} · ${action.lastError}`
              : actionSummary(action)
          }
        >
          {labelFor(LABELS.jobKind, action.kind)}
          {(action.status === 'retrying' || action.status === 'dead') &&
            ` ${action.attempts}/${action.maxAttempts}`}
        </StatusBadge>
      ))}
    </div>
  );
}
