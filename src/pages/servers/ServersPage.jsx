import { LABELS } from '../../common/constants.js';
import { Alert } from '../../components/ui/Alert.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { ErrorBlock, LoadingBlock } from '../../components/ui/QueryState.jsx';
import { RelativeTime } from '../../components/ui/Time.jsx';
import { useGuild } from '../../store/hooks.js';
import { cx } from '../../utils/cx.js';
import { BotInviteCard } from './BotInviteCard.jsx';
import { ConnectServerCard } from './ConnectServerCard.jsx';
import { ServerActionsCard } from './ServerActionsCard.jsx';
import { ServerSettingsCard } from './ServerSettingsCard.jsx';

function GuildList() {
  const { guilds, guild: selected, selectGuild } = useGuild();
  if (guilds.length === 0) return null;
  return (
    <Card title="Your servers" bodyClassName="p-0">
      <ul className="divide-y divide-slate-100">
        {guilds.map((guild) => (
          <li key={guild.id}>
            <button
              type="button"
              onClick={() => selectGuild(guild.id)}
              aria-current={guild.id === selected?.id || undefined}
              className={cx(
                'flex w-full flex-wrap items-center justify-between gap-2 px-5 py-3 text-left hover:bg-slate-50',
                guild.id === selected?.id && 'bg-indigo-50/60',
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-900">
                  {guild.name}
                </span>
                <span className="text-xs text-slate-500">
                  Connected <RelativeTime value={guild.connectedAt} />
                </span>
              </span>
              <StatusBadge status={guild.status} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SelectedGuild({ guild }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{guild.name}</h2>
        <StatusBadge status={guild.status} />
      </div>
      {guild.status === 'needs_attention' && (
        <Alert tone="warning" title={LABELS.status.needs_attention}>
          {guild.attentionReason ?? 'The bot lost access to something it needs.'} Saving settings or
          registering commands again clears this once the problem is fixed.
        </Alert>
      )}
      {guild.status === 'disconnected' ? (
        <Alert tone="info" title="Disconnected">
          Generate a connect code and run /connect in the server to reconnect it. Previous settings
          and history are kept.
        </Alert>
      ) : (
        <>
          <ServerSettingsCard key={`${guild.id}:${guild.updatedAt}`} guild={guild} />
          <ServerActionsCard guild={guild} />
        </>
      )}
    </div>
  );
}

export function ServersPage() {
  const { guild, isLoading, error, refetch } = useGuild();

  return (
    <>
      <PageHeader
        title="Servers"
        description="Install the bot, connect Discord servers and choose where reports go."
      />
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <BotInviteCard />
          <ConnectServerCard />
          {isLoading ? (
            <LoadingBlock label="Loading servers" />
          ) : error ? (
            <ErrorBlock error={error} onRetry={refetch} />
          ) : (
            <GuildList />
          )}
        </div>
        <div>
          {guild ? (
            <SelectedGuild guild={guild} />
          ) : (
            !isLoading && (
              <p className="text-sm text-slate-500">
                Connected servers appear here with their delivery settings.
              </p>
            )
          )}
        </div>
      </div>
    </>
  );
}
