import { useEffect, useId, useRef } from 'react';
import { cx } from '../../utils/cx.js';

export function Dialog({ open, onClose, title, description, children, footer, variant = 'modal' }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const drawer = variant === 'drawer';

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cx(
        'bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40',
        drawer
          ? 'mr-0 ml-auto h-dvh max-h-dvh w-full max-w-2xl'
          : 'm-auto w-[calc(100%-2rem)] max-w-md rounded-xl',
      )}
    >
      {open && (
        <div className={cx('flex flex-col', drawer && 'h-full')}>
          <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 text-lg leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              ×
            </button>
          </header>
          <div className={cx('px-5 py-4', drawer && 'flex-1 overflow-y-auto')}>{children}</div>
          {footer && (
            <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
