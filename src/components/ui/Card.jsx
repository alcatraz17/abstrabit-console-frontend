import { cx } from '../../utils/cx.js';

export function Card({ title, description, actions, children, className, bodyClassName }) {
  return (
    <section className={cx('rounded-xl border border-slate-200 bg-white shadow-xs', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx('px-5 py-4', bodyClassName)}>{children}</div>
    </section>
  );
}
