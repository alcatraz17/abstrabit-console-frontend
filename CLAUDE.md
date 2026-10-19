# Abstrabit Console Frontend

Node.js 24, Vite, React 19, JavaScript (.jsx), React Router, TanStack Query, Tailwind CSS 4, zod, Vitest + Testing Library.
Deployed as its own Vercel project; vercel.json rewrites /api/* to the backend.

## Code style

- Source files are comment-free and self-explanatory; scripts/check-no-comments.js runs in npm run lint.
- Professional wording in code, UI copy and commit messages.
- Folders: src/api, src/common, src/components (ui, layout, guards), src/hooks, src/pages/<route>, src/store, src/utils.
- Component files export components only; shared helpers live in .js files.
- Tests in tests/: unit mirrors src, integration renders routes with a mocked fetch.

## Rules

- HTTP goes through src/api/client.js with credentials: 'same-origin'; a 401 outside /auth clears private data and leads to /login.
- Server state lives in TanStack Query under the keys in src/api/query-keys.js.
- Session state comes from GET /api/auth/me and lives in AuthProvider.
- Forms validate with the zod schemas in src/common/schemas before calling the API, and show server field errors by path.
- Pages handle loading, empty and error states, and render user text as text.
- The bundle holds no configuration or secrets; scripts/check-bundle.sh runs on every build.
- Redirects after sign-in go through safeRedirect().

## Commands

npm run dev · npm test · npm run lint · npm run format · npm run build
