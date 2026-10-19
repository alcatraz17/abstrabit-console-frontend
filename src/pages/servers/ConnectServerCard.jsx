import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { queryKeys } from '../../api/query-keys.js';
import { POLLING } from '../../common/constants.js';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { CopyButton } from '../../components/ui/CopyButton.jsx';
import { useNow } from '../../hooks/useNow.js';
import { useGuild } from '../../store/hooks.js';
import { formatCountdown } from '../../utils/format.js';

function activeIds(guilds) {
  return guilds.filter((guild) => guild.status !== 'disconnected').map((guild) => guild.id);
}

export function ConnectServerCard() {
  const { guilds, selectGuild } = useGuild();
  const [pending, setPending] = useState(null);
  const now = useNow(1000);

  const expired = pending ? now >= new Date(pending.expiresAt).getTime() : false;
  const connected = pending
    ? guilds.find(
        (guild) => guild.status !== 'disconnected' && !pending.knownIds.includes(guild.id),
      )
    : null;

  useQuery({
    queryKey: queryKeys.guilds,
    queryFn: ({ signal }) => adminApi.guilds(signal),
    refetchInterval: pending && !expired && !connected ? POLLING.connectMs : false,
  });

  const create = useMutation({
    mutationFn: adminApi.createConnectCode,
    onSuccess: (code) => setPending({ ...code, knownIds: activeIds(guilds) }),
  });

  if (connected) {
    return (
      <Card title="Connect a server">
        <Alert
          tone="success"
          title={`${connected.name} is connected`}
          action={
            <Button
              size="sm"
              onClick={() => {
                selectGuild(connected.id);
                setPending(null);
              }}
            >
              Manage it
            </Button>
          }
        >
          Commands are registered. Choose a report channel and a mirror below.
        </Alert>
      </Card>
    );
  }

  return (
    <Card
      title="Connect a server"
      description="Links a Discord server where the bot is installed to your account."
    >
      {!pending || expired ? (
        <div className="space-y-3">
          {expired && <Alert tone="warning">That code expired. Generate a new one.</Alert>}
          {create.isError && <Alert tone="error">{create.error.message}</Alert>}
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Install the bot in the server with the invite link.</li>
            <li>Generate a one-time code here. It is valid for 10 minutes.</li>
            <li>
              In the server, a member with <strong>Manage Server</strong> runs the{' '}
              <code className="font-mono">/connect</code> command with the code.
            </li>
          </ol>
          <Button onClick={() => create.mutate()} loading={create.isPending}>
            Generate connect code
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <code className="font-mono text-2xl font-semibold tracking-[0.2em] text-slate-900">
              {pending.code}
            </code>
            <CopyButton value={pending.command} label="Copy command" />
          </div>
          <p className="text-sm text-slate-600">
            Run <code className="font-mono">{pending.command}</code> in your server. Expires in{' '}
            <span className="font-medium tabular-nums">
              {formatCountdown(new Date(pending.expiresAt).getTime() - now)}
            </span>
            . This page updates when the server connects.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
}
