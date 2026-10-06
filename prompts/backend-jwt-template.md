# Envoyer au backend le modèle de jeton qu'il attend

## Objectif

Le backend lit l'organisation, le rôle d'organisation et l'email dans les champs `org_id`, `org_role` et `email`. Ces champs n'existent que dans le modèle de jeton Clerk `backend-test`, créé côté backend. Le dashboard envoie aujourd'hui le jeton de session standard de Clerk, où l'organisation est rangée dans `o.id` / `o.rol`. Décision d'Axel : on suit ce que le backend a défini. Le dashboard doit donc envoyer le modèle du backend sur chaque appel authentifié.

## Docs lues

- `AGENTS.md` (sections 5, 7, 10, 12).
- `docs/API-FRONT.md` : en-tête « Authentification », `GET /api/v1/me`.
- `docs/RETOUR-BACKEND.md`, point 1 (preuve mesurée).
- Clerk : `getToken({ template })` côté serveur (`auth()`) et côté client (`useAuth()`).

## Code inspecté

- `lib/auth/session.ts` — `getBackendToken()` : seul point d'obtention du jeton côté serveur.
- `components/auth/ClerkWidgets.tsx` — `ClerkTokenSource` : seul point d'obtention du jeton côté client.
- `components/auth/SessionProvider.tsx`, `lib/api/client.ts` (envoi de document depuis le navigateur).
- `lib/auth/roles.ts`, `proxy.ts` : la protection des routes lit les claims de session, pas ce jeton.
- `.env.example`.

## Ce qui a été mesuré (backend réel, même compte, même session)

| | Jeton standard | Modèle `backend-test` |
|---|---|---|
| `GET /me` → `roles` | `["SUPER_ADMIN"]` | `["ADMIN_ORGANISATION", "SUPER_ADMIN"]` |
| `GET /me` → `clerkOrgId`, `email` | absents | présents |
| `GET /superadmin/plans` | 200 | 200 |
| `GET /admin/services` | 403 « rôle insuffisant » | 403 « Organisation Clerk inconnue en base » |

## Décisions et hypothèses

- Le nom du modèle n'est pas écrit en dur : nouvelle variable `NEXT_PUBLIC_CLERK_JWT_TEMPLATE`. Elle est publique parce que le navigateur en a besoin pour l'envoi de documents ; un nom de modèle n'est pas un secret.
- Variable vide ou absente : le dashboard envoie le jeton standard, comme aujourd'hui. Le changement est donc réversible sans toucher au code.
- `.env.local` reçoit `NEXT_PUBLIC_CLERK_JWT_TEMPLATE=backend-test`.
- Seuls les deux points d'obtention du jeton changent. La protection des routes (`proxy.ts`, layouts) continue de lire la session Clerk et la claim `platform_role`.
- Un jeton reste demandé frais avant chaque appel, jamais stocké.
- Si Clerk ne connaît pas le modèle (nom faux, modèle supprimé), `getToken` échoue : l'erreur est transformée en « session non reconnue » avec un message qui nomme la variable, au lieu d'une erreur brute.
- La page « Mon compte » affiche quel jeton est envoyé (standard ou nom du modèle) pour faciliter le diagnostic.

## Fichiers touchés

- `lib/auth/session.ts` — `getBackendToken()` passe le modèle.
- `components/auth/ClerkWidgets.tsx` — `ClerkTokenSource` passe le modèle.
- `lib/auth/mode.ts` ou nouveau petit module `lib/auth/token.ts` — lecture unique de la variable.
- `components/features/account/AccountView.tsx` — ligne d'information sur le jeton envoyé.
- `.env.example`, `.env.local`.

## Exigences

- Aucun nom de modèle en dur dans le code.
- Aucun changement de comportement quand la variable est vide.
- Textes en français.

## Sécurité

- Aucun secret ajouté ; `CLERK_SECRET_KEY` reste côté serveur.
- Le jeton du modèle contient l'email de l'utilisateur : il n'est ni journalisé ni envoyé à Sentry (le nettoyage existant des en-têtes `Authorization` reste en place).
- L'autorisation reste décidée par le backend à partir du jeton ; l'interface ne fait que masquer.
- L'identifiant d'organisation de l'URL reste non fiable et réconcilié avec l'organisation active Clerk.

## Critères d'acceptation

- « Mon compte » : `GET /me` affiche l'email, l'organisation Clerk et le rôle `ADMIN_ORGANISATION`.
- `/admin` continue de fonctionner (organisations, plans, bornes).
- Avec la variable vidée, le comportement redevient celui d'aujourd'hui.
- Type check et lint sans erreur ; build de production réussi (code serveur modifié).

## Vérifications à lancer

- `npx tsc --noEmit`, `npm run lint`.
- `npm run build` (serveur de dev arrêté).
- Script de test `/superadmin` rejoué contre le backend réel avec le jeton du modèle.

## Tests manuels

1. Redémarrer `npm run dev` (nouvelle variable d'environnement).
2. Se connecter, ouvrir « Mon compte » : l'email et « Organisation Clerk » sont remplis, le rôle backend contient `ADMIN_ORGANISATION`.
3. Ouvrir `/admin/plans` et `/admin/bornes` : les listes s'affichent.
4. Ouvrir `/dashboard` : l'erreur attendue devient « Organisation Clerk inconnue en base » tant que le backend n'a pas relié l'organisation (point 2 de `docs/RETOUR-BACKEND.md`).
5. Vider `NEXT_PUBLIC_CLERK_JWT_TEMPLATE`, redémarrer : « Mon compte » revient à l'état actuel.

## À signaler au backend (hors de ce changement)

- Le modèle devra exister à l'identique, avec le même nom, dans l'instance Clerk de production.
- Dans le modèle, le champ `email` est défini par une valeur incorrecte (une adresse écrite dans le code du modèle) : il devrait valoir `{{user.primary_email_address}}`.
