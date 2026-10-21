import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.api.js';
import { queryKeys } from '../../api/query-keys.js';
import { LABELS, POLLING } from '../../common/constants.js';
import { Badge, PriorityBadge, StatusBadge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { QueryState } from '../../components/ui/QueryState.jsx';
import { useToast } from '../../store/hooks.js';
import { cx } from '../../utils/cx.js';
import { formatDateTime, formatMs, formatTime, humanize, labelFor } from '../../utils/format.js';
import { isInteractionSettled } from './feed-merge.js';

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Facts({ items }) {
  return (
    <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-1.5 text-sm">
      {items
        .filter(([, value]) => value !== undefined)
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-slate-500">{label}</dt>
            <dd className="min-w-0 break-words text-slate-900">{value ?? '—'}</dd>
          </div>
        ))}
    </dl>
  );
}

function Decision({ decision }) {
  if (!decision) return <p className="text-sm text-slate-500">No decision was recorded.</p>;
  if (!decision.allowed) {
    return (
      <Facts
        items={[
          ['Result', <Badge key="r">Blocked</Badge>],
          ['Reason', labelFor(LABELS.blockReason, decision.reason)],
          ['Config version', decision.configVersion],
        ]}
      />
    );
  }
  return (
    <Facts
      items={[
        ['Priority', <PriorityBadge key="p" priority={decision.priority} />],
        ['Tags', decision.tags.length ? decision.tags.join(', ') : null],
        [
          'Matched rule',
          decision.matchedRuleName
            ? `${decision.matchedRuleName}${decision.matchedKeyword ? ` (keyword “${decision.matchedKeyword}”)` : ''}`
            : 'No rule matched',
        ],
        ['Visibility', labelFor(LABELS.visibility, decision.visibility)],
        ['Channel card', decision.postToChannel ? 'Yes' : 'No'],
        ['Mirror', decision.mirror ? 'Yes' : 'No'],
        ['AI summary', decision.aiEnabled ? 'Requested' : 'Off'],
        ['Config version', decision.configVersion],
      ]}
    />
  );
}

function Actions({ actions, interactionId }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const retry = useMutation({
    mutationFn: (jobId) => adminApi.retryJob(jobId),
    onSuccess: () => {
      toast.success('Retry queued.');
      queryClient.invalidateQueries({ queryKey: queryKeys.interaction(interactionId) });
    },
    onError: (error) => toast.error(error.message),
  });

  if (actions.length === 0) {
    return <p className="text-sm text-slate-500">This interaction needed no follow-up actions.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {actions.map((action) => (
        <li
          key={action.id}
          className="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              {labelFor(LABELS.jobKind, action.kind)}
              <StatusBadge status={action.status} />
              <span className="text-xs font-normal text-slate-500">
                {action.attempts}/{action.maxAttempts} attempts
              </span>
            </div>
            {action.status === 'retrying' && action.nextAttemptAt && (
              <p className="mt-0.5 text-xs text-slate-500">
                Next attempt at {formatTime(action.nextAttemptAt)}
              </p>
            )}
            {action.lastError && action.status !== 'succeeded' && (
              <p className="mt-0.5 font-mono text-xs break-words text-rose-700">
                {action.lastError}
              </p>
            )}
          </div>
          {['dead', 'retrying'].includes(action.status) && (
            <Button
              size="sm"
              variant="secondary"
              loading={retry.isPending && retry.variables === action.id}
              onClick={() => retry.mutate(action.id)}
            >
              {action.status === 'dead' ? 'Retry' : 'Retry now'}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

const LEVEL_DOTS = { info: 'bg-slate-400', warn: 'bg-amber-500', error: 'bg-rose-500' };

function Timeline({ entries }) {
  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 text-sm">
          <span
            aria-hidden="true"
            className={cx(
              'mt-1.5 size-2 shrink-0 rounded-full',
              LEVEL_DOTS[entry.level] ?? LEVEL_DOTS.info,
            )}
          />
          <div className="min-w-0">
            <p className="text-slate-900">
              {humanize(entry.title)}
              {entry.durationMs !== undefined && entry.durationMs !== null && (
                <span className="text-slate-500"> · {formatMs(entry.durationMs)}</span>
              )}
              {entry.httpStatus ? (
                <span className="text-slate-500"> · HTTP {entry.httpStatus}</span>
              ) : null}
            </p>
            <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
            {entry.detail && (
              <p className="mt-0.5 font-mono text-xs break-words text-slate-600">{entry.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function discordMessageUrl(guildId, report) {
  if (!report?.channelId || !report.channelMessageId) return null;
  return `https://discord.com/channels/${guildId}/${report.channelId}/${report.channelMessageId}`;
}

function Details({ interaction, guildId }) {
  const messageUrl = discordMessageUrl(guildId, interaction.report);
  const input = interaction.input ?? {};
  return (
    <div className="space-y-6">
      <Facts
        items={[
          ['Delivery', <StatusBadge key="s" status={interaction.status} />],
          ['User', interaction.userName],
          ['Received', formatDateTime(interaction.receivedAt)],
          ['Acknowledged in', formatMs(interaction.ackMs)],
          [
            'Interaction id',
            <span key="i" className="font-mono text-xs">
              {interaction.id}
            </span>,
          ],
        ]}
      />
      <Section title="Input">
        {input.text ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm whitespace-pre-wrap text-slate-900">
            {input.text}
          </p>
        ) : (
          <p className="text-sm text-slate-700">{interaction.inputPreview}</p>
        )}
        {input.severity && input.severity !== 'none' && (
          <p className="text-xs text-slate-500">Severity chosen: {humanize(input.severity)}</p>
        )}
      </Section>
      {interaction.command === 'report' && interaction.kind !== 'button' && (
        <Section title="Decision">
          <Decision decision={interaction.decision} />
        </Section>
      )}
      {interaction.ai && (
        <Section title="AI summary">
          <Facts
            items={[
              ['Summary', interaction.ai.summary],
              ['Tags', interaction.ai.tags?.length ? interaction.ai.tags.join(', ') : null],
              [
                'Suggested severity',
                interaction.ai.severitySuggestion
                  ? humanize(interaction.ai.severitySuggestion)
                  : null,
              ],
            ]}
          />
        </Section>
      )}
      {interaction.report && (
        <Section title={`Report #${interaction.report.id}`}>
          <Facts
            items={[
              ['Status', <StatusBadge key="s" status={interaction.report.status} />],
              ['Priority', <PriorityBadge key="p" priority={interaction.report.priority} />],
              [
                'Handled by',
                interaction.report.handledByName
                  ? `${interaction.report.handledByName} · ${formatDateTime(interaction.report.handledAt)}`
                  : null,
              ],
              [
                'Channel card',
                messageUrl ? (
                  <a
                    key="m"
                    href={messageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline underline-offset-2"
                  >
                    Open in Discord
                  </a>
                ) : null,
              ],
            ]}
          />
        </Section>
      )}
      <Section title="Actions">
        <Actions actions={interaction.actions} interactionId={interaction.id} />
      </Section>
      <Section title="Timeline">
        <Timeline entries={interaction.timeline} />
      </Section>
    </div>
  );
}

export function InteractionDrawer({ interactionId, guildId, onClose }) {
  const detail = useQuery({
    queryKey: queryKeys.interaction(interactionId),
    queryFn: ({ signal }) => adminApi.interaction(interactionId, signal),
    enabled: Boolean(interactionId),
    refetchInterval: (query) => (isInteractionSettled(query.state.data) ? false : POLLING.detailMs),
  });

  const title = detail.data
    ? `${labelFor(LABELS.command, detail.data.command)}${detail.data.kind === 'button' ? ' button' : ''}`
    : 'Interaction';

  return (
    <Dialog
      open={Boolean(interactionId)}
      onClose={onClose}
      variant="drawer"
      title={title}
      description={detail.data ? formatDateTime(detail.data.receivedAt) : undefined}
    >
      {interactionId && (
        <QueryState query={detail} loadingLabel="Loading interaction">
          {(interaction) => <Details interaction={interaction} guildId={guildId} />}
        </QueryState>
      )}
    </Dialog>
  );
}
