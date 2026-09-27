# Phase 4 — Fast when offline, and every endpoint of API-FRONT.md

## Goal

1. **Fix "nothing happens when I click"** when the backend can't be reached.
2. Make it easy to **work at home without the backend**, while showing clearly when the data is fake.
3. Use **every endpoint** in `docs/API-FRONT.md` that the dashboards don't call yet. After this phase, connecting the backend is only a config change.

## Diagnosis (measured)

- With `API_BASE_URL=http://192.168.6.129:8080` and no network route to it, each call fails only after
  **10.7 s** (`UND_ERR_CONNECT_TIMEOUT`).
- The org layout waits for the subscription check before drawing anything, then the page makes its
  own calls. Every click takes 20 s or more, so the screen looks frozen: nothing is clickable yet,
  including the sidebar collapse button.
- The features exist; tested on the mock backend, the collapse persists and publish, 409 and 502 all work.

## Docs read

- `AGENTS.md`, `docs/API-FRONT.md` in full, including section 1 (Public) and section 4 (`/me`), which phase 3 didn't use.
- Next docs: `02-guides/streaming.md`, `01-getting-started/06-fetching-data.md`, `route-handlers`.

## Code inspected

`lib/api/request.ts` (no timeout), `lib/data/load.ts` (`getAccessState` awaited by the layout),
`lib/data/repository.ts` (`repo()` switches only on `API_BASE_URL`), and every phase 3 feature.

## Decisions

### A. Speed and offline work

1. **Request timeout**: 8 s for normal calls, 3 s for the layout's access check. A timeout becomes
   the existing "Serveur injoignable" state with Réessayer.
2. **Short circuit breaker (server)**: after a network failure, calls fail at once for 15 s instead
   of each waiting 8 s. After that, the next call tries the backend again. It's in memory, with no
   business rule.
3. **Explicit data source**: new server variable `DATA_SOURCE=api|mock`.
   - Default: `api` when `API_BASE_URL` is set, `mock` otherwise.
   - At home you set `DATA_SOURCE=mock` and keep your backend URL in the file.
   - `mock` is refused in production.
4. **Visible "Données de démonstration" pill** in the top bar whenever the mock is active, so fake
   data is never mistaken for real data.
5. The layout **stops blocking**: if the access check times out, the shell renders at once. The
   backend still refuses forbidden writes.

### B. New features (one per unused endpoint group)

| Endpoints | Where | What |
|---|---|---|
| `GET/POST/PUT/DELETE /admin/procedures/{id}/form`, `PUT …/form/status` | Procedure editor → new **Formulaire** tab | Form builder (see below) |
| `GET /public/procedures/{id}/form` | Same tab, **Aperçu citoyen** | The public version of the form, exactly as citizens receive it (only once published) |
| `POST /public/conversations`, `POST …/{id}/messages` (SSE), `POST …/{id}/messages/audio` (SSE), `GET …/{id}/messages`, `GET …/audio/{filename}` | New **Tester l'assistant** page in both dashboards | Chat playground (see below) |
| `GET /public/organizations?q=` | Admin playground | "Autre structure…" search when routing finds no organization |
| `GET /public/organizations/{id}`, `/services`, `/procedures?q=`, `GET /public/procedures/{id}` | New **Aperçu public** page (org dashboard) | What citizens see: public org card, published services by department, searchable published procedures, procedure detail |
| `GET /public/bornes/{id}` | Kiosk rows (org and admin) → **Tester la borne** | What the physical kiosk receives on boot, or the 404 it gets when out of service or the org is suspended |
| `GET /me` | New **Mon compte** page (both dashboards) | Backend profile: email, roles, Clerk org id, backend organization id, `mirrored` flag. Includes a Clerk setup checklist with ✓ or ✗ per item |

**Form builder**
- Sections (title, description) and fields: name, label, all 9 types (`TEXT`, `TEXTAREA`, `NUMBER`,
  `DATE`, `EMAIL`, `PHONE`, `SELECT`, `RADIO`, `CHECKBOX`), placeholder, required, default value,
  help text, validation regex and message. Choice types get options.
- Sections, fields and options can all be reordered by drag or by up/down buttons.
- There is one Save, which does `POST` the first time and `PUT` after that. **Publish or unpublish
  the form** is a separate confirmed action, and deleting is confirmed too.
- A live preview renders the form as a citizen would fill it.
- The field `name` is generated from the label as a slug and can still be edited. Duplicate names
  are blocked before sending.

**Assistant playground** (a test tool for staff, not the citizen app)
- **Organization dashboard**: starts a conversation with `organizationId` = the backend id from `GET /me`.
- **Admin**: "PWA" mode. You send only the question. If the response is `disambiguation_required`,
  it shows the candidates and the public organization search.
- The answer streams as SSE, parsed with `fetch` + `ReadableStream` because `EventSource` can't POST.
  - Handled events: `message` deltas, `audio-chunk` played in a queue, `language-alert` banner,
    `error` event shown inline, and `done` with confidence, sources, QR code and `memoryReset`.
- Voice questions are recorded with the microphone (`MediaRecorder` → WebM), sent with a `wo`/`fr`
  choice (default `wo`) and a TTS toggle.
- "Recharger l'historique" re-reads the conversation from `GET …/messages`.
- The public endpoints need no token and are called **from the browser directly**
  (`NEXT_PUBLIC_API_BASE_URL`), like document uploads.
- In mock mode, the answer is simulated from the organization's published procedures and streamed
  word by word. It is labeled "Réponse simulée".
- Scope note: `AGENTS.md` puts the citizen app out of scope. This is an internal test console, added
  because you asked for every endpoint. It's not the kiosk/PWA and shows no analytics.

## Files expected

- `lib/api/request.ts` (timeout), `lib/api/server.ts` (breaker, data source), `lib/data/repository.ts`, `.env.example`.
- `lib/api/contract.ts` (+ form, me, public, chat schemas), `lib/api/public.ts` (browser client for public endpoints and SSE).
- `lib/data/backend.ts`, `lib/data/mock/*` (+ forms, me, public reads, simulated chat), `lib/actions/forms.ts`, `lib/actions/account.ts`.
- `components/features/forms/*`, `components/features/assistant/*`, `components/features/public/*`, `components/features/account/*`.
- Routes: `dashboard/[orgId]/assistant`, `dashboard/[orgId]/apercu`, `dashboard/[orgId]/compte`, `admin/assistant`, `admin/compte`. The procedure editor gets tabs.
- `lib/nav.ts`, `components/shell/Topbar.tsx` (demo pill).

## Security

- Admin endpoints are still called from the server with a fresh Clerk token. Public endpoints are
  called without a token, from the browser.
- No secret reaches the browser. Microphone audio goes straight to the backend. Nothing is stored
  locally.
- The URL org id is still reconciled with Clerk. The playground uses the organization id returned
  by `/me`, never one from the URL.
- `DATA_SOURCE=mock` is refused in production.

## Acceptance criteria

- With the backend unreachable, every click responds in under 1 s after the first failure, and
  screens show "Serveur injoignable".
- With `DATA_SOURCE=mock`, everything works offline and the demo pill is visible.
- Every endpoint in `API-FRONT.md` is used by at least one screen, except `POST /webhooks/clerk`,
  which is server-to-server.
- `tsc`, `lint` and `build` pass.

## Manual test steps

1. Keep `API_BASE_URL` set and the backend off, then click around: every screen shows "Serveur
   injoignable" quickly, and the sidebar collapses.
2. Set `DATA_SOURCE=mock` and restart: the demo pill appears and everything works.
3. Open a procedure → Formulaire: add 2 sections and 4 fields (one SELECT with 3 options), reorder
   them, then Save, Publish and check the citizen preview. Unpublish, then Delete.
4. Tester l'assistant: ask "Comment obtenir un extrait de naissance ?". The text streams in,
   followed by the sources. Record a voice question with the `fr` choice.
5. Aperçu public: search a procedure. Drafts are not listed.
6. Bornes → Tester la borne: an active kiosk shows its organization. An out-of-service kiosk shows the 404 explanation.
7. Mon compte: the checklist shows ✓ or ✗ for the session token claim, the org role and the backend mirror.
8. With the backend reachable: repeat steps 3 to 7 on real data.
