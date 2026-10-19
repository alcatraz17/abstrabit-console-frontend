import { Link } from 'react-router';
import { useGuild } from '../../store/hooks.js';
import { buttonClasses } from '../ui/button-classes.js';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ErrorBlock, LoadingBlock } from '../ui/QueryState.jsx';

export function RequireGuild({ children }) {
  const { guild, isLoading, error, refetch } = useGuild();

  if (isLoading) return <LoadingBlock label="Loading servers" />;
  if (error && !guild) return <ErrorBlock error={error} onRetry={refetch} />;
  if (!guild) {
    return (
      <EmptyState
        title="No Discord server connected yet"
        action={
          <Link to="/servers" className={buttonClasses()}>
            Connect a server
          </Link>
        }
      >
        Invite the bot and run <code className="font-mono">/connect</code> in your server to start
        receiving commands here.
      </EmptyState>
    );
  }
  return children(guild);
}
