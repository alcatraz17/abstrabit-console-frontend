import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'espree';

const root = path.resolve(import.meta.dirname, '..');
const scanned = ['src', 'tests', 'scripts'];
const extensions = new Set(['.js', '.jsx']);

async function collect(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) return collect(full);
      return extensions.has(path.extname(entry.name)) ? [full] : [];
    }),
  );
  return nested.flat();
}

const files = (await Promise.all(scanned.map((dir) => collect(path.join(root, dir))))).flat();
const violations = [];

for (const file of files) {
  const { comments } = parse(await readFile(file, 'utf8'), {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    comment: true,
    loc: true,
  });
  for (const comment of comments) {
    violations.push(`${path.relative(root, file)}:${comment.loc.start.line}`);
  }
}

if (violations.length > 0) {
  console.error('Source files must not contain comments:');
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
