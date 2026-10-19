import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { ApiError } from '../../api/client.js';
import { queryKeys } from '../../api/query-keys.js';
import {
  LABELS,
  LIMITS,
  MIRROR_POLICIES,
  TEMPLATE_PLACEHOLDERS,
  VISIBILITIES,
} from '../../common/constants.js';
import { commandConfigSchema } from '../../common/schemas/command.schema.js';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { Field, Select, Textarea, TextInput } from '../../components/ui/Field.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { RelativeTime } from '../../components/ui/Time.jsx';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard.js';
import { useToast } from '../../store/hooks.js';
import { validateWith } from '../../utils/validation.js';
import { errorAt, stripPrefix } from './errors.js';
import { RulesEditor } from './RulesEditor.jsx';
import { RuleTestPanel } from './RuleTestPanel.jsx';

const DEFAULT_COOLDOWN = { maxCount: 3, windowSeconds: 300 };

function numberValue(value) {
  return Number.isNaN(value) ? '' : value;
}

export function CommandConfigForm({ guildId, command, saved }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState(null);
  const [baseVersion, setBaseVersion] = useState(saved.version);
  const [errors, setErrors] = useState(null);
  const [conflict, setConflict] = useState(null);

  const config = draft ?? saved.config;
  const dirty = draft !== null;
  const isReport = command === 'report';
  const blocker = useUnsavedChangesGuard(dirty);

  function edit(patch) {
    if (!dirty) setBaseVersion(saved.version);
    setDraft({ ...config, ...patch });
  }

  const save = useMutation({
    mutationFn: ({ version, next }) => adminApi.saveCommandConfig(guildId, command, version, next),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.commandConfig(guildId, command), result);
      setDraft(null);
      setErrors(null);
      setConflict(null);
      setBaseVersion(result.version);
      toast.success(`Saved ${LABELS.command[command]} as version ${result.version}.`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'version_conflict') {
        setConflict(error.message);
      } else if (error instanceof ApiError && error.status === 400) {
        setErrors(stripPrefix(error.fields, 'config'));
        toast.error(error.message);
      } else {
        toast.error(error.message);
      }
    },
  });

  function submit(event) {
    event.preventDefault();
    const { data, fields } = validateWith(commandConfigSchema, config);
    if (fields) {
      setErrors(fields);
      toast.error('Check the highlighted fields.');
      return;
    }
    setErrors(null);
    save.mutate({ version: baseVersion, next: data });
  }

  async function overwrite() {
    try {
      const latest = await queryClient.fetchQuery({
        queryKey: queryKeys.commandConfig(guildId, command),
        queryFn: ({ signal }) => adminApi.commandConfig(guildId, command, signal),
        staleTime: 0,
      });
      setBaseVersion(latest.version);
      setConflict(null);
      save.mutate({ version: latest.version, next: config });
    } catch (error) {
      toast.error(error.message);
    }
  }

  function discard() {
    setDraft(null);
    setErrors(null);
    setConflict(null);
    queryClient.invalidateQueries({ queryKey: queryKeys.commandConfig(guildId, command) });
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-6">
      {conflict && (
        <Alert
          tone="warning"
          title="Someone else saved this configuration"
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={discard}>
                Discard mine
              </Button>
              <Button size="sm" onClick={overwrite} loading={save.isPending}>
                Overwrite with mine
              </Button>
            </div>
          }
        >
          {conflict}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-xs">
        <p className="text-sm text-slate-600">
          Version {dirty ? baseVersion : saved.version}
          {saved.updatedAt && (
            <>
              {' · saved '}
              <RelativeTime value={saved.updatedAt} />
            </>
          )}
          {dirty && <span className="ml-2 font-medium text-amber-700">Unsaved changes</span>}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!dirty || save.isPending} onClick={discard}>
            Discard changes
          </Button>
          <Button type="submit" disabled={!dirty} loading={save.isPending}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Card title="Behaviour">
            <div className="space-y-5">
              <Switch
                checked={config.enabled}
                onChange={(enabled) => edit({ enabled })}
                label="Command enabled"
                description="When off, the bot answers that the command is turned off and records the attempt."
              />
              <Field label="Reply visibility">
                <Select
                  value={config.visibility}
                  onChange={(event) => edit({ visibility: event.target.value })}
                >
                  {VISIBILITIES.map((value) => (
                    <option key={value} value={value}>
                      {LABELS.visibility[value]}
                    </option>
                  ))}
                </Select>
              </Field>
              {isReport && (
                <>
                  <Switch
                    checked={config.postToChannel}
                    onChange={(postToChannel) => edit({ postToChannel })}
                    label="Post a card to the report channel"
                    description="Includes Acknowledge, Escalate and Resolve buttons."
                  />
                  <Field label="Mirror reports">
                    <Select
                      value={config.mirrorPolicy}
                      onChange={(event) => edit({ mirrorPolicy: event.target.value })}
                    >
                      {MIRROR_POLICIES.map((value) => (
                        <option key={value} value={value}>
                          {LABELS.mirrorPolicy[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Switch
                    checked={config.aiEnabled}
                    onChange={(aiEnabled) => edit({ aiEnabled })}
                    label="AI summary and tags"
                    description="Adds a one-line summary and suggested tags; never delays the reply."
                  />
                </>
              )}
            </div>
          </Card>

          {isReport && (
            <Card title="Cooldown" description="Limits how many reports one user can send.">
              <div className="space-y-4">
                <Switch
                  checked={config.cooldown !== null}
                  onChange={(on) => edit({ cooldown: on ? DEFAULT_COOLDOWN : null })}
                  label="Limit reports per user"
                />
                {config.cooldown && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Reports allowed" error={errorAt(errors, 'cooldown.maxCount')}>
                      <TextInput
                        type="number"
                        min={1}
                        max={LIMITS.cooldownMaxCount}
                        value={numberValue(config.cooldown.maxCount)}
                        onChange={(event) =>
                          edit({
                            cooldown: { ...config.cooldown, maxCount: event.target.valueAsNumber },
                          })
                        }
                      />
                    </Field>
                    <Field
                      label="Per window (seconds)"
                      error={errorAt(errors, 'cooldown.windowSeconds')}
                    >
                      <TextInput
                        type="number"
                        min={LIMITS.cooldownMinWindowSeconds}
                        max={LIMITS.cooldownMaxWindowSeconds}
                        value={numberValue(config.cooldown.windowSeconds)}
                        onChange={(event) =>
                          edit({
                            cooldown: {
                              ...config.cooldown,
                              windowSeconds: event.target.valueAsNumber,
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                )}
              </div>
            </Card>
          )}

          {isReport && (
            <Card title="Reply message">
              <Field
                label="Template"
                hint={`Placeholders: ${TEMPLATE_PLACEHOLDERS.map((name) => `{${name}}`).join(' ')}`}
                error={errorAt(errors, 'replyTemplate')}
              >
                <Textarea
                  value={config.replyTemplate}
                  maxLength={LIMITS.replyTemplate}
                  onChange={(event) => edit({ replyTemplate: event.target.value })}
                />
              </Field>
            </Card>
          )}

          {isReport && (
            <Card
              title="Rules"
              description="Checked from top to bottom; the first enabled rule that matches decides."
            >
              <RulesEditor
                rules={config.rules}
                errors={errors}
                onChange={(rules) => edit({ rules })}
              />
            </Card>
          )}
        </div>
        {isReport && (
          <div className="xl:sticky xl:top-32 xl:self-start">
            <RuleTestPanel guildId={guildId} command={command} config={config} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave without saving?"
        confirmLabel="Leave"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Your changes to {LABELS.command[command]} have not been saved.
      </ConfirmDialog>
    </form>
  );
}
