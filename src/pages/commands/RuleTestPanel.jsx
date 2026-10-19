import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { LABELS, LIMITS, SEVERITIES } from '../../common/constants.js';
import { commandConfigSchema, ruleTestInputSchema } from '../../common/schemas/command.schema.js';
import { Alert } from '../../components/ui/Alert.jsx';
import { Badge, PriorityBadge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Field, Select, Textarea, TextInput } from '../../components/ui/Field.jsx';
import { humanize, labelFor } from '../../utils/format.js';
import { validateWith } from '../../utils/validation.js';

function DecisionResult({ decision }) {
  if (!decision.allowed) {
    return (
      <Alert tone="warning" title="Blocked">
        {labelFor(LABELS.blockReason, decision.reason)}
      </Alert>
    );
  }
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      <dt className="text-slate-500">Priority</dt>
      <dd>
        <PriorityBadge priority={decision.priority} />
      </dd>
      <dt className="text-slate-500">Matched rule</dt>
      <dd className="text-slate-900">
        {decision.matchedRuleName ?? 'None'}
        {decision.matchedKeyword && (
          <span className="text-slate-500"> · keyword “{decision.matchedKeyword}”</span>
        )}
      </dd>
      <dt className="text-slate-500">Tags</dt>
      <dd className="flex flex-wrap gap-1">
        {decision.tags.length
          ? decision.tags.map((tag) => (
              <Badge key={tag} tone="accent">
                {tag}
              </Badge>
            ))
          : '—'}
      </dd>
      <dt className="text-slate-500">Channel card</dt>
      <dd className="text-slate-900">{decision.postToChannel ? 'Posted' : 'Not posted'}</dd>
      <dt className="text-slate-500">Mirror</dt>
      <dd className="text-slate-900">{decision.mirror ? 'Mirrored' : 'Not mirrored'}</dd>
      <dt className="text-slate-500">Reply</dt>
      <dd className="text-slate-900">{labelFor(LABELS.visibility, decision.visibility)}</dd>
    </dl>
  );
}

export function RuleTestPanel({ guildId, command, config }) {
  const [input, setInput] = useState({ text: '', severity: '', recentCountForUser: 0 });
  const [problem, setProblem] = useState(null);

  const test = useMutation({
    mutationFn: (body) => adminApi.testRules(guildId, body),
  });

  function run(event) {
    event.preventDefault();
    const parsedConfig = validateWith(commandConfigSchema, config);
    if (parsedConfig.fields) {
      setProblem('Fix the highlighted configuration fields before testing.');
      return;
    }
    const parsedInput = validateWith(ruleTestInputSchema, {
      ...input,
      severity: input.severity || null,
    });
    if (parsedInput.fields) {
      setProblem(Object.values(parsedInput.fields)[0]);
      return;
    }
    setProblem(null);
    test.mutate({ command, config: parsedConfig.data, input: parsedInput.data });
  }

  return (
    <Card
      title="Test this configuration"
      description="Runs your unsaved changes against sample input without sending anything."
    >
      <form onSubmit={run} className="space-y-4">
        <Field label="Report text">
          <Textarea
            value={input.text}
            maxLength={LIMITS.reportText}
            onChange={(event) => setInput({ ...input, text: event.target.value })}
            placeholder="Checkout is down for everyone in the EU"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Severity">
            <Select
              value={input.severity}
              onChange={(event) => setInput({ ...input, severity: event.target.value })}
            >
              <option value="">Not specified</option>
              {SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>
                  {humanize(severity)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Recent reports by this user" hint="Checks the cooldown.">
            <TextInput
              type="number"
              min={0}
              max={1000}
              value={Number.isNaN(input.recentCountForUser) ? '' : input.recentCountForUser}
              onChange={(event) =>
                setInput({ ...input, recentCountForUser: event.target.valueAsNumber })
              }
            />
          </Field>
        </div>
        {problem && <Alert tone="error">{problem}</Alert>}
        {test.isError && <Alert tone="error">{test.error.message}</Alert>}
        <Button type="submit" variant="secondary" loading={test.isPending}>
          Run test
        </Button>
        {test.isSuccess && !problem && (
          <div className="border-t border-slate-100 pt-4">
            <DecisionResult decision={test.data} />
          </div>
        )}
      </form>
    </Card>
  );
}
