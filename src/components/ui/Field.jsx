import { cloneElement, useId } from 'react';
import { cx } from '../../utils/cx.js';

export const controlClasses =
  'block w-full rounded-md border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 aria-invalid:ring-rose-400';

export function Field({ label, hint, error, children, className }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ className, ...props }) {
  return <input className={cx(controlClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cx(controlClasses, 'min-h-24', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cx(controlClasses, 'pr-8', className)} {...props}>
      {children}
    </select>
  );
}
