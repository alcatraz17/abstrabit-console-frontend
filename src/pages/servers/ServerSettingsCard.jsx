import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { ApiError } from '../../api/client.js';
import { queryKeys } from '../../api/query-keys.js';
import { LABELS, LIMITS, MIRROR_KINDS } from '../../common/constants.js';
import { MIRROR_URL_HINTS, settingsSchema } from '../../common/schemas/guild.schema.js';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Field, Select, TextInput } from '../../components/ui/Field.jsx';
import { useToast } from '../../store/hooks.js';
import { validateWith } from '../../utils/validation.js';

function ChannelSelect({ guildId, value, onChange, ...props }) {
  const channels = useQuery({
    queryKey: queryKeys.channels(guildId),
    queryFn: ({ signal }) => adminApi.channels(guildId, signal),
    staleTime: 30_000,
  });
  const list = channels.data ?? [];
  const missing = value && channels.isSuccess && !list.some((channel) => channel.id === value);

  return (
    <div className="space-y-2">
      <Select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        disabled={channels.isPending}
        {...props}
      >
        <option value="">Do not post cards (reply only)</option>
        {value && !channels.isSuccess && <option value={value}>Current channel</option>}
        {missing && <option value={value}>Unknown channel (it may have been deleted)</option>}
        {list.map((channel) => (
          <option key={channel.id} value={channel.id} disabled={!channel.canPost}>
            #{channel.name}
            {channel.canPost ? '' : ' (bot is missing permissions)'}
          </option>
        ))}
      </Select>
      {channels.isError && (
        <p className="flex flex-wrap items-center gap-2 text-xs text-rose-600">
          {channels.error.message}
          <button type="button" className="underline" onClick={() => channels.refetch()}>
            Try again
          </button>
        </p>
      )}
    </div>
  );
}

export function ServerSettingsCard({ guild }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [values, setValues] = useState({
    postChannelId: guild.postChannelId,
    mirrorKind: guild.mirrorKind,
    mirrorUrl: '',
  });
  const [errors, setErrors] = useState({});

  const hasStoredUrl = Boolean(guild.mirrorUrlMasked) && values.mirrorKind === guild.mirrorKind;
  const dirty =
    values.postChannelId !== guild.postChannelId ||
    values.mirrorKind !== guild.mirrorKind ||
    values.mirrorUrl.trim() !== '';

  const save = useMutation({
    mutationFn: (settings) => adminApi.saveSettings(guild.id, settings),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.guilds, (current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success('Server settings saved.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 400) setErrors(error.fields);
      toast.error(error.message);
    },
  });

  function set(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(event) {
    event.preventDefault();
    const { data, fields } = validateWith(settingsSchema({ hasStoredUrl }), values);
    if (fields) {
      setErrors(fields);
      return;
    }
    save.mutate({
      postChannelId: data.postChannelId,
      mirrorKind: data.mirrorKind,
      mirrorUrl: data.mirrorKind === 'none' ? null : data.mirrorUrl || null,
    });
  }

  return (
    <Card title="Delivery settings" description="Where report cards and mirrored copies are sent.">
      <form noValidate onSubmit={submit} className="space-y-5">
        <Field
          label="Report channel"
          hint="The bot needs View Channel, Send Messages, Embed Links and Read Message History."
          error={errors.postChannelId}
        >
          <ChannelSelect
            guildId={guild.id}
            value={values.postChannelId}
            onChange={(value) => set('postChannelId', value)}
          />
        </Field>
        <Field label="Mirror to" error={errors.mirrorKind}>
          <Select
            value={values.mirrorKind}
            onChange={(event) => set('mirrorKind', event.target.value)}
          >
            {MIRROR_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {LABELS.mirrorKind[kind]}
              </option>
            ))}
          </Select>
        </Field>
        {values.mirrorKind !== 'none' && (
          <Field
            label="Webhook URL"
            hint={
              hasStoredUrl
                ? `Saved: ${guild.mirrorUrlMasked}. Leave empty to keep it.`
                : 'Stored encrypted and never shown again in full.'
            }
            error={errors.mirrorUrl}
          >
            <TextInput
              type="url"
              autoComplete="off"
              spellCheck={false}
              maxLength={LIMITS.mirrorUrl}
              placeholder={MIRROR_URL_HINTS[values.mirrorKind]}
              value={values.mirrorUrl}
              onChange={(event) => set('mirrorUrl', event.target.value)}
            />
          </Field>
        )}
        {errors.form && <Alert tone="error">{errors.form}</Alert>}
        <Button type="submit" disabled={!dirty} loading={save.isPending}>
          Save settings
        </Button>
      </form>
    </Card>
  );
}
