import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { adminApi } from '../../api/admin.api.js';
import { queryKeys } from '../../api/query-keys.js';
import { ACK_BUDGET_MS, POLLING, SWEEP_STALE_AFTER_MS } from '../../common/constants.js';
import { RequireGuild } from '../../components/guards/RequireGuild.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { buttonClasses } from '../../components/ui/button-classes.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { QueryState } from '../../components/ui/QueryState.jsx';
import { useNow } from '../../hooks/useNow.js';
import { cx } from '../../utils/cx.js';
import { formatMs, formatPercent, formatRelative } from '../../utils/format.js';

const TONES = {
  neutral: 'text-slate-900',
  good: 'text-emerald-700',
  warning: 'text-amber-700',
  bad: 'text-rose-700',
};

function Stat({ label, value, detail, tone = 'neutral', to }) {
  const body = (
    <>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className={cx('mt-2 text-2xl font-semibold tabular-nums', TONES[tone])}>{value}</dd>
      {detail && <dd className="mt-1 text-xs text-slate-500">{detail}</dd>}
    </>
  );
  const classes = 'block rounded-xl border border-slate-200 bg-white p-5 shadow-xs';
  return to ? (
    <Link to={to} className={cx(classes, 'transition-colors hover:border-indigo-300')}>
      <dl>{body}</dl>
    </Link>
  ) : (
    <dl className={classes}>{body}</dl>
  );
}

function rateTone(rate) {
  if (rate === null) return 'neutral';
  if (rate >= 0.98) return 'good';
  return rate >= 0.9 ? 'warning' : 'bad';
}

function latencyTone(ms) {
  if (ms === null) return 'neutral';
  if (ms < ACK_BUDGET_MS * 0.5) return 'good';
  return ms < ACK_BUDGET_MS ? 'warning' : 'bad';
}

function GuildOverview({ guild }) {
  const now = useNow(5000);
  const overview = useQuery({
    queryKey: queryKeys.overview(guild.id),
    queryFn: ({ signal }) => adminApi.overview(guild.id, signal),
    refetchInterval: POLLING.overviewMs,
  });

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Activity in ${guild.name} over the last 24 hours.`}
        actions={
          <Link to="/live" className={buttonClasses({ variant: 'secondary' })}>
            Open live log
          </Link>
        }
      />
      <div className="mb-6 space-y-3">
        {guild.status === 'needs_attention' && (
          <Alert tone="warning" title="This server needs attention">
            {guild.attentionReason ?? 'The bot lost access to something it needs.'}{' '}
            <Link to="/servers" className="font-medium underline underline-offset-2">
              Review server settings
            </Link>
          </Alert>
        )}
        {guild.status === 'disconnected' && (
          <Alert tone="info" title="This server is disconnected">
            History stays available. Run <code className="font-mono">/connect</code> again to
            reconnect it.
          </Alert>
        )}
        {guild.status === 'connected' && !guild.postChannelId && (
          <Alert tone="info">
            Reports are only replied to until a report channel is chosen.{' '}
            <Link to="/servers" className="font-medium underline underline-offset-2">
              Choose a channel
            </Link>
          </Alert>
        )}
      </div>
      <QueryState query={overview} loadingLabel="Loading figures">
        {(data) => {
          const sweepAge = data.lastSweepAt ? now - new Date(data.lastSweepAt).getTime() : null;
          return (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Commands (24 h)" value={data.commands24h} to="/live" />
              <Stat
                label="Success rate"
                value={formatPercent(data.successRate)}
                tone={rateTone(data.successRate)}
                detail="Finished interactions with every action delivered"
              />
              <Stat
                label="Acknowledgement p95"
                value={formatMs(data.p95AckMs)}
                tone={latencyTone(data.p95AckMs)}
                detail={`Average ${formatMs(data.averageAckMs)} · Discord allows ${formatMs(ACK_BUDGET_MS)}`}
              />
              <Stat
                label="Open reports"
                value={data.openReports}
                detail={`${data.openHighPriority} high priority`}
                tone={data.openHighPriority > 0 ? 'warning' : 'neutral'}
              />
              <Stat
                label="Retrying actions"
                value={data.pendingRetries}
                tone={data.pendingRetries > 0 ? 'warning' : 'neutral'}
                to="/failures"
              />
              <Stat
                label="Failed actions"
                value={data.deadJobs}
                tone={data.deadJobs > 0 ? 'bad' : 'good'}
                to="/failures"
              />
              <Stat
                label="Rejected requests (24 h)"
                value={data.rejectedRequests24h}
                detail="Missing, malformed or forged signatures"
                to="/failures"
              />
              <Stat
                label="Last sweep"
                value={data.lastSweepAt ? formatRelative(data.lastSweepAt, now) : 'Never'}
                tone={sweepAge === null || sweepAge > SWEEP_STALE_AFTER_MS ? 'warning' : 'good'}
                detail="The sweeper retries pending work every minute"
              />
            </div>
          );
        }}
      </QueryState>
    </>
  );
}

export function OverviewPage() {
  return <RequireGuild>{(guild) => <GuildOverview guild={guild} />}</RequireGuild>;
}
