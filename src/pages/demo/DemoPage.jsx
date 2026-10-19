import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.api.js';
import { queryKeys } from '../../api/query-keys.js';
import { RequireGuild } from '../../components/guards/RequireGuild.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { useToast } from '../../store/hooks.js';

const TOGGLES = [
  {
    key: 'mirrorOutage',
    label: 'Simulate mirror outage',
    description:
      'Mirror deliveries fail as if the webhook were down. Watch them retry on the Failures page, then turn this off and see them recover.',
  },
  {
    key: 'slowAi',
    label: 'Simulate slow AI',
    description:
      'The AI step takes longer than its 5-second timeout. The reply is sent without waiting and the summary is added on a later retry.',
  },
];

function GuildDemo({ guild }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const settings = { mirrorOutage: false, slowAi: false, ...guild.settings };

  const save = useMutation({
    mutationFn: (next) => adminApi.saveDemo(guild.id, next),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.guilds, (current) =>
        current?.map((item) => (item.id === guild.id ? { ...item, settings: saved } : item)),
      );
    },
    onError: (error) => toast.error(error.message),
  });

  const pendingSettings = save.isPending ? save.variables : settings;

  return (
    <>
      <PageHeader
        title="Demo controls"
        description={`Failure simulations for ${guild.name}. They affect only this server.`}
      />
      <Card>
        <div className="divide-y divide-slate-100">
          {TOGGLES.map((toggle) => (
            <div key={toggle.key} className="py-4 first:pt-0 last:pb-0">
              <Switch
                checked={Boolean(pendingSettings[toggle.key])}
                disabled={save.isPending}
                onChange={(value) =>
                  save.mutate({
                    mirrorOutage: Boolean(settings.mirrorOutage),
                    slowAi: Boolean(settings.slowAi),
                    [toggle.key]: value,
                  })
                }
                label={toggle.label}
                description={toggle.description}
              />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export function DemoPage() {
  return <RequireGuild>{(guild) => <GuildDemo key={guild.id} guild={guild} />}</RequireGuild>;
}
