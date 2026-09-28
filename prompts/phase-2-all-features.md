# Phase 2 — All dashboard features, working end-to-end (plus speed fixes)

## Goal

Replace every "bientôt disponible" screen with the real feature so both dashboards can be used from
end to end today, without a backend and without Clerk. Every screen goes through one data layer. For
now that layer talks to an in-memory **mock backend** (dev only). When the real backend is reachable,
the same screens switch to it through one config value, one repository at a time.

This also fixes the slowness you noticed.

## Docs read

- `AGENTS.md`, sections 3, 5, 7, 8, 9, 11, 12.
- `docs/tontouma-bot-c4-MVP.md` for which service does what.
- `docs/tontouma-bot-modele-donnees-FINAL.md` for entities and relations.
- `docs/tontouma-bot-api-contract-complete.yaml`: the old design contract (French fields, org id in the path).
- The live backend export pasted in chat (`/api/v1/...`). It's incomplete: I have the chatbot,
  public, admin **procedures**, and admin **forms** sections in full. For departments, services,
  knowledge base, kiosks, subscription, and superadmin I only have the section titles.

## Source of truth, per area

| Area | Shape used | Why |
|---|---|---|
| Procedures | **Live export** (`/api/v1/admin/procedures`, `title`, `cost`, `processingDays`, `active`, `requiredDocuments[label, displayOrder]`, `conditions` text) | It's what the backend really implements |
| Publish / unpublish | **Live**: `PUT /admin/procedures/{id}/status {active}`. `active=false` means Brouillon, `active=true` means Publié | No brouillon/publie enum exists on the backend |
| Departments, services, documents, kiosks, QR codes, floor plans and positions, subscription, invoices, members/invitations, admin orgs, access requests, plans | **YAML** fields, flagged `TODO(contract)` | The live sections are truncated. When you paste them, only the mapper in each repository changes |

The docs folder is still useful. The C4 and the data model explain the "why" and the relations. The
YAML fills every gap in the live export. Once the full live export is in `docs/`, it replaces the
YAML as the field reference.

## Why it's slow (measured on the dev server log)

| Request | Total | Next.js compile | Our code |
|---|---|---|---|
| First `/dashboard/org_demo` | 24.6 s | 20.6 s | 2.4 s |
| Same page, second visit | 1.1 s | 0.1 s | 1.0 s |
| First visit of any other page | ~6 s | ~5.5 s | ~0.6 s |

1. **Dev-only compile on first visit** (most of the wait). `next dev` compiles each page the first
   time you open it. It's slow on Windows, especially with Defender scanning `node_modules`. It does
   **not** happen in production.
2. **Fake network delay I added** to the fixtures (650 ms + 120 ms per page) to show skeletons.
   That's too long.
3. **Heavy visual effects.** The three huge background glows use a CSS `blur` filter, they animate
   forever, and the frosted glass re-blurs them on every frame. Page changes also animate a blur. On
   an average laptop this makes scrolling and clicks feel sluggish.

**Fixes in this phase:**
- Fixture/mock delay goes down to ~120 ms.
- The glows become static soft gradients: no `filter: blur`, a slow drift only on capable devices,
  and animation paused when the tab is hidden.
- The page transition drops its blur.
- Clerk's client code is loaded only in Clerk mode (dynamic import), so dev pages ship less JS.
- Your side: add a Windows Defender exclusion for the project folder (I'll give exact steps). That
  usually cuts first-compile time by about half.

## Decisions and assumptions

1. **Data layer.**
   - There's one repository per area, for example `lib/data/procedures.ts`.
   - Each function calls the backend (`apiFetch`) when `API_BASE_URL` is set. Otherwise it calls
     `lib/data/mock/` (server-only, in-memory, seeded with a realistic Dakar-Plateau org, reset on
     server restart).
   - Screens never know which one they hit.
   - Writes go through Server Actions that only call the repository, which means they only proxy
     the backend. No business rules live in them.
2. **The mock mirrors backend rules** so the UI can be exercised:
   - It returns 409 at plan limits and 403 on writes when the org is suspended or expired.
   - It returns 404 for unknown ids.
   - Document indexing moves through en_attente → en_cours → indexe over about 15 s. A file with
     "erreur" in its name ends in erreur so the retry path can be tested.
   - The mock is dev-only: it throws if imported when `API_BASE_URL` is set in production.
3. **Uploads (documents, floor plans).**
   - The real flow stays: request upload URL → browser PUT → confirm.
   - In mock mode the "upload URL" is a dev route handler that stores the file in memory.
   - This is the only case where bytes pass through Next, and only in mock mode. It's flagged and
     removed with the mock.
   - Limits shown before upload: PDF only, 10 MB max for documents; PNG/JPG/SVG, 5 MB max for plans.
4. **Conditions** (the backend stores one text field). The editor shows an ordered list with
   add / reorder / delete, saved as one condition per line in `conditions`. Existing text is split on
   line breaks. This is display formatting only, and I'm flagging it so the backend team can confirm.
5. **Required documents.** The live contract only has `label` + `displayOrder`. The YAML's extra
   fields (copies, format, mandatory) aren't on the backend, so they're **not** shown. I won't
   invent fields.
6. **Reorder.** Services, procedures, conditions, and required documents reorder by drag (GSAP
   Draggable + Flip) **and** by up/down buttons for keyboard users. Order is saved through the API.
7. **Maps.**
   - Native `<svg>` over the uploaded image.
   - Points are stored as percentages (0–100).
   - Kiosk and service markers are visually distinct, with a legend.
   - Click to place, drag to move.
   - `description_orientation` is shown and editable next to the selected service point.
8. **Kiosks & QR codes.**
   - `codeUnique` is shown once in a reveal dialog with a copy button.
   - QR codes are rendered client-side from the backend URL and downloadable as PNG and SVG.
   - New dependency **`qrcode`** (tiny, no UI) needs your approval.
9. **Members.**
   - List, invite by email + role, change role, remove, pending invitations with revoke.
   - All through the backend-shaped repository, never Clerk from the browser.
   - Usage vs plan limit is shown, create is disabled at the limit, and a forced 409 is handled.
10. **Subscription.** Read-only: plan, status, dates, next renewal, limits with usage, invoices with a
    PDF link, FCFA with no decimals. No payment button.
11. **Settings.** Organization info form: name, type, description, address, phone, email, website,
    logo. Also organization-level documents.
12. **Platform admin.**
    - **Organizations:** table with search, status filter, and a detail drawer, plus
      suspend / reactivate with confirmation and a required reason.
    - **Access requests:** queue with filters, approve / reject (reason on reject).
    - **Plans:** CRUD, prices in XOF, limits, features list.
13. **Every screen gets:**
    - Skeleton loading, an empty state with the next action, and an error state that says whether
      retry is safe.
    - Forbidden with the reason, and not found.
    - The read-only banner, with every form disabled when the org is suspended or expired.
    - A warning before leaving with unsaved changes.
    - Confirm dialogs for publish / unpublish / delete. Deleting published content says citizens
      will stop seeing it.
    - After publish, a toast: "L'assistant utilisera ce contenu d'ici quelques minutes".
14. **Mobile.** Wide tables become cards below 768 px. The procedure editor becomes a single column
    with a sticky Save/Publish bar.
15. **Out of scope, not built:** statistics / conversations (listed in the backend, but AGENTS.md
    excludes analytics), the form builder (Nice to Have, which the backend does support; ask when
    you want it), and payment checkout.

## Routes

```
/dashboard/[orgId]
  services                          list grouped by department, departments managed inline
  services/[serviceId]              service info, orientation text, its procedures, its documents
  services/[serviceId]/demarches/nouvelle
  services/[serviceId]/demarches/[procedureId]   editor: fields, conditions, required docs, documents, Save, Publish
  documents                         all documents with filters (organization / service / procedure) and indexing status
  plans                             floor plans list + upload
  plans/[planId]                    map editor
  bornes                            kiosks + QR codes (super_admin)
  membres                           members + invitations (super_admin)
  abonnement                        subscription + invoices (super_admin)
  parametres                        organization info + org-level documents (super_admin)
/admin
  organisations  organisations/[id]  demandes  plans
```

## Files expected (main ones)

- `lib/data/*.ts`: repositories for procedures, services, departments, documents, plans, kiosks,
  qrcodes, members, subscription, organization, admin-organisations, access-requests, subscription-plans.
- `lib/data/mock/*`: seed + store + rules.
- `lib/data/schemas/*`: Zod schemas at the API boundary. Procedures come from the live export,
  everything else from the YAML with `TODO(contract)`.
- `app/**/actions.ts`: Server Actions.
- `app/api/dev-upload/[key]/route.ts`: mock upload target, dev only.
- `components/forms/*`: Field, TextArea, Select, NumberInput, Switch, FileDrop, SortableList,
  UnsavedChangesGuard, SaveBar.
- `components/data/*`: DataTable (table → cards), SearchInput, FilterChips, Pagination.
- `components/features/{services,procedures,documents,maps,kiosks,members,subscription,settings,admin}/*`.
- Every page file under the routes above, plus `loading.tsx` where needed.
- `components/shell/Aurora.tsx`, `lib/motion/PageTransition.tsx`, `lib/api/fixtures/index.ts` (speed fixes).
- `components/auth/SessionProvider.tsx` (lazy Clerk).
- `components/overview/*`: rewired to the repositories.
- `package.json` (`qrcode`, `@types/qrcode`).

## Security considerations

- The mock store and the dev upload route refuse to run when `NODE_ENV === "production"`.
- Server Actions re-check the session and role before calling the repository (UI hiding only). The
  real backend stays the authority.
- The org id always comes from the session, never from the URL or form data.
- No secrets in client files. Sentry is still Phase 8.

## Acceptance criteria

1. No "bientôt disponible" is left anywhere in both dashboards.
2. As super admin you can:
   - Create a department and a service.
   - Create a procedure with conditions and required documents, save it as Brouillon, publish it
     (confirm + toast), and unpublish it.
   - Reorder items, then reload: the order persists until the server restarts.
3. You can upload a PDF on a procedure and watch en_attente → en_cours → indexe. A file named
   `test-erreur.pdf` ends in erreur, and Retry works.
4. You can upload a floor plan, place a kiosk and two services, drag one, and reload at another
   window width: the points stay in the same place.
5. You can create a kiosk. The code is shown once with copy, and the QR downloads as PNG and SVG. At
   the plan limit, create is disabled, and a forced create shows the 409 message.
6. Members: invite, revoke, change role, remove. The limit behaves like kiosks.
7. Subscription shows plan, dates, limits, and invoices in FCFA with no decimals.
8. With `FIXTURE_SCENARIO=expired` the whole dashboard is read-only with the banner. There are no
   raw 403s.
9. Admin:
   - Search and filter organizations, and suspend with a reason (the suspended org's dashboard turns
     read-only).
   - Approve or reject a request.
   - Create, edit, and delete a plan.
10. The admin persona is Forbidden on every super-admin-only page and doesn't see those links.
11. Second visits to any page answer in under 300 ms in dev, and scrolling is smooth with the
    background visible.
12. `tsc`, `lint`, and `build` (without `AUTH_MODE`) pass.

## Checks

`npx tsc --noEmit`, `npm run lint`, `npm run build` (without `AUTH_MODE`), `npm run dev` from
PowerShell, curl of every route for every persona, and the manual steps below.

## Manual test steps

1. Run `npm run dev` from PowerShell with `AUTH_MODE=dev` and `API_BASE_URL` empty.
2. As Aïssatou, go to Services & démarches and create the department "État civil".
3. Create the service "Bureau d'état civil" with location and orientation text.
4. Create the procedure "Extrait de naissance": cost 200, delay 2 days, three conditions, two
   required documents. Save. You should see a Brouillon badge.
5. Publish and confirm. A Publié badge and a toast appear. Unpublish and confirm.
6. Try to leave with unsaved edits. You get the warning.
7. In Documents, upload a PDF and watch the status move. Upload `test-erreur.pdf` and press Retry.
8. In Plans du bâtiment, upload an image, place a kiosk and a service, drag one, reload, then resize
   the window.
9. In Bornes & QR codes, create a kiosk, copy the code, and download the PNG and SVG. Create until
   the limit is reached.
10. In Membres, invite, revoke, change a role, and remove.
11. In Abonnement, check the dates, limits, and invoices.
12. Switch to Moussa (admin). The management pages are hidden and their URLs are Forbidden.
13. Switch to Équipe Tontouma, then:
    - Suspend the demo org with a reason.
    - Switch back to Aïssatou: everything is read-only with the banner.
    - Reactivate it.
14. Restart with `FIXTURE_SCENARIO=empty`, then `error`, and check the states on every list.
