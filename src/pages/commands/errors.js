export function errorAt(fields, path) {
  if (!fields) return undefined;
  if (fields[path]) return fields[path];
  const nested = Object.keys(fields).find((key) => key.startsWith(`${path}.`));
  return nested ? fields[nested] : undefined;
}

export function stripPrefix(fields, prefix) {
  const result = {};
  for (const [key, message] of Object.entries(fields ?? {})) {
    result[key.startsWith(`${prefix}.`) ? key.slice(prefix.length + 1) : key] = message;
  }
  return result;
}
