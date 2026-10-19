import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { queryKeys } from '../../api/query-keys.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { useToast } from '../../store/hooks.js';

export function ServerActionsCard({ guild }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const refreshGuilds = () => queryClient.invalidateQueries({ queryKey: queryKeys.guilds });

  const testMirror = useMutation({
    mutationFn: () => adminApi.testMirror(guild.id),
    onSuccess: () => toast.success('Test message delivered to the mirror.'),
    onError: (error) => toast.error(error.message),
  });

  const sync = useMutation({
    mutationFn: () => adminApi.syncCommands(guild.id),
    onSuccess: () => {
      toast.success('Commands registered again in Discord.');
      refreshGuilds();
    },
    onError: (error) => toast.error(error.message),
  });

  const disconnect = useMutation({
    mutationFn: () => adminApi.disconnect(guild.id),
    onSuccess: ({ commandsRemoved }) => {
      setConfirming(false);
      if (commandsRemoved) toast.success(`${guild.name} was disconnected.`);
      else {
        toast.info(
          `${guild.name} was disconnected, but Discord did not confirm the commands were removed.`,
        );
      }
      refreshGuilds();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Card title="Maintenance">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Send a test message</p>
            <p className="text-xs text-slate-500">Checks the saved mirror webhook end to end.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => testMirror.mutate()}
            loading={testMirror.isPending}
            disabled={guild.mirrorKind === 'none'}
          >
            Send test
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Register commands again</p>
            <p className="text-xs text-slate-500">
              Use this if /report or /status is missing in the server.
            </p>
          </div>
          <Button variant="secondary" onClick={() => sync.mutate()} loading={sync.isPending}>
            Re-register
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Disconnect this server</p>
            <p className="text-xs text-slate-500">
              Removes the commands from the server. History stays in the console.
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Disconnect
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        title={`Disconnect ${guild.name}?`}
        confirmLabel="Disconnect"
        pending={disconnect.isPending}
        onConfirm={() => disconnect.mutate()}
        onCancel={() => setConfirming(false)}
      >
        Members will no longer see /report and /status. Pending deliveries are still completed. You
        can connect the server again later with a new code.
      </ConfirmDialog>
    </Card>
  );
}
