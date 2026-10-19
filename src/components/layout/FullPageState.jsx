import { Button } from '../ui/Button.jsx';
import { Spinner } from '../ui/Spinner.jsx';

export function FullPageLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-slate-500">
      <Spinner className="size-6" label="Loading the console" />
    </div>
  );
}

export function FullPageError({ error, onRetry }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <p className="text-base font-semibold text-slate-900">The console could not start.</p>
        <p className="mt-1 text-sm text-slate-500">
          {error?.message ?? 'The server did not respond.'}
        </p>
        <Button className="mt-4" onClick={() => onRetry()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
