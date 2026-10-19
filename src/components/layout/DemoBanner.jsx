import { Link } from 'react-router';
import { useGuild } from '../../store/hooks.js';

export function DemoBanner() {
  const { guild } = useGuild();
  const active = [
    guild?.settings?.mirrorOutage && 'mirror outage',
    guild?.settings?.slowAi && 'slow AI',
  ].filter(Boolean);
  if (active.length === 0) return null;

  return (
    <div
      role="status"
      className="bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950"
    >
      Demo mode in {guild.name}: simulating {active.join(' and ')}.{' '}
      <Link to="/demo" className="underline underline-offset-2">
        Manage demo controls
      </Link>
    </div>
  );
}
