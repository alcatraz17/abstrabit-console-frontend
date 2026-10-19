import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.api.js';
import { queryKeys } from '../../api/query-keys.js';
import { buttonClasses } from '../../components/ui/button-classes.js';
import { Card } from '../../components/ui/Card.jsx';
import { QueryState } from '../../components/ui/QueryState.jsx';

export function BotInviteCard() {
  const bot = useQuery({
    queryKey: queryKeys.bot,
    queryFn: ({ signal }) => adminApi.bot(signal),
    staleTime: Infinity,
  });

  return (
    <Card
      title="Install the bot"
      description="Grants only what the bot needs: view channels, send messages, embed links and read history."
    >
      <QueryState query={bot} loadingLabel="Loading invite link">
        {(info) => (
          <div className="space-y-3">
            <a
              href={info.inviteUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses({ variant: 'secondary' })}
            >
              Open the invite link
            </a>
            <p className="text-xs text-slate-500">
              Bots that use HTTP interactions appear offline in the member list. Commands still
              work.
            </p>
          </div>
        )}
      </QueryState>
    </Card>
  );
}
