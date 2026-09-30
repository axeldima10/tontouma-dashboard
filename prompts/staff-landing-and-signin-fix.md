# Staff landing on /admin, org-creation lockdown, sign-in panel fix

## Goal

1. A Tontouma staff member (`platform_role = SUPER_ADMIN`) lands on `/admin` after signing in.
2. Organization users can never create an organization from the dashboard UI, and only see the
   organizations they belong to.
3. The sign-in illustration panel no longer overlaps its cards (see the screenshot: the
   "Guide du citoyen 2026" card sits under the chat bubble).

## Docs read

- `AGENTS.md` §5, §7 (roles, platform admin claim), §12.
- `docs/API-FRONT.md`: `POST /superadmin/organizations` (creates the Clerk org and invites the
  first admin), `POST/DELETE /superadmin/organizations/{id}/admins`, `GET …/members`, `GET /me`.
- Clerk `OrganizationSwitcher` / `OrganizationList` (installed `@clerk/nextjs` 7.x).

## Code inspected

- `app/(org)/dashboard/page.tsx`: entry. Redirects to the active org; shows `OrganizationList` otherwise.
- `components/shell/Sidebar.tsx:121-138`: staff bridge link, points to `/dashboard` from `/admin`.
- `components/auth/ClerkWidgets.tsx`: `ClerkOrgSwitcher`, `ClerkOrgList` (both pass `afterCreateOrganizationUrl`).
- `components/shell/SignInStory.tsx`: three cards absolutely positioned with `%` offsets around a
  centered chat. They collide at common `lg` widths.
- `.env.example`: `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard`.

## Decisions and assumptions

- Staff routing is decided on the server in `/dashboard` (the post-sign-in URL): if
  `session.isPlatformAdmin`, redirect to `/admin` before anything else. No new env value.
- The sidebar bridge from `/admin` goes to `/dashboard/<activeOrgId>` when the staff member has an
  active org, and is hidden otherwise (going to `/dashboard` would bounce back to `/admin`).
- Org creation is disabled in the Clerk Dashboard (the real control). In the UI we also remove
  `afterCreateOrganizationUrl` so no "create" path is advertised. The backend still owns creation.
- Staff are **not** made members of every client organization. `/admin` is their global view. Access
  to a client's content (services, procedures) requires the client to invite them, or Clerk
  impersonation from the Clerk Dashboard (audited). See the recommendations in the chat reply.
- Sign-in panel: replace absolute `%` positions with a staggered vertical flow (card right, chat,
  card left, card right) so overlap is impossible at any width. Same cards, glass styles and
  floating animation, which stays off under `prefers-reduced-motion` through `MotionConfig`.

## Files expected

- `app/(org)/dashboard/page.tsx`: staff redirect.
- `components/shell/Sidebar.tsx`: bridge link target.
- `components/auth/ClerkWidgets.tsx`: drop `afterCreateOrganizationUrl`.
- `components/shell/SignInStory.tsx`: layout.

## Security

- The UI redirect is convenience only. `/admin` stays guarded by its layout, and the backend checks
  `SUPER_ADMIN` on every `/superadmin` call.
- Org creation is blocked in Clerk settings and only possible via the backend's `SUPER_ADMIN` endpoint.
- No change to tokens, env or secrets.

## Acceptance criteria

- Staff sign-in lands on `/admin`. Staff with an active org can open it from the sidebar bridge.
- An org user lands on their org. Their switcher lists only their orgs and has no "Create" entry
  (with the Clerk setting off).
- The sign-in panel shows no overlapping cards from 1024 px to 1920 px wide.

## Checks

`npx eslint app components`, `npx next build`.

## Manual test

1. Sign in as staff: you land on `/admin`.
2. In `/admin`, the sidebar bridge: hidden if you have no org; otherwise it opens `/dashboard/<id>`.
3. Sign in as an org admin: you land on `/dashboard/<id>`. The switcher shows only your orgs and no "Créer".
4. Open `/sign-in` at 1024, 1280, 1440, 1920 px: no card overlaps another.
