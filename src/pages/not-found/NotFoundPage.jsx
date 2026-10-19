import { Link } from 'react-router';
import { buttonClasses } from '../../components/ui/button-classes.js';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      action={
        <Link to="/" className={buttonClasses({ variant: 'secondary' })}>
          Back to the overview
        </Link>
      }
    >
      The page you opened does not exist.
    </EmptyState>
  );
}
