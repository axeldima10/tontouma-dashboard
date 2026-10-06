# Bouton de déconnexion + réponses de création acceptées

## Objectif

1. Ajouter un bouton « Se déconnecter » visible, sans passer par le menu de l'avatar Clerk.
2. Corriger un vrai bug trouvé pendant les tests sur le backend réel : après la création d'un plan, la modification d'un plan ou la création d'une borne, le backend répond « réussi » mais le dashboard rejette la réponse et affiche une erreur. L'enregistrement existe pourtant côté backend, donc l'utilisateur risque de recommencer et de créer des doublons.

## Docs lues

- `AGENTS.md` (sections 3, 5, 6, 7, 12).
- `docs/API-FRONT.md` : `PlanResponse`, `BorneResponse`, section SuperAdmin.
- Export OpenAPI live du backend (`/v3/api-docs`) : `createdAt`, `updatedAt` et `features[].id` n'y sont pas marqués obligatoires.

## Code inspecté

- `components/shell/Sidebar.tsx` (`UserCard`), `components/shell/Topbar.tsx` (avatar mobile).
- `components/auth/ClerkWidgets.tsx`, `components/auth/LazyClerk.tsx` (tous les usages client de Clerk, chargés à la demande).
- `lib/api/contract.ts` (`planSchema`, `borneSchema` et les 7 autres schémas avec `createdAt` / `updatedAt`).
- `components/features/admin/PlansManager.tsx` (clé React `feature.id`).
- Les 15 usages de `createdAt` / `updatedAt` dans `app/` et `components/` (tri, affichage de dates).

## Ce que les tests ont montré (backend réel, 6 octobre 2026)

| Appel | Réponse du backend | Effet dans le dashboard |
|---|---|---|
| `POST /superadmin/plans` | 201, `createdAt: null`, `updatedAt: null` | Rejeté par `planSchema` |
| `PUT /superadmin/plans/{id}` | 200, `features[0].id: null` | Rejeté par `planSchema` |
| `POST /superadmin/bornes` | 201, sans `createdAt` ni `updatedAt` | Rejeté par `borneSchema` |

Les lectures (`GET`) des mêmes objets renvoient bien les dates et les identifiants.

## Décisions et hypothèses

- **Déconnexion :** un bouton icône `LogOut` avec info-bulle « Se déconnecter » dans la carte utilisateur de la barre latérale (bureau et tiroir mobile). En barre latérale repliée, le bouton apparaît sous l'avatar. Il appelle `signOut({ redirectUrl: "/sign-in" })` de Clerk. Pas de confirmation : la déconnexion ne détruit rien.
- Le bouton vit dans `ClerkWidgets.tsx` et est exposé par `LazyClerk.tsx`, comme les autres widgets Clerk. En mode dev (`AUTH_MODE=dev`), il n'est pas affiché : il n'y a pas de session à fermer.
- L'avatar Clerk (`UserButton`) reste en place : il donne toujours accès à la gestion du compte.
- **Dates :** un seul helper `timestamp` dans `contract.ts`, utilisé pour tous les `createdAt` / `updatedAt` : il accepte `null` ou absent et retombe sur l'heure de la réponse. Le type reste `string`, donc aucun des 15 usages ne change. Après une création, l'écran est rechargé depuis le backend et affiche la vraie date. Hypothèse assumée : une date manquante dans une réponse de création ou de modification vaut « maintenant ».
- **`features[].id` :** accepté `null` ; la clé React retombe sur l'index.
- Aucune nouvelle dépendance, aucun nouvel endpoint.

## Fichiers touchés

- `components/auth/ClerkWidgets.tsx` — nouveau `ClerkSignOutButton`.
- `components/auth/LazyClerk.tsx` — `LazyClerkSignOutButton`.
- `components/shell/Sidebar.tsx` — bouton dans `UserCard`.
- `lib/api/contract.ts` — helper `timestamp`, `features[].id` tolérant.
- `components/features/admin/PlansManager.tsx` — clé React de repli.

## Exigences

- Texte en français, style identique aux boutons icônes existants (verre sur la barre latérale, contraste AA, focus visible, `aria-label`).
- Bouton désactivé pendant la déconnexion pour éviter le double clic.
- Aucune régression de type : `Plan`, `Borne` et les autres gardent `createdAt: string`.

## Sécurité

- La déconnexion passe uniquement par Clerk ; aucun jeton n'est lu ni stocké.
- Aucun changement sur les rôles, l'isolation des organisations ou les secrets.
- La tolérance des schémas ne concerne que des champs d'affichage (dates, identifiant de ligne), aucun champ d'autorisation.

## Critères d'acceptation

- Un bouton « Se déconnecter » est visible dans la barre latérale ; un clic renvoie sur `/sign-in` et `/dashboard` redevient inaccessible.
- Créer un plan, modifier un plan et créer une borne depuis `/admin` affichent le message de succès, sans erreur, et la liste montre l'élément une seule fois.
- Type check et lint sans erreur.

## Vérifications à lancer

- `npx tsc --noEmit`, `npm run lint`.
- Rejouer le script de test `/superadmin` contre le backend réel : les 3 lignes ci-dessus doivent passer.
- Build de production : non nécessaire (pas de route, proxy ni config modifiés).

## Tests manuels

1. Se connecter, cliquer sur « Se déconnecter » dans la barre latérale : retour sur `/sign-in`.
2. Ouvrir `/dashboard` : redirection vers la connexion.
3. Se reconnecter en SUPER_ADMIN, `/admin/plans` : créer un plan « TEST », vérifier le message de succès et une seule ligne dans la liste.
4. Modifier le prix de ce plan : message de succès.
5. Supprimer ce plan.
6. `/admin/bornes` : créer une borne « TEST », vérifier le succès, puis la supprimer.
7. Replier la barre latérale et réduire la fenêtre en mobile : le bouton reste accessible.

## À signaler au backend (hors de ce changement)

- Les réponses de création devraient renvoyer `createdAt` / `updatedAt`, et `PUT /plans/{id}` les `features[].id`.
- `POST /superadmin/bornes` accepte deux bornes avec le même identifiant (201 au lieu de 409).
- `CLERK_SECRET_KEY` n'est pas configurée sur le backend : `GET .../members` et `DELETE .../admins/{id}` répondent 502.
