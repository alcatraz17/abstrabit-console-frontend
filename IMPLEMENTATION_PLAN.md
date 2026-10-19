# Implementation Plan: Abstrabit Console Frontend

The admin console for the Discord slash-command bot. Administrators sign in, follow every command as it happens, configure how commands behave, connect Discord servers and recover failed deliveries. The console talks to `abstrabit-console-backend` only through `/api` on the same origin.

## Stack

- Node.js 24, Vite, React 19 with JavaScript (`.jsx`)
- React Router for routing, TanStack Query for server state
- Tailwind CSS 4
- zod for form validation
- Vitest with Testing Library and a mocked `fetch`
- Vercel with a rewrite of `/api/*` to the backend, so the session cookie stays first-party

## Pages

| Route       | Purpose                                                                         |
| ----------- | ------------------------------------------------------------------------------- |
| `/login`    | Email and password sign-in                                                      |
| `/`         | Overview of volume, success rate, acknowledgement latency, retries and failures |
| `/live`     | Live log with filters and a details drawer                                      |
| `/commands` | Command configuration, rules editor and rule tester                             |
| `/servers`  | Bot invite, connect codes, report channel and mirror settings                   |
| `/failures` | Retrying and failed deliveries, security events                                 |
| `/demo`     | Mirror-outage and slow-AI simulations                                           |

## Progress

### 1. Foundation

- [x] Vite, React, Tailwind CSS, ESLint, Prettier, Vitest and the CI workflow
- [x] `vercel.json` with the `/api` rewrite, client-side routing and security headers
- [x] Bundle scan in the build and the comment check in lint
- [x] UI primitives: button, field, switch, tag input, card, alert, badge, dialog, tabs, spinner and relative time
- [x] Formatting and validation helpers

### 2. Session and shell

- [ ] API client with typed errors, same-origin credentials and 401 handling
- [ ] Auth provider backed by `GET /api/auth/me`, and toast notifications
- [ ] Login page with validation, credential and rate-limit banners and safe `next` redirects
- [ ] Route guards, app layout, server switcher and demo banner
- [ ] Overview page

### 3. Pages

- [ ] Servers: bot invite, connect codes with countdown, report channel and mirror settings, test message, re-registration and disconnect
- [ ] Commands: configuration form, rules editor, rule tester, versioned saves with conflict handling and an unsaved-changes guard
- [ ] Live log: filters, incremental polling with a cursor and a details drawer with the decision, actions and timeline
- [ ] Failures: retrying and failed jobs, bulk retry and security events
- [ ] Demo controls: mirror-outage and slow-AI toggles

### 4. Tests

- [ ] Unit tests for the API client, redirects, formatting, form schemas and feed merging
- [ ] Integration tests for sign-in and sign-out
- [ ] Integration tests for servers
- [ ] Integration tests for command configuration
- [ ] Integration tests for the overview, live log and failures pages

### 5. Documentation

- [x] `CLAUDE.md` with the code style and rules
- [ ] README with pages, structure, local setup, quality checks and deployment

### 6. Deployment

- [ ] Vercel project with the Vite preset and Node.js 24.x
- [ ] `/api` rewrite pointed at the production backend, and the backend `APP_URL` set to the console URL
- [ ] Sign-in, live log and retries checked against production
