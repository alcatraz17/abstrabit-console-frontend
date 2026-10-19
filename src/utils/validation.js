export function fieldErrorsFrom(issues) {
  const fields = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || 'form';
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

export function validateWith(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return { data: result.data, fields: null };
  return { data: null, fields: fieldErrorsFrom(result.error.issues) };
}
