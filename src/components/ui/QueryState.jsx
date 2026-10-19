import { Alert } from './Alert.jsx';
import { Button } from './Button.jsx';
import { Spinner } from './Spinner.jsx';

export function LoadingBlock({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
      <Spinner label={label} />
      <span aria-hidden="true">{label}…</span>
    </div>
  );
}

export function ErrorBlock({ error, onRetry, title = 'This could not be loaded.' }) {
  return (
    <Alert
      tone="error"
      title={title}
      action={
        onRetry && (
          <Button size="sm" variant="secondary" onClick={() => onRetry()}>
            Try again
          </Button>
        )
      }
    >
      {error?.message}
    </Alert>
  );
}

export function QueryState({ query, loadingLabel, children }) {
  if (query.isPending) return <LoadingBlock label={loadingLabel} />;
  if (query.isError && !query.data)
    return <ErrorBlock error={query.error} onRetry={query.refetch} />;
  return children(query.data);
}
