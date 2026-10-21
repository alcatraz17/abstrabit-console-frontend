import { useSearchParams } from 'react-router';
import { FEED_COMMANDS, INTERACTION_STATUSES, LABELS } from '../../common/constants.js';
import { RequireGuild } from '../../components/guards/RequireGuild.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { Badge, PriorityBadge, StatusBadge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { ErrorBlock, LoadingBlock } from '../../components/ui/QueryState.jsx';
import { RelativeTime } from '../../components/ui/Time.jsx';
import { cx } from '../../utils/cx.js';
import { formatMs, labelFor } from '../../utils/format.js';
import { ActionChips } from './ActionChips.jsx';
import { InteractionDrawer } from './InteractionDrawer.jsx';
import { useLiveFeed } from './useLiveFeed.js';

function pick(value, allowed) {
  return allowed.includes(value) ? value : undefined;
}

function LiveIndicator({ live, onToggle }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 text-sm text-slate-600">
        <span
          aria-hidden="true"
          className={cx(
            'size-2 rounded-full',
            live.paused
              ? 'bg-slate-400'
              : live.error
                ? 'bg-amber-500'
                : 'animate-pulse bg-emerald-500',
          )}
        />
        {live.paused ? 'Paused' : live.error ? 'Reconnecting' : 'Live'}
      </span>
      <Button size="sm" variant="secondary" onClick={() => onToggle(!live.paused)}>
        {live.paused ? 'Resume' : 'Pause'}
      </Button>
    </div>
  );
}

function FeedTable({ items, onOpen }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">
              Time
            </th>
            <th scope="col" className="px-4 py-3">
              User
            </th>
            <th scope="col" className="px-4 py-3">
              Command
            </th>
            <th scope="col" className="px-4 py-3">
              Input
            </th>
            <th scope="col" className="px-4 py-3">
              Outcome
            </th>
            <th scope="col" className="px-4 py-3">
              Actions
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Ack
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} className="align-top hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                <RelativeTime value={item.receivedAt} />
              </td>
              <td className="max-w-40 truncate px-4 py-3 text-slate-900">{item.userName ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-700">
                {labelFor(LABELS.command, item.command)}
                {item.kind === 'button' && <span className="ml-1 text-slate-400">button</span>}
              </td>
              <td className="max-w-md px-4 py-3">
                <button
                  type="button"
                  onClick={() => onOpen(item.id)}
                  className="text-left text-slate-900 hover:text-indigo-700 hover:underline"
                >
                  {item.inputPreview || 'View details'}
                </button>
                {item.aiSummary && (
                  <p className="mt-0.5 text-xs text-slate-500">AI: {item.aiSummary}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1">
                  <StatusBadge status={item.status} title="Delivery" />
                  {item.reportStatus && (
                    <StatusBadge status={item.reportStatus} title="Report status">
                      Report {labelFor(LABELS.status, item.reportStatus).toLowerCase()}
                    </StatusBadge>
                  )}
                  <PriorityBadge priority={item.priority} />
                  {item.blockReason && (
                    <Badge>{labelFor(LABELS.blockReason, item.blockReason)}</Badge>
                  )}
                  {item.tags.map((tag) => (
                    <Badge key={tag} tone="accent">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <ActionChips actions={item.actions} />
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-slate-600">
                {formatMs(item.ackMs)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GuildLiveLog({ guild }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const command = pick(searchParams.get('command'), FEED_COMMANDS);
  const status = pick(searchParams.get('status'), INTERACTION_STATUSES);
  const openId = searchParams.get('interaction');
  const { items, query, live, setPaused } = useLiveFeed(guild.id, command, status);

  function updateParams(changes) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  }

  const filtered = Boolean(command || status);

  return (
    <>
      <PageHeader
        title="Live log"
        description={`Every command and button in ${guild.name}, updated as it happens.`}
        actions={<LiveIndicator live={live} onToggle={setPaused} />}
      />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Command</span>
          <Select
            value={command ?? ''}
            onChange={(event) => updateParams({ command: event.target.value })}
          >
            <option value="">All commands</option>
            {FEED_COMMANDS.map((value) => (
              <option key={value} value={value}>
                {labelFor(LABELS.command, value)}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Delivery</span>
          <Select
            value={status ?? ''}
            onChange={(event) => updateParams({ status: event.target.value })}
          >
            <option value="">Any delivery</option>
            {INTERACTION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {labelFor(LABELS.status, value)}
              </option>
            ))}
          </Select>
        </label>
        {filtered && (
          <Button variant="ghost" onClick={() => updateParams({ command: null, status: null })}>
            Clear filters
          </Button>
        )}
      </div>
      {live.error && !live.paused && (
        <Alert tone="warning" className="mb-4">
          Live updates are delayed: {live.error.message}
        </Alert>
      )}
      {query.isPending ? (
        <LoadingBlock label="Loading interactions" />
      ) : query.isError && items.length === 0 ? (
        <ErrorBlock error={query.error} onRetry={query.refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title={filtered ? 'No interactions match these filters' : 'No interactions yet'}
        >
          {filtered
            ? 'Try a different command or delivery state.'
            : 'Run /report or /status in your Discord server and it will appear here within seconds.'}
        </EmptyState>
      ) : (
        <>
          <FeedTable items={items} onOpen={(id) => updateParams({ interaction: id })} />
          {query.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                loading={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
              >
                Load older interactions
              </Button>
            </div>
          )}
        </>
      )}
      <InteractionDrawer
        interactionId={openId}
        guildId={guild.id}
        onClose={() => updateParams({ interaction: null })}
      />
    </>
  );
}

export function LiveLogPage() {
  return <RequireGuild>{(guild) => <GuildLiveLog key={guild.id} guild={guild} />}</RequireGuild>;
}
