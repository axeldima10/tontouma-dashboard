# Phase 1 — Foundation: design system, motion, shells, auth, API client

## Goal

Lay the foundation both dashboards stand on, at a finish level that already feels premium:
a light/dark design system derived from the Tontouma brand, a GSAP motion system with a few
signature moments, the glass app shells for `/dashboard` and `/admin`, Clerk authentication with
role and tenant guards, the typed API client, the shared state components (loading, empty,
error, forbidden, not found, read-only), and the two overview pages.

The whole scope (section 1 of AGENTS.md) ships in phases. Each later phase gets its own prompt file.

| Phase | Content |
|---|---|
| **1 (this file)** | Design system, motion, shells, auth/guards, API client, state components, overview pages |
| 2 | Services & procedures editor (conditions, required documents, reorder, save / publish / unpublish) |
| 3 | Reference documents (presigned upload, indexing status polling, retry) |
| 4 | Building map editor (SVG, percentage coordinates, legend, drag) |
| 5 | Kiosks & QR codes (codeUnique reveal, PNG/SVG export, plan limits) |
| 6 | Members, subscription & invoices (read-only), organization settings |
| 7 | Platform admin: organizations, access requests, plans CRUD |
| 8 | Sentry with PII scrubbing, final accessibility and performance pass |

## Docs read

- `AGENTS.md` (full).
- **Missing:** `docs/tontouma-bot-c4-MVP.md`, `docs/tontouma-bot-modele-donnees-FINAL.md`,
  `docs/tontouma-bot-api-contract-complete.yaml`, `docs/tontouma-bot-priority-us-contract.yaml`.
  The `docs/` folder does not exist in this repo or in the sibling folders.
- Next.js 16 docs: `01-getting-started/16-proxy.md`. `middleware.ts` is now `proxy.ts` in Next 16.
- Skills: `gsap-core`, `gsap-react`, `gsap-timeline`, `gsap-performance`, `gsap-plugins` (Flip,
  Draggable), `gsap-utils` (from `../TontoumaV1/.claude/skills`), `clerk-orgs`,
  `clerk-nextjs-patterns` (middleware strategies), `vercel-react-best-practices`,
  `vercel-composition-patterns`, `vercel-react-view-transitions`, `web-design-guidelines`.

## Code inspected

- This repo is a fresh `create-next-app`: Next 16.3.6, React 19.2.8, Tailwind v4, `gsap` 3.15 and
  `@gsap/react` installed. There's no Clerk, Zod, Sentry, icon set, `lib/`, or `.env.example` yet.
- `../Tontouma/src/css/globals.css` is the citizen app and holds the **brand tokens** used in
  `design/Frame 85.png` (dark) and `design/Group 76.png` (light):
  - Light: `--bg #f4f8f6`, `--panel #ffffff`, `--text #18241d`, `--muted #84918a`,
    `--line #dce5df`, `--green #009b49`, `--green-dark #007d3a`, `--soft-green #e3f3eb`.
  - Dark: `--bg #07110d`, `--panel #101a16`, `--text #eef5f1`, `--muted #84958c`,
    `--line #24332c`, `--soft-green #092c1c`.
  - Glass recipe: green-tinted translucent fill, `backdrop-filter: blur(18px) saturate(125%)`,
    1px green-mixed border, inner top-left highlight, soft drop shadow.
- `../Tontouma/src/assets/images/tontuma-bot.png` is the bot mark logo. It gets copied into `public/brand/`.
- `design/Dashboard Tontouma Bot.png` (admin) and `design/Org Admin.png` (org) show layout
  inspiration: left sidebar, greeting header, KPI tiles, cards, status pills.

## Decisions and assumptions

1. **Design tokens.** Brand tokens above become CSS variables on `:root` / `.dark`, exposed to
   Tailwind v4 through `@theme inline`. I'm adding a few derived tokens: `--surface-2`, `--ring`,
   `--danger #d93a3a`, `--warning #e0a100`, `--info`, and the `--glass-*` set. **No per-organization
   re-theming.**
2. **Typography.** I'm reading the screenshots as **Space Grotesk**, used for display text,
   headings, and KPI numerals with tabular figures. **Inter** handles body and table text so dense
   data stays readable. Both load through `next/font/google`.
3. **Theme.** There are three modes: Clair, Sombre, and Système. The choice is stored in a
   `theme` cookie (a preference, not tenant data) so the server renders the right class with no
   flash. A small inline script covers the "Système" mode before hydration. A GSAP circular reveal
   from the toggle button animates the switch, with a plain crossfade under reduced motion.
4. **Glass vs solid.** Glass goes on the sidebar, topbar, modals, popovers, toasts, command
   palette, and mobile drawer. Solid surfaces go on cards holding tables, forms, and data. A slow
   ambient green aurora gradient sits behind the chrome so the glass has something to refract, and
   it's static under reduced motion. With `prefers-reduced-transparency`, glass falls back to a
   solid `--panel`. I'll check AA contrast for every text-on-glass pair in both themes.
5. **Motion system** (`lib/motion/`), per the gsap-react and gsap-performance skills:
   - One client module registers `useGSAP`, `Flip`, `SplitText`, and `Draggable`. All GSAP
     plugins are free as of 3.13.
   - Shared eases and durations: `ease-out-expo` for entrances, `power3.inOut` for layout, and
     springy `back.out(1.4)` only on small confirmations.
   - Every animation goes through `gsap.matchMedia()` with a `reduceMotion` condition, which drops
     to opacity-only or instant.
   - Only transforms and opacity are animated. Scope is always a ref. `contextSafe` wraps event
     handlers.
   - **Building blocks:** `<Reveal>` (staggered rise-in of children on mount), `<CountUp>` (KPI
     numbers ticking with `fr-FR` formatting), `useMagnetic` (a subtle pull on primary buttons,
     pointer-fine devices only), a sidebar active indicator that glides between items with Flip,
     `<Presence>` for modal/drawer/toast enter and exit, and a skeleton shimmer.
   - **Signature moments:**
     - The greeting header reveals word by word with SplitText, and the bot mark "blinks" once on
       first load.
     - KPI tiles cascade in with count-up.
     - Page changes use a short fade-and-rise, with directional slide reserved for list→detail
       from Phase 2.
     - A theme switch plays the circular reveal.
6. **Route structure.**
   - `app/(org)/dashboard/page.tsx` redirects to `/dashboard/[orgSlug]`.
   - `app/(org)/dashboard/[orgSlug]/layout.tsx` compares `orgSlug` to `auth().orgSlug`. On
     mismatch it redirects to the active org, so the URL is navigation only. With no active org it
     shows an org chooser (Clerk `<OrganizationList>`).
   - `app/(admin)/admin/...` holds the Platform Admin.
   - `/sign-in/[[...sign-in]]` is a branded Clerk `<SignIn>` with French localization.
7. **Auth guards** (`proxy.ts`, protected-first on `/dashboard(.*)` and `/admin(.*)`):
   - `/admin` requires `sessionClaims.platform_role === "admin"` and rewrites to a forbidden page
     otherwise.
   - Pages restricted to `org:super_admin` render the Forbidden state server-side (`has({ role })`)
     for `org:admin`.
   - Role keys live in `lib/auth/roles.ts`. **The UI only hides; the backend decides.**
8. **Navigation.**
   - **Organization:** Vue d'ensemble, Services & démarches, Documents, Plans du bâtiment. For
     super_admin only: Bornes & QR codes, Membres, Abonnement, Paramètres.
   - **Admin:** Tableau de bord, Organisations, Demandes d'accès, Plans d'abonnement.
   - **Dropped from the screenshots because AGENTS.md puts them out of scope:** Statistiques,
     Conversations, the conversation chart, the "Activité récente" feed, and admin Utilisateurs
     (users live in Clerk). Formulaires is Nice to Have and stays off until asked.
   - In Phase 1, nav targets for later phases render a polished "Bientôt disponible" empty
     state. Role gating and Forbidden already work on them, so the manual role tests pass.
9. **Command palette (⌘K / Ctrl K).** Navigation-only palette in glass, keyboard-first, filtered
   by role. It doesn't search data until the contract exists. *Strike this line to drop it.*
10. **API client** (`lib/api/`):
    - `server.ts` has `apiFetch(path, init, schema)`. It gets a fresh token with
      `auth().getToken()` on every call, prefixes `API_BASE_URL`, and parses with Zod.
    - `client.ts` has `useApi()`. It calls `getToken()` right before each request.
    - `errors.ts` defines a typed `ApiError` with `kind: unauthorized | forbidden | notFound |
      conflict | network | server`.
    - No token is ever stored.
    - **No endpoint paths or entity schemas are written in Phase 1.** They come from the contract.
11. **Overview data.** This depends on your answer about the missing contract. Both options keep
    the UI identical:
    - **(A)** Build the overview pages with their full loading / empty / error states, bound
      through the API client to a dev-only fixture adapter in `lib/api/fixtures/`, enabled only
      when `API_BASE_URL` is unset. It's isolated in one folder and deleted when the contract lands.
      Only field names listed in AGENTS.md section 8 are used, and the rest is flagged `// TODO(contract)`.
    - **(B)** Wait for the contract files before building data-bound screens. Phase 1 then ships
      the shells and states with the overview pages in their loading/empty state.
12. **New dependencies (approval requested here):**
    - `@clerk/nextjs` and `@clerk/localizations` (frFR).
    - `zod`.
    - `lucide-react` for icons. The screenshots use Lucide-style strokes, and it's an icon set,
      not a UI kit.
    - `@sentry/nextjs` is deferred to Phase 8.
    - No component library, state manager, or form library.

## Files expected

```
.env.example
proxy.ts
next.config.ts                         (image domains only if needed)
app/layout.tsx                         (fonts, ClerkProvider frFR, theme class, metadata)
app/globals.css                        (tokens, @theme, glass, aurora, reduced-* fallbacks)
app/page.tsx                           (redirect to /dashboard; marketing is out of scope)
app/sign-in/[[...sign-in]]/page.tsx
app/forbidden-ui/…                     (shared Forbidden page used by proxy rewrite)
app/(org)/dashboard/page.tsx
app/(org)/dashboard/[orgSlug]/layout.tsx
app/(org)/dashboard/[orgSlug]/page.tsx                  (Vue d'ensemble)
app/(org)/dashboard/[orgSlug]/{services,documents,plans,bornes,membres,abonnement,parametres}/page.tsx
app/(org)/dashboard/[orgSlug]/{loading,error,not-found}.tsx
app/(admin)/admin/layout.tsx
app/(admin)/admin/page.tsx                              (Tableau de bord)
app/(admin)/admin/{organisations,demandes,plans}/page.tsx
app/(admin)/admin/{loading,error,not-found}.tsx
components/shell/{AppShell,Sidebar,SidebarNav,Topbar,MobileDrawer,CommandPalette,ThemeToggle,Aurora,BotMark}.tsx
components/ui/{Button,Card,Badge,StatusPill,KpiTile,Skeleton,Dialog,ConfirmDialog,Toast,Tooltip}.tsx
components/states/{EmptyState,ErrorState,ForbiddenState,NotFoundState,ReadOnlyBanner,ComingSoon}.tsx
components/overview/{OrgIdentityCard,OrgKpis,AdminKpis,…}.tsx
lib/motion/{gsap.ts,presets.ts,Reveal.tsx,CountUp.tsx,Presence.tsx,useMagnetic.ts}
lib/auth/{roles.ts,guards.ts}
lib/api/{server.ts,client.ts,errors.ts}   (+ fixtures/ only if option A)
lib/format.ts                          (XOF no decimals, fr-FR dates, Africa/Dakar, relative time)
lib/theme.ts
public/brand/tontouma-bot.png
```

## Requirements

- All copy is in French. Money uses `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF',
  maximumFractionDigits: 0 })`. Dates use `fr-FR` in `Africa/Dakar`.
- Desktop fidelity follows the screenshots' structure: sidebar width, greeting header, KPI row,
  card radii (~16px), and pill badges. Tablet collapses the sidebar to icons. Mobile gets a glass
  drawer and stacked cards.
- Keyboard: visible focus rings (green `--ring`), skip-link, a focus trap in dialogs and the
  drawer, and Esc closes them.
- Every screen has loading (skeleton matching the final layout), empty (with the next action),
  error (says whether retry is safe), forbidden (names the role or subscription reason), and not
  found states.
- A `ReadOnlyBanner` component and a read-only context exist, ready for the subscription/suspension
  status. The status source is wired when the contract exists.
- GSAP never runs during SSR. There are no layout-property animations, and everything is reverted
  on unmount.
- Lighthouse accessibility ≥ 95 on both overview pages in light and dark.

## Security considerations

- The only public env values are `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (and optionally
  `NEXT_PUBLIC_API_BASE_URL`). `CLERK_SECRET_KEY` and `API_BASE_URL` are read only in server
  modules marked `import "server-only"`.
- Route protection lives in `proxy.ts` plus server layouts, never client-only.
- The URL `orgSlug` is never used as authorization. It's reconciled against `auth().orgSlug`.
- The admin claim is read from `sessionClaims`. **You** must add `platform_role` (from
  `public_metadata`) plus the org id/role to the Clerk session token (see Needs your attention).
- No token, org data, or tenant data goes in localStorage. Only the `theme` cookie is written.

## Acceptance criteria

1. Signed out, `/dashboard` and `/admin` redirect to the branded French sign-in.
2. A super_admin sees all org nav items. An admin doesn't see Bornes, Membres, Abonnement, or
   Paramètres, and gets the Forbidden state when typing those URLs.
3. `/dashboard/<other-slug>` redirects to the active org's slug.
4. A non-platform user on `/admin` gets the Forbidden state.
5. Light / dark / system theme switch works with no flash on reload, and glass text passes AA in both.
6. Entrance, count-up, sidebar indicator, drawer, dialog, and toast animations run smoothly. With
   OS "reduce motion" on they're instant or fade-only. With "reduce transparency" glass turns solid.
7. Layout holds at 1440, 1024, 768, and 375 px widths with no horizontal scroll.
8. `tsc`, `lint`, and `build` pass.

## Checks to run

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev`, then open `/sign-in`, `/dashboard`, and `/admin`.

## Manual test steps

1. Copy `.env.example` to `.env.local`, fill the Clerk keys, and run `npm run dev`.
2. Open `http://localhost:3000/dashboard` signed out. You should land on the French sign-in.
3. Sign in as **super_admin of org A**. Every nav item is visible, and the overview animates in with KPIs counting up.
4. Toggle theme Clair → Sombre → Système and reload. There should be no flash, and the glass stays readable.
5. Resize to 768px and then 375px. The sidebar collapses, then becomes a drawer. Open and close it with the button and Esc.
6. Press Ctrl K. The palette opens and lists only allowed pages. Arrow keys and Enter navigate.
7. Sign in as **admin of org A**. Bornes, Membres, Abonnement, and Paramètres are hidden. Opening `/dashboard/<slugA>/membres` shows Forbidden.
8. While active in org A, open `/dashboard/<slugB>`. You're redirected to `/dashboard/<slugA>`.
9. As an org member without `platform_role`, open `/admin`. You get Forbidden.
10. As a platform admin, open `/admin`. The Tontouma-branded shell and overview appear.
11. Turn on the OS reduce-motion and reduce-transparency settings and reload. Animations are minimal and glass is solid.
12. Stop the backend (or set a wrong `API_BASE_URL`). Overview cards show the error state with a safe retry.

## Needs your attention (before or during Phase 1)

- **The four contract docs are missing** (`docs/*.md`, `docs/*.yaml`). Every data screen from
  Phase 2 onward is blocked on them.
- The Clerk instance needs Organizations enabled, roles `org:super_admin` and `org:admin` created,
  and a session token customized with `platform_role`, the org id, and the org role.
- Screens in the screenshots that are out of scope and dropped: Statistiques, Conversations, the
  conversation chart, Activité récente, and admin Utilisateurs. Tell me if the scope changed.
