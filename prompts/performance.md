# Performance — slow first load, faster navigation

## Goal

Find why the app feels very slow on arrival and better after a few minutes, then remove the causes
without changing any feature.

## Diagnosis (measured on this machine, 6 Oct 2026)

Dev server started on port 3100 with `AUTH_MODE=dev`, `DATA_SOURCE=mock`.

| Step | Time |
|---|---|
| `next.config.ts` evaluation | 17.4 s |
| First page ever opened (`/dashboard/…`) | 93 s total, of which 43 s is compilation (instrumentation + page) and 3.6 s the proxy |
| First visit of each other page | 2 to 4 s (compiled on demand) |
| Same pages, second visit | 0.4 to 0.7 s |
| `/admin` pages, second visit | 0.2 to 0.3 s |

What this shows:

1. **The slowness is the dev server compiling each page the first time it is opened.** That is why
   it gets better after a few minutes: every page already visited is compiled. `next dev` always
   works this way; a production build does not. Production speed was not measured (see Checks).
2. **The machine is short on memory.** 8 GB RAM, 0.7 GB free during the test, and a second Next dev
   server (`C:\o-menu\apps\web`) was running at the same time on port 3000. This multiplies every
   compile time.
3. **Sentry is loaded everywhere although no DSN is set.** `withSentryConfig` wraps the config,
   `instrumentation.ts` compiles the Sentry server SDK before the first page, and
   `instrumentation-client.ts` puts the browser SDK in every page. `@sentry` is 64 MB in
   `node_modules`. With no DSN it does nothing useful.
4. **Mock backend adds 120 ms per call** (`DELAY_MS` in `lib/data/mock/ops.ts`). Most of the
   0.4 to 0.7 s on warm pages is this delay.
5. **Pages are invisible until JavaScript has loaded.** `PageTransition` and `Stagger` render
   `opacity: 0` in the server HTML and only fade in after hydration, then animate for 0.55 to 0.6 s.
   On a slow first load the screen stays empty although the HTML has arrived.
6. **In Clerk mode, every navigation calls the Clerk API** (`currentUser()` in
   `lib/auth/session.ts`) only to read the name, email and avatar. Not measured (no Clerk session in
   the test); it is one network round trip to Clerk per page.
7. **Skills and packages are not the cause.** All dependencies are imported somewhere except
   `@types/qrcode` (no `qrcode` package, no import). The 26 skills are copied in three folders
   (`.agents`, `.claude`, `.devin`: 729 tracked files, 69 TS/JS files). They never ship to the
   browser. They only add files for TypeScript and Tailwind to scan.

## Docs read

- `AGENTS.md`.
- To read before coding: Next docs `instrumentation.md`, `instrumentation-client.md`,
  `local-development.md`, `memory-usage.md`, `package-bundling.md`; Sentry Next.js manual setup for
  the installed version; Tailwind v4 source detection for the installed version.

## Code inspected

`package.json`, `next.config.ts`, `proxy.ts`, `instrumentation.ts`, `instrumentation-client.ts`,
`lib/observability/scrub.ts`, `app/layout.tsx`, `app/(org)/dashboard/[orgId]/layout.tsx`,
`template.tsx`, `page.tsx`, `app/(admin)/admin/layout.tsx`, `lib/auth/session.ts`, `guards.ts`,
`lib/api/server.ts`, `lib/data/load.ts`, `repository.ts`, `mock/ops.ts`, `components/shell/*`,
`components/motion/Motion.tsx`, `components/auth/LazyClerk.tsx`, `app/globals.css`, `tsconfig.json`,
`eslint.config.mjs`, `skills-lock.json`.

## Decisions

### A. Dev start-up

1. **Sentry loads only when `NEXT_PUBLIC_SENTRY_DSN` is set.**
   - `next.config.ts`: apply `withSentryConfig` only when the DSN is set.
   - `instrumentation.ts`: import the Sentry configs and `captureRequestError` dynamically, only
     when the DSN is set.
   - `instrumentation-client.ts`: load the browser SDK with a dynamic import only when the DSN is
     set, so it leaves the main bundle. `onRouterTransitionStart` forwards once loaded.
   - `app/global-error.tsx` and the two `error.tsx`: same dynamic import.
   - The scrubbing rules in `lib/observability/scrub.ts` do not change.
2. **Tailwind and TypeScript stop scanning the skills folders**: add `.agents`, `.claude`, `.devin`
   to `tsconfig.json` `exclude`, and exclude them from Tailwind's source detection in
   `app/globals.css`.

### B. Navigation speed

3. **Mock delay**: `DELAY_MS` becomes `MOCK_DELAY_MS` from the environment, default `0`. Set it to
   `120` or more to look at loading states.
4. **Page entrance in CSS**: `PageTransition`, `Stagger` and `StaggerItem` use a CSS animation
   (`tw-animate-css`, already installed) instead of `motion`. Content is visible without JavaScript,
   and the duration goes from 0.55 s to about 0.25 s. Same effect (fade and slight rise), shorter.
   `prefers-reduced-motion` is still respected by the existing rule in `globals.css`.
5. **Clerk identity without a network call**: `clerkSession()` reads name, email and avatar from
   the session token claims when they are present, and falls back to `currentUser()` when they are
   not. Nothing breaks if the Clerk dashboard is not updated; it gets faster once it is.

### C. Clean-up

6. Remove `@types/qrcode`.
7. Remove the skills that cannot apply to this project from the three folders and from
   `skills-lock.json`: `clerk-android`, `clerk-astro-patterns`, `clerk-billing` (Clerk Billing is
   forbidden by `AGENTS.md`), `clerk-chrome-extension-patterns`, `clerk-expo`,
   `clerk-nuxt-patterns`, `clerk-react-patterns`, `clerk-react-router-patterns`, `clerk-swift`,
   `clerk-tanstack-patterns`, `clerk-vue-patterns`. The other 15 stay.

### Not in this prompt

- The org layout still waits for the subscription check (3 s maximum) before drawing the shell.
  Streaming it is a larger change; to decide after this pass is measured.
- No change to features, endpoints, roles or visual design other than the entrance animation length.

## Files expected

`next.config.ts`, `instrumentation.ts`, `instrumentation-client.ts`, `app/global-error.tsx`,
`app/(org)/dashboard/[orgId]/error.tsx`, `app/(admin)/admin/error.tsx`, `tsconfig.json`,
`app/globals.css`, `lib/data/mock/ops.ts`, `.env.example`, `components/motion/Motion.tsx`,
`lib/auth/session.ts`, `package.json`, `package-lock.json`, `skills-lock.json`, and the deleted
skill folders under `.agents/skills`, `.claude/skills`, `.devin/skills`.

## Security

- Sentry scrubbing is unchanged: same `beforeSend` and `beforeBreadcrumb`, no PII, no replay.
- Token claims are used for display only (name, email, avatar). Roles, organization and
  `platform_role` are read exactly as today. The backend stays the only authority.
- No secret moves to the browser; `NEXT_PUBLIC_SENTRY_DSN` is already public.
- Tenant isolation and role checks are untouched.

## Acceptance criteria

- With no DSN: `next.config.ts` no longer loads Sentry, no "Compiling instrumentation" Sentry cost,
  no Sentry code in the browser bundle.
- With a DSN: errors still reach Sentry, scrubbed, from server and browser.
- First page after `npm run dev` and first visit of each page are faster than the table above,
  measured the same way and reported with real numbers.
- Warm mock pages answer in under 200 ms.
- Page content is visible in the server HTML (no `opacity: 0` wrapper).
- `tsc`, `lint` and `build` pass.

## Checks to run

1. `npx tsc --noEmit`, `npm run lint`, `npm run build`.
2. Same timing script as the diagnosis (cold then warm, same pages), before/after table.
3. `npm run build` then `npm run start` with a reachable backend, to measure production. This needs
   the backend, because `DATA_SOURCE=mock` is refused in production.

## Manual test steps

1. Close the other dev server (`C:\o-menu`). Run `npm run dev`, open `/dashboard`: note the time to
   the first screen.
2. Click through every sidebar entry twice: the second visit is immediate.
3. Disable JavaScript in the browser and reload a dashboard page: the content is visible.
4. Set `MOCK_DELAY_MS=800`, restart: skeletons appear on each page.
5. Set a `NEXT_PUBLIC_SENTRY_DSN`, restart, trigger an error (`FIXTURE_SCENARIO=error`): the event
   arrives in Sentry without email, cookie or form value.
6. Sign in with Clerk as a super_admin: name, email and avatar appear in the sidebar; the greeting
   shows the first name.
7. Sign in as an admin: members, kiosks, settings and subscription are still hidden.

## What you can do outside the code

- Run only one dev server at a time on this 8 GB machine.
- Add the project folder to the Windows Defender exclusions (administrator rights needed; I could
  not read the current exclusions).
- In the Clerk dashboard, add to the session token: `first_name`, `full_name`, `email`,
  `image_url` (exact claim names will be listed in `.env.example`).

## Results (measured after the change, same machine, same day)

| Measure | Before | After |
|---|---|---|
| `next.config.ts` evaluation | 2.8 to 17.4 s | 0.1 to 0.4 s |
| First page after a restart, cache already filled | 19.5 to 27.8 s (3 runs) | 14.1 to 14.9 s (4 runs) |
| First page with an empty cache | 65 and 93 s (2 runs) | 78 and 80 s (2 runs) |
| Dashboard page, second visit | 0.8 to 1.2 s | 0.65 to 0.9 s |
| Production: `/sign-in`, second visit | not measured | 0.06 s |

- Not met: "warm mock pages under 200 ms". Removing the mock delay was not enough; the rest is
  spent rendering in dev mode. Cause not identified.
- Not met in full: `PageHeader` (kicker, title, description) still renders `opacity: 0` until
  hydration. It was not in the list of this prompt.
- Open: the very first request after a restart returned 404 twice out of 9 starts with the new code
  (the next request was 200), never in 5 starts with the old code, and not in the last 5 starts.
  Each time the previous server had been force-killed. Cause not identified.
- Not tested: Sentry with a real DSN, Clerk sign-in with the new token claims, production dashboard
  pages (they need the backend).
- Next.js reports "Slow filesystem detected" for `.next/dev` on this machine.
- `lib/observability/report.ts` was added (shared helper for the three error screens).
