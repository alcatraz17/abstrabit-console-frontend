import { buttonClasses } from './button-classes.js';
import { Spinner } from './Spinner.jsx';

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading && <Spinner className="size-3.5" label="Working" />}
      {children}
    </button>
  );
}
