# Phase 3 — Live API everywhere + full glass redesign

## Goal

1. Wire **every** dashboard screen to the real backend described in `docs/API-FRONT.md` (live OpenAPI
   export, commit `54026bb`). It replaces the YAML as the field reference.
2. Remove or move screens the live API cannot back. Nothing is invented on the frontend.
3. Redesign both dashboards from scratch in an Apple-like **glassmorphism** style inspired by
   `design/glass.jpg`, with TailAdmin-grade UX: a collapsible sidebar, smooth motion, and shadcn/ui
   primitives. The old screenshots are used **only** for brand colours.
4. Switch the app from dev personas to real **Clerk** auth (keys are now in `.env.local`).

## Docs read

- `AGENTS.md` (all sections).
- `docs/API-FRONT.md`, sections 2 (Admin), 3 (SuperAdmin), 4 (`/me`) and the `ApiError` annex, in full.
- `docs/tontouma-bot-c4-MVP.md` and `docs/tontouma-bot-modele-donnees-FINAL.md` for the "why".
- `design/glass.jpg` (visual direction) and `design/Dashboard Tontouma Bot.png` (brand colours only).
- Before coding: `node_modules/next/dist/docs/` guides for layouts, server/client components,
  server actions, forms, proxy, and view transitions; the Clerk Next.js skill for `auth()`,
  `getToken()`, and organization switching.

## Code inspected

- `lib/data/repository.ts`: one `Repository` interface with two implementations,
  `lib/data/backend.ts` (only procedures are wired, everything else throws "contract pending") and
  `lib/data/mock/*` (in-memory, YAML-shaped).
- `lib/api/request.ts`, `lib/api/server.ts`: fresh Clerk token per request, Zod parsing. It reads
  `{code, message}` from errors, but the live `ApiError` is `{status, error, message, violations[]}`.
- `lib/auth/*` and `proxy.ts`: `/admin` is gated on the claim `platform_role === "admin"`.
- `components/shell/*`, `components/ui/*`, `app/globals.css`: the current green, Inter/Space Grotesk
  design with custom Dialog/Toast and GSAP motion.
- `.env.local`: `AUTH_MODE=dev` is still set, so Clerk is off. `API_BASE_URL` has a leading space
  (` http://192.168.6.129:8080`), and that host isn't reachable from this machine.

## What the live API changes (the key facts)

| Area | Live API | Consequence in the UI |
|---|---|---|
| Platform role | `public_metadata.role = SUPER_ADMIN` | `/admin` gate reads a `platform_role` claim mapped to `{{user.public_metadata.role}}` and compares it to `SUPER_ADMIN` |
| Org role | One backend role `ADMIN_ORGANISATION` | UI still hides kiosk-status and subscription from `org:admin` (AGENTS §7). The backend decides |
| Departments | Full CRUD + `active` | Managed on the services page. A service **requires** a `departmentId` |
| Services | CRUD + `active`, `location`, `phone`, structured `openingHours[]` | `active` = Publié / Brouillon. No email, no order, no `description_orientation` fields, so none shown and no reorder |
| Procedures | Already wired | Unchanged fields. `conditions` is one text field, edited as an ordered list (one per line) |
| Knowledge documents | Org-level only. Multipart upload **through the backend** or pasted text. `active` flag. Indexing is **synchronous** (a failure returns 502 in the same response) | No presigned URL and no indexing-status polling. The status shown is Actif / Inactif. A 502 shows "Indexation échouée" with **Réessayer**. `sourceProcedureId` links back to the procedure |
| Kiosks | Org: list, detail, status (`ACTIVE`, `MAINTENANCE`, `HORS_SERVICE`). Create, edit, delete are **SuperAdmin only** | Org screen: list + status. Kiosk creation moves to `/admin`. Field is `identifier` (no `codeUnique` reveal) |
| Statistics | `GET /admin/statistics` returns counts | Overview KPI tiles (counts only, no analytics charts) |
| Subscription | `startDate`, `status` (`ACTIVE`, `REMPLACEE`, `ANNULEE`), `plan` with limits | Read-only card. No end date, renewal, or invoices |
| Organizations (admin) | List, create (with `planId`, `adminEmail`), edit, change plan, status `active`, members, invite/remove admin | Full `/admin/organisations` + detail. Suspend/reactivate is confirmed **without a reason** (no field for it) |
| Plans (admin) | CRUD + `active`. `amount` in XOF, `billingPeriod`, `maxAdmins`, `maxBornes`, `maxAiDocuments`, `features[]` | Full CRUD |
| Kiosks (admin) | Global CRUD + status, filter by organization | New `/admin/bornes` screen + a tab on the organization detail |
| Forms | Full builder API exists | Built **only if you say yes** (Nice to Have, see question) |

### Screens removed because no endpoint exists (listed under "Needs your attention")

- Building maps and positions (`/dashboard/.../plans`).
- QR codes. No endpoint and no URL to encode.
- Access requests (`/admin/demandes`).
- Invoices, subscription history, end/renewal dates.
- Org-side members (invite, role, remove) and org-side settings edit. These exist only for Tontouma
  staff in `/admin`. The org sidebar won't show them.

The mock and pages for these are deleted, not hidden, so no dead code ships.

## Decisions and assumptions

### Data

1. **One typed contract.** `lib/api/contract.ts` holds Zod schemas and TS types copied field-for-field
   from `API-FRONT.md` (`ProcedureResponse`, `ServiceDeskResponse`, `DepartmentResponse`,
   `DocumentResponse`, `BorneResponse`, `AdminStatisticsResponse`, `AdminSubscriptionResponse`,
   `OrganizationResponse`, `PlanResponse`, `MemberResponse`, `MeResponse`, `FormBuilderResponse`,
   `ApiError`). Nullable fields are tolerated, and no field is renamed.
2. **The Repository interface is rewritten** on those DTOs. `backend.ts` implements **every** method
   (no more "pending"). The mock is rewritten to the same DTOs and rules, and is used only when
   `API_BASE_URL` is empty (dev). It returns 409 for plan limits, 403 when the org is inactive, and
   404 for unknown ids.
3. **Error parsing.** `request.ts` reads `{status, error, message, violations[]}`. Field violations
   are mapped back onto form fields. 401, 403, 404, 409, and 502 each get an explicit UI message.
4. **Read-only mode.** The dashboard switches to read-only with a banner when
   `subscription.status !== "ACTIVE"`, or when `/admin/subscription` returns 403 (organization
   suspended). One check in the layout, not per form.
5. **Document upload.** The browser posts `multipart/form-data` **directly to the backend**
   (`NEXT_PUBLIC_API_BASE_URL`) with a fresh `useAuth().getToken()`, so bytes never touch Next.js.
   This needs CORS on the backend for the dashboard origin (see question 3 for the alternative).
   Limits are shown before upload: PDF only, 10 MB. Title is required, source and category are optional.
6. `API_BASE_URL` is trimmed when read (the leading space in `.env.local`).

### Auth

7. `.env.local`: `AUTH_MODE` is cleared so **Clerk is active**. Dev personas stay available by
   setting `AUTH_MODE=dev` (dev only, the build still refuses it).
8. The platform admin check becomes `sessionClaims.platform_role === "SUPER_ADMIN"`. You add the
   claim in Clerk → Sessions → Customize session token: `{"platform_role": "{{user.public_metadata.role}}"}`.
   `.env.example` comments are updated.
9. The URL org id is still reconciled with Clerk's active organization (redirect if different).
   Org name and logo come from Clerk's `OrganizationSwitcher` / `useOrganization`.

### Design system (new)

10. **Look** (inspired by `glass.jpg`, not copied):
    - The background is a soft layered gradient, mint → pale slate (`#eef4f1 → #dde8e7 → #cbd9dd`),
      with a faint Tontouma-green radial tint and a subtle grain. Dark mode is deep slate-teal
      (`#0a1316`) with low teal glows.
    - **Glass** (sidebar, top bar, dialogs, popovers, toasts, floating action dock) is white at
      ~55 %, `backdrop-blur(24px) saturate(160%)`, a 1 px inner highlight, and a large soft shadow,
      with 24–28 px radii.
    - **Solid surfaces** (tables, forms, procedure editor) are white at ~94 % with no blur, so text
      stays AA.
    - **Ink** is deep navy `#15232e` for text and primary pill buttons (like "Provide feedback").
      **Brand green** `#009b49` is used for published/active states, focus rings, and highlights.
      Amber is for draft/maintenance, red for errors/out of service.
    - **Type** is **Urbanist** (Google Fonts, the geometric thin face in the reference): light 300
      for large numbers, 500–600 for labels, tabular numerals.
    - Controls use pill buttons, round glass icon buttons, pill filter chips, and segmented controls.
11. **Collapsible sidebar** (TailAdmin-style):
    - Expanded is 272 px (icons + labels + section titles + badges). Collapsed is an 84 px icon rail
      with tooltips.
    - It toggles with a button and with Ctrl/⌘+B. The state is saved in a cookie so the server
      renders the right width with no flash.
    - Under 1024 px it's collapsed by default. Under 768 px it becomes a glass drawer (Sheet).
    - The bottom of the sidebar has a user card, org switcher, theme toggle, and sign-out.
12. **Top bar**: a floating glass bar with page title + breadcrumb, ⌘K command palette (search
    pages, services, procedures), theme toggle, and the Clerk user button.
13. **shadcn/ui** (approved in your message) is initialised for Tailwind v4 and themed with the
    tokens above. Components used: button, input, textarea, label, select, checkbox, switch, tabs,
    dialog, alert-dialog, sheet, dropdown-menu, popover, tooltip, command, table, badge, skeleton,
    separator, scroll-area, avatar, sonner (toasts). These replace the custom
    `Dialog`/`ConfirmDialog`/`Toast`.
14. **Motion**, with the new dependency **`motion`** (Framer Motion):
    - A spring-animated active pill in the sidebar (shared `layoutId`) and a smooth width change on
      collapse.
    - Staggered fade-up of cards on page enter, count-up KPI numbers, hover lift and press-scale on
      cards and buttons.
    - Spring-scaled dialogs and sheets, animated reorder for conditions and required documents
      (`Reorder`), and animated status pills.
    - Everything is disabled under `prefers-reduced-motion`. Under `prefers-reduced-transparency`,
      glass becomes solid.
    - **GSAP and `@gsap/react` are removed** (drag reorder moves to `motion`).
15. **Icons**: `lucide-react` (already installed), 1.75 stroke, inside rounded glass chips on KPI tiles.
16. **States** on every screen: skeletons that match the layout, an illustrated empty state with the
    next action, an error state that says whether retry is safe, forbidden (role / suspended /
    subscription), not found.
17. **Responsive**: tables become cards under 768 px, and editors become a single column with a
    sticky glass Save/Publish bar.

## Routes after this phase

```
/dashboard/[orgId]                      Vue d'ensemble (statistics KPIs, drafts to publish, subscription card)
  services                              departments (CRUD, active) + services grouped by department
  services/[serviceId]                  service form (location, phone, opening hours) + its procedures
  services/[serviceId]/demarches/nouvelle
  services/[serviceId]/demarches/[procedureId]   editor: fields, conditions, required docs, Save / Publish
                                        (+ "Formulaire" tab only if you approve the form builder)
  documents                             knowledge base: search, category filter, upload PDF, paste text,
                                        edit, activate/deactivate, delete, retry on 502
  bornes                                list + status change                          (org:super_admin)
  abonnement                            plan, status, start date, limits vs usage     (org:super_admin)
/admin                                  overview (org counts, plans, kiosks by status)
  organisations                         table: search, status filter, create organization
  organisations/[id]                    info edit + opening hours, change plan, suspend/reactivate,
                                        members + invite/remove admin, kiosks of this org
  bornes                                all kiosks, filter by org, create/edit/delete/status
  plans                                 plans CRUD + active toggle, XOF
```

Deleted: `dashboard/[orgId]/plans*`, `membres`, `parametres`, `admin/demandes`,
`app/api/dev-upload`, and the matching components and mock code.

## Files expected (main)

- `lib/api/contract.ts` (new), `lib/api/request.ts`, `lib/api/errors.ts`, `lib/api/client.ts` (browser upload).
- `lib/data/repository.ts`, `lib/data/backend.ts`, `lib/data/mock/*` (rewritten), `lib/actions/*`.
- `lib/auth/roles.ts`, `lib/auth/session.ts`, `proxy.ts`, `.env.local` (`AUTH_MODE` cleared), `.env.example`.
- `app/globals.css` (new tokens), `app/layout.tsx` (Urbanist, Clerk appearance, Toaster).
- `components/ui/*` (shadcn, restyled), `components/shell/*` (new sidebar/topbar/palette),
  `components/features/*` (rewritten per screen), `components/states/*`.
- `app/(org)/...` and `app/(admin)/...` pages per the route list.
- `package.json`: + shadcn deps (`radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`,
  `cmdk`, `sonner`, `tw-animate-css`), + `motion`, + `@fontsource`-free Urbanist via `next/font`,
  − `gsap`, − `@gsap/react`, − `qrcode`, − `@types/qrcode`.

## Security

- Tenant isolation is the backend's job (the org comes from the token). No org id is sent in admin
  bodies. The URL org id is navigation only and is reconciled with Clerk.
- `/dashboard` and `/admin` are protected in `proxy.ts`. `/admin` needs `platform_role=SUPER_ADMIN`.
  Role checks in the UI only hide things.
- Fresh token per call (`auth().getToken()` server, `useAuth().getToken()` client for uploads).
  Nothing is stored.
- Only `NEXT_PUBLIC_*` reach the browser. `API_BASE_URL` and `CLERK_SECRET_KEY` stay server-only.
- The sidebar-collapsed cookie holds only a boolean UI preference.
- Sentry isn't configured in this phase (unchanged, phase 8).

## Acceptance criteria

- No screen or call uses an endpoint or field absent from `API-FRONT.md`.
- With `API_BASE_URL` set and the backend up, every listed screen reads and writes live data.
  With it empty, the mock gives the same behaviour.
- Publish/unpublish (services, procedures) and activate/deactivate (documents, plans, organizations)
  are separate, confirmed actions. The success toast says "L'assistant utilisera ce contenu d'ici
  quelques minutes."
- The sidebar collapses/expands smoothly, remembers its state across reloads without a flash, and
  becomes a drawer on mobile.
- Glass is on the chrome and floating elements only. Tables and forms are solid and AA. Light and
  dark themes both work. Reduced motion and reduced transparency are respected.
- Money is `Intl.NumberFormat('fr-FR', {style:'currency', currency:'XOF', maximumFractionDigits:0})`.
  Dates are fr-FR, Africa/Dakar. All copy is French.
- `tsc`, `lint`, and `next build` pass.

## Checks to run

`npx tsc --noEmit` · `npm run lint` · `npm run build` · `npm run dev`, then load every route (HTTP 200
or the expected redirect).

## Manual test steps

1. In Clerk: create orgs A and B, roles `org:super_admin` and `org:admin`, add the session claim
   from decision 8, and set `public_metadata.role = "SUPER_ADMIN"` on your own user.
2. `npm run dev`, sign in as org A super_admin → `/dashboard` redirects to `/dashboard/<orgA>`.
   The KPIs load.
3. Collapse the sidebar (button and Ctrl+B), reload: it stays collapsed. Narrow the window under 768 px:
   you get the drawer.
4. Services: create a department, then a service in it with opening hours. Save (Brouillon), then
   Publish and confirm. You see the toast. Then Unpublish.
5. Open the service → New procedure: fill in cost 5000, 3 conditions, 2 required documents, and
   reorder them. Save, reload, and check the order kept. Publish, then Unpublish.
6. Leave the procedure with unsaved changes: you get the warning.
7. Documents: upload a PDF over 10 MB (refused before sending). Upload a valid PDF (shows Actif).
   Paste a text document. Deactivate, reactivate, delete. With the AI service down, the 502 shows
   "Indexation échouée" + Réessayer.
8. Bornes: change a kiosk's status. Sign in as `org:admin`: Bornes and Abonnement are gone from the
   sidebar, and their URLs show the forbidden state.
9. Open `/dashboard/<orgB>` while active in A: you're redirected to A, and no B data is shown.
10. As an org member without the platform claim, open `/admin`: denied.
11. As a platform admin: `/admin/plans` create a plan (15 000 FCFA / MOIS, limits, 3 features), edit,
    deactivate. `/admin/organisations` create an org with that plan and an admin email. On the
    detail page: edit info, change plan, invite an admin, remove one, suspend (confirm), reactivate.
    Create a kiosk for it, change status, delete.
12. Reach a plan limit (e.g. `maxBornes`): create shows the 409 message.
13. Stop the backend: every list screen shows the error state with "Réessayer". With an
    empty org you get the empty states.
14. Switch to dark mode and toggle OS "reduce motion" / "reduce transparency": no animation, solid
    surfaces.
