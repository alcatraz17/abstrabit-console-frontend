import { cx } from '../../utils/cx.js';

export function Tabs({ value, onChange, options, label }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-lg bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cx(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === option.value
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="ml-1.5 text-xs text-slate-500">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
