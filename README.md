# Abstrabit Console Frontend

The admin console for the Abstrabit Discord bot. Administrators sign in, watch every command as it happens, configure how commands behave, connect Discord servers and recover failed deliveries.

- **Stack:** Node.js 24, Vite, React 19 (JavaScript, `.jsx`), React Router, TanStack Query, Tailwind CSS 4, zod, Vitest + Testing Library.
- **Backend:** [abstrabit-console-backend](https://github.com/alcatraz17/abstrabit-console-backend). The browser talks to it only through `/api` on the same origin, so the session cookie stays first-party and no configuration reaches the bundle.

## Pages

| Route       | Purpose                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`    | Email and password sign-in with validation, rate-limit feedback and safe `next` redirects                                                               |
| `/`         | Overview: volume, success rate, acknowledgement latency, open reports, retries, failures, rejected requests, sweeper age                                |
| `/live`     | Live log with filters, incremental updates every few seconds and a details drawer (`?interaction=<id>`) with the decision, report, actions and timeline |
| `/commands` | Per-command configuration, ordered rules editor, a test panel for unsaved changes and versioned saves with conflict resolution                          |
| `/servers`  | Bot invite, one-time connect codes with countdown, report channel and mirror settings, test message, command re-registration, disconnect                |
| `/failures` | Retrying and failed deliveries with retry actions, plus security events                                                                                 |
| `/demo`     | Mirror-outage and slow-AI simulations, with a banner while active                                                                                       |

## Structure

```
src/
├─ api/            client.js (fetch wrapper, ApiError, 401 handling), auth.api.js, admin.api.js, query-keys.js
├─ common/         constants.js and zod schemas for forms
├─ components/     ui (design primitives), layout (shell, server switcher, banners), guards (route protection)
├─ hooks/          useNow, useUnsavedChangesGuard
├─ pages/          one folder per route with its page-specific components
├─ store/          AuthProvider, GuildProvider, ToastProvider and their hooks
├─ utils/          formatting, safeRedirect, storage, validation helpers
├─ routes.jsx      route tree shared by the app and the tests
└─ main.jsx        browser entry
tests/
├─ unit/           mirrors src
├─ integration/    full routes rendered against a mocked API
└─ helpers/        mock fetch, fixtures, render helper
```

## Local setup

```bash
npm install
npm run dev
```

Start the backend on port 3000 first. Vite serves the console on `http://localhost:5173` and proxies `/api` to the backend, which must have `APP_URL=http://localhost:5173`.

## Quality checks

```bash
npm run lint
npm run format:check
npm test
npm run build
```

`npm run build` also runs `scripts/check-bundle.sh`, which fails if the output contains secret-shaped values or source maps. `npm run lint` includes `scripts/check-no-comments.js`. CI runs all four on every push.

## Deployment

1. Import this repository into Vercel with the Vite preset and Node.js 24.x. It needs no environment variables.
2. In `vercel.json`, the first rewrite points `/api/*` at the backend deployment. Update the destination if the backend domain differs.
3. Set the backend's `APP_URL` to this project's production URL.

`vercel.json` also serves `index.html` for client-side routes, caches hashed assets for a year and sets a strict Content Security Policy, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`.
