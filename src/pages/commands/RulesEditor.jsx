import { LIMITS, PRIORITIES, SEVERITIES } from '../../common/constants.js';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Select, TextInput } from '../../components/ui/Field.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { TagInput } from '../../components/ui/TagInput.jsx';
import { humanize } from '../../utils/format.js';
import { errorAt } from './errors.js';

const MIRROR_OVERRIDES = [
  { value: 'default', label: 'Follow the mirror policy' },
  { value: 'true', label: 'Always mirror' },
  { value: 'false', label: 'Never mirror' },
];

function newRuleId() {
  return `rule-${crypto.randomUUID().slice(0, 8)}`;
}

function createRule() {
  return {
    id: newRuleId(),
    name: '',
    enabled: true,
    match: { anyKeywords: [], severityIn: [] },
    then: { priority: 'high', addTags: [], mirror: null },
  };
}

function RuleCard({ rule, index, total, errors, onChange, onMove, onRemove }) {
  const base = `rules.${index}`;
  const set = (patch) => onChange({ ...rule, ...patch });
  const setMatch = (patch) => set({ match: { ...rule.match, ...patch } });
  const setThen = (patch) => set({ then: { ...rule.then, ...patch } });

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Rule {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)}>
            Move up
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            Move down
          </Button>
          <Button size="sm" variant="ghost" className="text-rose-600" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" error={errorAt(errors, `${base}.name`)}>
          <TextInput
            value={rule.name}
            maxLength={LIMITS.ruleName}
            onChange={(event) => set({ name: event.target.value })}
            placeholder="Outage keywords"
          />
        </Field>
        <div className="flex items-end pb-1">
          <div className="w-full">
            <Switch
              checked={rule.enabled}
              onChange={(enabled) => set({ enabled })}
              label="Enabled"
              description="Disabled rules are kept but never match."
            />
          </div>
        </div>
        <Field
          label="When the report contains any of"
          hint="Whole words or phrases, case and accents ignored. Press Enter or comma to add."
          error={errorAt(errors, `${base}.match.anyKeywords`)}
        >
          <TagInput
            value={rule.match.anyKeywords}
            max={LIMITS.keywordsPerRule}
            onChange={(anyKeywords) => setMatch({ anyKeywords })}
            placeholder="outage, down, payment failed"
          />
        </Field>
        <fieldset>
          <legend className="text-sm font-medium text-slate-800">And the severity is</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {SEVERITIES.map((severity) => (
              <label key={severity} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300 text-indigo-600"
                  checked={rule.match.severityIn.includes(severity)}
                  onChange={(event) =>
                    setMatch({
                      severityIn: event.target.checked
                        ? SEVERITIES.filter(
                            (item) => item === severity || rule.match.severityIn.includes(item),
                          )
                        : rule.match.severityIn.filter((item) => item !== severity),
                    })
                  }
                />
                {humanize(severity)}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">Leave all unchecked to match any severity.</p>
        </fieldset>
        <Field label="Set priority to" error={errorAt(errors, `${base}.then.priority`)}>
          <Select
            value={rule.then.priority ?? ''}
            onChange={(event) => setThen({ priority: event.target.value || null })}
          >
            <option value="">Keep the priority from severity</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {humanize(priority)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Mirror" error={errorAt(errors, `${base}.then.mirror`)}>
          <Select
            value={rule.then.mirror === null ? 'default' : String(rule.then.mirror)}
            onChange={(event) =>
              setThen({
                mirror: event.target.value === 'default' ? null : event.target.value === 'true',
              })
            }
          >
            {MIRROR_OVERRIDES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Add tags"
          hint="Lowercase letters, digits, hyphens and underscores."
          error={errorAt(errors, `${base}.then.addTags`)}
          className="md:col-span-2"
        >
          <TagInput
            value={rule.then.addTags}
            max={LIMITS.tagsPerRule}
            normalize={(tag) => tag.toLowerCase()}
            onChange={(addTags) => setThen({ addTags })}
            placeholder="outage, billing"
          />
        </Field>
      </div>
    </li>
  );
}

export function RulesEditor({ rules, errors, onChange }) {
  function update(index, rule) {
    onChange(rules.map((existing, position) => (position === index ? rule : existing)));
  }

  function move(index, offset) {
    const next = [...rules];
    const [rule] = next.splice(index, 1);
    next.splice(index + offset, 0, rule);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {errors?.rules && <p className="text-sm font-medium text-rose-600">{errors.rules}</p>}
      {rules.length === 0 ? (
        <p className="text-sm text-slate-500">
          No rules yet. Without rules, priority comes from the severity the user picks.
        </p>
      ) : (
        <ol className="space-y-3">
          {rules.map((rule, index) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              index={index}
              total={rules.length}
              errors={errors}
              onChange={(next) => update(index, next)}
              onMove={(offset) => move(index, offset)}
              onRemove={() => onChange(rules.filter((_, position) => position !== index))}
            />
          ))}
        </ol>
      )}
      <Button
        variant="secondary"
        disabled={rules.length >= LIMITS.rulesPerCommand}
        onClick={() => onChange([...rules, createRule()])}
      >
        Add rule
      </Button>
      {rules.length >= LIMITS.rulesPerCommand && (
        <p className="text-xs text-slate-500">
          A command has at most {LIMITS.rulesPerCommand} rules.
        </p>
      )}
    </div>
  );
}
