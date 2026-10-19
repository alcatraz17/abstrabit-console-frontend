import { useState } from 'react';
import { cx } from '../../utils/cx.js';
import { controlClasses } from './Field.jsx';

export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  max,
  normalize = (item) => item,
  ...aria
}) {
  const [text, setText] = useState('');

  function commit(raw) {
    const additions = raw
      .split(',')
      .map((item) => normalize(item.trim()))
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index && !value.includes(item));
    if (additions.length > 0) onChange([...value, ...additions].slice(0, max ?? Infinity));
    setText('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit(text);
    } else if (event.key === 'Backspace' && text === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  const full = max !== undefined && value.length >= max;

  return (
    <div className={cx(controlClasses, 'flex flex-wrap items-center gap-1.5 py-1.5')}>
      {value.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1 rounded bg-slate-100 py-0.5 pr-1 pl-2 text-xs text-slate-800"
        >
          {item}
          <button
            type="button"
            onClick={() => onChange(value.filter((existing) => existing !== item))}
            className="rounded px-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            aria-label={`Remove ${item}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        {...aria}
        value={text}
        disabled={full}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => text.trim() && commit(text)}
        onPaste={(event) => {
          const pasted = event.clipboardData.getData('text');
          if (pasted.includes(',')) {
            event.preventDefault();
            commit(`${text}${pasted}`);
          }
        }}
        placeholder={full ? 'Limit reached' : value.length === 0 ? placeholder : ''}
        className="min-w-24 flex-1 border-0 bg-transparent p-0.5 text-sm outline-none focus:ring-0"
      />
    </div>
  );
}
