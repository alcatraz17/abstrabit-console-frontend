import { LABELS } from '../../common/constants.js';
import { useGuild } from '../../store/hooks.js';
import { labelFor } from '../../utils/format.js';
import { Select } from '../ui/Field.jsx';

export function GuildSwitcher() {
  const { guilds, guild, selectGuild } = useGuild();
  if (guilds.length === 0) return null;

  return (
    <label className="flex min-w-0 items-center gap-2 text-sm">
      <span className="sr-only">Server</span>
      <Select
        value={guild?.id ?? ''}
        onChange={(event) => selectGuild(event.target.value)}
        className="h-9 max-w-64 py-1.5"
      >
        {guilds.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
            {item.status === 'connected' ? '' : ` (${labelFor(LABELS.status, item.status)})`}
          </option>
        ))}
      </Select>
    </label>
  );
}
