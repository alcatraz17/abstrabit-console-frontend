import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '../../api/client.js';
import { APP_NAME } from '../../common/constants.js';
import { loginSchema } from '../../common/schemas/auth.schema.js';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { useAuth } from '../../store/hooks.js';
import { safeRedirect } from '../../utils/safeRedirect.js';
import { validateWith } from '../../utils/validation.js';

function describeFailure(error) {
  if (!(error instanceof ApiError)) return 'Sign-in failed. Try again.';
  if (error.status === 429) {
    const minutes = error.retryAfterSeconds ? Math.ceil(error.retryAfterSeconds / 60) : null;
    return minutes
      ? `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
      : error.message;
  }
  return error.message;
}

export function LoginPage() {
  const { signIn, notice, dismissNotice } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  function update(field) {
    return (event) => {
      const { value } = event.target;
      setValues((current) => ({ ...current, [field]: value }));
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const { data, fields } = validateWith(loginSchema, values);
    if (fields) {
      setFieldErrors(fields);
      (fields.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    dismissNotice();
    try {
      await signIn(data);
      navigate(safeRedirect(searchParams.get('next')), { replace: true });
    } catch (error) {
      setFormError(describeFailure(error));
      if (error instanceof ApiError && Object.keys(error.fields).length > 0) {
        setFieldErrors(error.fields);
      }
      setValues((current) => ({ ...current, password: '' }));
      passwordRef.current?.focus();
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/favicon.svg" alt="" className="mx-auto size-10" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
            Sign in to {APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Administrators only.</p>
        </div>
        <form
          noValidate
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
        >
          {notice && !formError && <Alert tone="warning">{notice}</Alert>}
          {formError && <Alert tone="error">{formError}</Alert>}
          <Field label="Email" error={fieldErrors.email}>
            <TextInput
              ref={emailRef}
              type="email"
              name="email"
              autoComplete="username"
              autoFocus
              value={values.email}
              onChange={update('email')}
            />
          </Field>
          <Field label="Password" error={fieldErrors.password}>
            <TextInput
              ref={passwordRef}
              type="password"
              name="password"
              autoComplete="current-password"
              value={values.password}
              onChange={update('password')}
            />
          </Field>
          <Button type="submit" className="w-full" loading={submitting}>
            {submitting ? 'Signing in' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  );
}
