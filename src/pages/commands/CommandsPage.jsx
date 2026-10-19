import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { adminApi } from '../../api/admin.api.js';
import { queryKeys } from '../../api/query-keys.js';
import { CONFIGURABLE_COMMANDS, LABELS } from '../../common/constants.js';
import { RequireGuild } from '../../components/guards/RequireGuild.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { QueryState } from '../../components/ui/QueryState.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { CommandConfigForm } from './CommandConfigForm.jsx';

function GuildCommands({ guild }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('command');
  const command = CONFIGURABLE_COMMANDS.includes(requested) ? requested : 'report';

  const config = useQuery({
    queryKey: queryKeys.commandConfig(guild.id, command),
    queryFn: ({ signal }) => adminApi.commandConfig(guild.id, command, signal),
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <PageHeader
        title="Commands"
        description={`How the bot handles each command in ${guild.name}. Changes apply to the next command.`}
        actions={
          <Tabs
            label="Command"
            value={command}
            onChange={(value) => setSearchParams({ command: value })}
            options={CONFIGURABLE_COMMANDS.map((value) => ({
              value,
              label: LABELS.command[value],
            }))}
          />
        }
      />
      <QueryState query={config} loadingLabel="Loading configuration">
        {(saved) => (
          <CommandConfigForm
            key={`${guild.id}:${command}`}
            guildId={guild.id}
            command={command}
            saved={saved}
          />
        )}
      </QueryState>
    </>
  );
}

export function CommandsPage() {
  return <RequireGuild>{(guild) => <GuildCommands key={guild.id} guild={guild} />}</RequireGuild>;
}
