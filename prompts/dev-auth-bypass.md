# Dev auth bypass — build and test the dashboards without Clerk

## Goal

Let the dashboards run end-to-end without Clerk keys so every feature can be built and tested first.
Real authentication gets re-enabled at the end by changing one env value. Nothing Clerk-related is
deleted: it's switched off behind a flag.

## Docs read / code inspected

- `AGENTS.md` sections 5, 7, 10, 12 (auth boundaries, roles, config).
- `proxy.ts`, `app/layout.tsx`, `lib/auth/guards.ts`, `lib/auth/roles.ts`, `lib/api/server.ts`,
  `lib/api/client.ts`, `components/shell/SidebarContent.tsx`, `components/shell/Topbar.tsx`,
  `components/shell/AppShell.tsx`, `app/(org)/dashboard/page.tsx`, `app/(org)/dashboard/[orgId]/page.tsx`.

## Decisions

1. **One switch.** `AUTH_MODE=dev` in `.env.local` turns the bypass on. Anything else, or unset,
   means Clerk as today.
2. **It can never reach production.** The bypass only activates when
   `NODE_ENV !== "production"`. `next build` with `AUTH_MODE=dev` fails with a clear error, so it
   can't be deployed by mistake.
3. **Dev personas** stand in for real users, so role-based UI can still be tested:
   - `org-super-admin`: "Aïssatou Diallo", super administrator of the demo org.
   - `org-admin`: "Moussa Ba", administrator of the demo org.
   - `platform-admin`: "Équipe Tontouma", with `/admin` access.

   The persona is picked from a small floating "Mode développement" pill (glass, bottom left) and
   stored in a `dev_persona` cookie. It's a dev-only preference, not a token. The default is
   `org-super-admin`. The demo org id is `org_demo`, so the dashboard lives at `/dashboard/org_demo`.
4. **One auth façade** (`lib/auth/session.ts`, server) exposes `getSession()`, which returns
   `{ userId, name, email, orgId, orgName, orgRole, isPlatformAdmin }` from Clerk or from the
   persona. Guards, pages, and the API client read only this façade, so switching modes touches no
   screen.
5. **Client side**, a `SessionProvider` passes the same façade to client components.
   `SidebarContent` and `Topbar` read it instead of calling `useOrganization` / `useUser` /
   `<UserButton>` / `<OrganizationSwitcher>` directly. In Clerk mode those Clerk components are
   still rendered.
6. **Rendering:**
   - `ClerkProvider` is rendered only in Clerk mode.
   - `proxy.ts` skips `clerkMiddleware` in dev mode but keeps the same route logic: `/admin` needs
     the platform persona.
   - `/sign-in` redirects to `/dashboard` in dev mode.
7. **Backend calls in dev mode** send no `Authorization` header. The live backend requires a JWT on
   `/admin/**`, so in dev mode the screens keep using fixtures unless the backend runs with its
   security disabled. That setting belongs to the backend and isn't decided here.

## Files expected

- `lib/auth/mode.ts`, `lib/auth/session.ts` (new), `lib/auth/personas.ts` (new),
  `lib/auth/guards.ts`
- `components/auth/SessionProvider.tsx` (new), `components/auth/DevPersonaSwitcher.tsx` (new)
- `proxy.ts`, `app/layout.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`
- `app/(org)/dashboard/page.tsx`, `app/(org)/dashboard/[orgId]/page.tsx`,
  `app/(admin)/admin/layout.tsx`
- `components/shell/SidebarContent.tsx`, `components/shell/Topbar.tsx`,
  `components/shell/AppShell.tsx`
- `lib/api/server.ts`, `lib/api/client.ts`
- `next.config.ts` (production guard), `.env.example` (`AUTH_MODE`)

## Security considerations

- The bypass is refused in production builds and at runtime when `NODE_ENV === "production"`.
- The personas carry no secret and no token. The persona cookie grants nothing on a real backend.
- All Clerk code stays in place. Re-enabling it means removing `AUTH_MODE=dev` and then running the
  Clerk checks in `phase-1-foundation.md`.

## Acceptance criteria

1. With `AUTH_MODE=dev` and no Clerk keys, `npm run dev` serves `/dashboard` → `/dashboard/org_demo`
   with no 500.
2. The persona switcher changes the sidebar right away:
   - The admin persona doesn't see Bornes, Membres, Abonnement, or Paramètres, and gets Forbidden
     on their URLs.
   - Only the platform persona can open `/admin`.
3. `/dashboard/other_org` redirects to `/dashboard/org_demo`.
4. `next build` with `AUTH_MODE=dev` fails with an explicit message. Without it, the build passes.
5. `tsc` and `lint` pass.

## Checks

`npx tsc --noEmit`, `npm run lint`, `npm run build` (both with and without `AUTH_MODE=dev`),
`npm run dev`, then curl `/dashboard`, `/dashboard/org_demo`, `/admin`, `/dashboard/org_demo/membres`
for each persona.

## Manual test steps

1. Put `AUTH_MODE=dev` in `.env.local` and run `npm run dev`.
2. Open `http://localhost:3000`. You land on the org overview as "Aïssatou Diallo".
3. Use the "Mode développement" pill to switch to "Moussa Ba". The management items disappear, and
   `/dashboard/org_demo/membres` shows Forbidden.
4. Switch to "Équipe Tontouma" and open `/admin`. The admin overview appears.
5. Switch back to an org persona and open `/admin`. You get Forbidden.
6. Try `FIXTURE_SCENARIO=expired`, `empty`, and `error` in turn and check the banner and states.
