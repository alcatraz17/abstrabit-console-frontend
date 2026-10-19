import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { adminApi } from '../../api/admin.api.js';
import { queryKeys } from '../../api/query-keys.js';
import { LABELS, POLLING } from '../../common/constants.js';
import { RequireGuild } from '../../components/guards/RequireGuild.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { QueryState } from '../../components/ui/QueryState.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { RelativeTime } from '../../components/ui/Time.jsx';
import { useGuild, useToast } from '../../store/hooks.js';
import { formatTime, labelFor } from '../../utils/format.js';

const JOB_TABS = ['retrying', 'dead'];

function JobsTable({ jobs, status, onRetry, retryingId }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
          <tr>
            <th scope="col" className="px-5 py-3">
              Action
            </th>
            <th scope="col" className="px-5 py-3">
              Source
            </th>
            <th scope="col" className="px-5 py-3">
              Attempts
            </th>
            <th scope="col" className="px-5 py-3">
              {status === 'dead' ? 'Failed' : 'Next attempt'}
            </th>
            <th scope="col" className="px-5 py-3">
              Last error
            </th>
            <th scope="col" className="px-5 py-3 text-right">
              <span className="sr-only">Retry</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <tr key={job.id} className="align-top">
              <td className="px-5 py-3 font-medium whitespace-nowrap text-slate-900">
                {labelFor(LABELS.jobKind, job.kind)}
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <Link
                  to={`/live?interaction=${job.interactionId}`}
                  className="text-indigo-600 hover:underline"
                >
                  {labelFor(LABELS.command, job.command)}
                  {job.reportId ? ` #${job.reportId}` : ''}
                </Link>
                <p className="text-xs text-slate-500">{job.userName ?? '—'}</p>
              </td>
              <td className="px-5 py-3 whitespace-nowrap tabular-nums text-slate-700">
                {job.attempts}/{job.maxAttempts}
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                {status === 'dead' ? (
                  <RelativeTime value={job.updatedAt} />
                ) : (
                  formatTime(job.nextAttemptAt)
                )}
              </td>
              <td className="max-w-md px-5 py-3 font-mono text-xs break-words text-rose-700">
                {job.lastError ?? '—'}
              </td>
              <td className="px-5 py-3 text-right">
                {job.retryable || status === 'retrying' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={retryingId === job.id}
                    onClick={() => onRetry(job.id)}
                  >
                    {status === 'dead' ? 'Retry' : 'Retry now'}
                  </Button>
                ) : (
                  <Badge title="The interaction token expired, so Discord no longer accepts this reply.">
                    Token expired
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobsCard({ guild }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = JOB_TABS.includes(searchParams.get('jobs'))
    ? searchParams.get('jobs')
    : 'retrying';
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmAll, setConfirmAll] = useState(false);

  const jobs = useQuery({
    queryKey: queryKeys.jobs(guild.id, status),
    queryFn: ({ signal }) => adminApi.jobs(guild.id, status, signal),
    refetchInterval: POLLING.failuresMs,
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['guilds', guild.id, 'jobs'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.overview(guild.id) }),
    ]);

  const retryOne = useMutation({
    mutationFn: adminApi.retryJob,
    onSuccess: () => {
      toast.success('Retry queued.');
      refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      refresh();
    },
  });

  const retryAll = useMutation({
    mutationFn: () => adminApi.retryDeadJobs(guild.id),
    onSuccess: ({ queued }) => {
      setConfirmAll(false);
      toast.success(
        queued
          ? `${queued} action${queued === 1 ? '' : 's'} queued for retry.`
          : 'Nothing to retry.',
      );
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const retryableCount =
    status === 'dead' ? (jobs.data ?? []).filter((job) => job.retryable).length : 0;

  return (
    <Card
      title="Deliveries"
      description="Actions that did not complete on the first try. Retrying actions recover by themselves."
      actions={
        <>
          <Tabs
            label="Delivery status"
            value={status}
            onChange={(value) => setSearchParams({ jobs: value }, { replace: true })}
            options={[
              { value: 'retrying', label: 'Retrying' },
              { value: 'dead', label: 'Failed' },
            ]}
          />
          {status === 'dead' && (
            <Button
              variant="secondary"
              size="sm"
              disabled={retryableCount === 0}
              onClick={() => setConfirmAll(true)}
            >
              Retry all failed
            </Button>
          )}
        </>
      }
      bodyClassName="p-0"
    >
      <QueryState query={jobs} loadingLabel="Loading deliveries">
        {(list) =>
          list.length === 0 ? (
            <div className="p-5">
              <EmptyState title={status === 'dead' ? 'No failed actions' : 'Nothing is retrying'}>
                {status === 'dead'
                  ? 'Every action either succeeded or is still being retried.'
                  : 'All deliveries are up to date.'}
              </EmptyState>
            </div>
          ) : (
            <JobsTable
              jobs={list}
              status={status}
              onRetry={(jobId) => retryOne.mutate(jobId)}
              retryingId={retryOne.isPending ? retryOne.variables : null}
            />
          )
        }
      </QueryState>
      <ConfirmDialog
        open={confirmAll}
        title="Retry all failed actions?"
        confirmLabel={`Retry ${retryableCount}`}
        tone="primary"
        pending={retryAll.isPending}
        onConfirm={() => retryAll.mutate()}
        onCancel={() => setConfirmAll(false)}
      >
        Each failed action gets a fresh set of attempts. Replies whose Discord token has expired are
        skipped.
      </ConfirmDialog>
    </Card>
  );
}

function SecurityEventsCard() {
  const { guilds } = useGuild();
  const names = new Map(guilds.map((guild) => [guild.id, guild.name]));
  const events = useQuery({
    queryKey: queryKeys.securityEvents,
    queryFn: ({ signal }) => adminApi.securityEvents(signal),
    refetchInterval: POLLING.failuresMs,
  });

  return (
    <Card
      title="Security events"
      description="Rejected Discord requests, duplicate deliveries, failed sign-ins and unauthorized sweep calls."
      bodyClassName="p-0"
    >
      <QueryState query={events} loadingLabel="Loading security events">
        {(list) =>
          list.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No security events">
                Rejected requests will be listed here.
              </EmptyState>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3">
                      Time
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Event
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Detail
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Server
                    </th>
                    <th scope="col" className="px-5 py-3">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((event) => (
                    <tr key={event.id}>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                        <RelativeTime value={event.at} />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge
                          tone={
                            event.level === 'warn' || event.level === 'error'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {labelFor(LABELS.securityEvent, event.type)}
                        </Badge>
                      </td>
                      <td className="max-w-md px-5 py-3 break-words text-slate-700">
                        {event.detail ?? '—'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-700">
                        {event.guildId ? (names.get(event.guildId) ?? event.guildId) : '—'}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs whitespace-nowrap text-slate-500">
                        {event.ip ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </QueryState>
    </Card>
  );
}

export function FailuresPage() {
  return (
    <>
      <PageHeader
        title="Failures"
        description="Recover actions that could not be delivered and review rejected requests."
      />
      <div className="space-y-6">
        <RequireGuild>{(guild) => <JobsCard key={guild.id} guild={guild} />}</RequireGuild>
        <SecurityEventsCard />
      </div>
    </>
  );
}
