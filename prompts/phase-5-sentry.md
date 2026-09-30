# Phase 5 — Sentry error tracking (no personal data)

## Goal

Report runtime errors from the browser, the server and the proxy to Sentry, as required by
AGENTS.md §6, without sending any personal data: no form values, no document contents, no email
addresses, no tokens. Sentry is off when no DSN is configured (local dev keeps working as today).

## Status check done before this prompt

- Every endpoint in `docs/API-FRONT.md` is already called by `lib/data/backend.ts`,
  `lib/api/client.ts` (upload) or `lib/api/assistant.ts` (public conversations).
- Remaining in-scope features that are **blocked on the backend** (no endpoint): building maps and
  positions, QR codes, org-side members, org-side settings edit, access requests, invoices and
  subscription history. Not built here. Nothing is invented on the frontend.
- The only in-scope item not depending on the backend is Sentry (deferred "to phase 8" since phase 1).

## Docs read

- `AGENTS.md` §6 (Sentry, no personal data), §10 (env), §12 (scrub bodies and inputs).
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`,
  `instrumentation-client.md`.
- `@sentry/nextjs` 11.1.0: peer `next ^16.0.0-0` (compatible with 16.3.6).

## Code inspected

- No Sentry code or dependency exists. No `instrumentation*.ts`, no `app/global-error.tsx`.
- Route error boundaries: `app/(admin)/admin/error.tsx`, `app/(org)/dashboard/[orgId]/error.tsx`.
- `next.config.ts` exports a phase function (AUTH_MODE guard). It must keep working when wrapped.
- `.env.example` already lists `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`.

## Decisions

- Dependency: `@sentry/nextjs@^11`. No Session Replay (it records the screen, so it would capture form contents).
- `sendDefaultPii: false`. Tracing sample rate 0.1 in production, 0 in dev. Enabled only if
  `NEXT_PUBLIC_SENTRY_DSN` is set.
- One shared scrubber `lib/observability/scrub.ts` used by every runtime:
  - `beforeSend`: drop `event.request.data`, `cookies`, `headers.authorization`, `headers.cookie`,
    and `query_string`. Drop `event.user` except `id`. Replace emails anywhere in `message`,
    exception values and breadcrumbs with `[email]`.
  - `beforeBreadcrumb`: drop `ui.input` breadcrumbs. For `fetch`/`xhr` keep method, URL path
    (without query) and status only. Drop `console` breadcrumb arguments.
- Tags only: `area` = `admin` | `org`, and `orgId` (the Clerk org id, not personal data).
- Files: `instrumentation-client.ts` (browser init), `instrumentation.ts` (`register` imports the
  server or edge config; exports `onRequestError = Sentry.captureRequestError`),
  `sentry.server.config.ts`, `sentry.edge.config.ts`, `app/global-error.tsx` (French copy,
  captures the error). The two existing `error.tsx` boundaries call `Sentry.captureException`.
- `next.config.ts`: wrap with `withSentryConfig` keeping the phase function. Source maps are uploaded
  only when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are set, then deleted from the output.
  `.env.example` gains `SENTRY_ORG`, `SENTRY_PROJECT`.

## Files expected

`package.json`, `package-lock.json`, `next.config.ts`, `.env.example`, `instrumentation.ts`,
`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`,
`lib/observability/scrub.ts`, `app/global-error.tsx`, `app/(admin)/admin/error.tsx`,
`app/(org)/dashboard/[orgId]/error.tsx`.

## Security

- The DSN is public by design (`NEXT_PUBLIC_`). `SENTRY_AUTH_TOKEN` stays server/build-only.
- No request bodies, cookies, auth headers, input values, document contents or emails leave the app.
- No Clerk token is ever attached to an event.

## Acceptance criteria

- With no DSN: the app behaves exactly as today and sends nothing.
- With a DSN: an error thrown in a client component, a server component and a server action each
  appears in Sentry, with no email, token, cookie or form value in the event.
- `npx eslint .` and `npx next build` pass.

## Checks

`npx eslint .`, `npx next build`.

## Manual test

1. Create a free Sentry project (platform: Next.js) and copy its DSN into `.env.local` as `NEXT_PUBLIC_SENTRY_DSN`. Restart `npm run dev`.
2. In the browser console on any dashboard page, run `setTimeout(() => { throw new Error("test sentry client") })`.
   The event appears in Sentry within a minute.
3. Stop the backend and open `/dashboard/<id>/services`: the "Serveur injoignable" state shows, and the server error is in Sentry.
4. Open each event: no email, no `Authorization`, no cookie, no request body, no typed form values.
5. Remove the DSN, restart: nothing is sent (Network tab shows no request to `sentry.io`).
