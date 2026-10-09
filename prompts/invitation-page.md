# Page d'acceptation d'invitation aux couleurs de Tontouma Bot

## Objectif

Quand un administrateur est invité dans une organisation, le lien de l'email l'envoie aujourd'hui sur la page d'inscription hébergée par Clerk, puis sur la page d'accueil par défaut de Clerk (« Clerk cannot redirect to your application »). L'invité doit arriver sur une page du dashboard, y créer son compte ou se connecter, puis atterrir directement sur `/dashboard` dans son organisation.

## Docs lues

- `AGENTS.md` (sections 3, 5, 6, 7).
- `.claude/skills/clerk-orgs/references/invitations.md` (acceptation d'invitation, paramètre `__clerk_ticket`).
- Clerk : les composants `<SignUp />` et `<SignIn />` traitent eux-mêmes le paramètre `__clerk_ticket` ; Clerk ajoute `__clerk_status` (`sign_up`, `sign_in` ou `complete`) à l'adresse de retour.
- `docs/API-FRONT.md` : `POST /superadmin/organizations`, `POST /superadmin/organizations/{id}/admins` (l'invitation est créée par le backend).

## Code inspecté

- `app/sign-in/[[...sign-in]]/page.tsx` (mise en page à reprendre : `SignInStory` + panneau).
- `components/auth/ClerkWidgets.tsx`, `components/auth/LazyClerk.tsx`.
- `proxy.ts` (aucune route n'est bloquée par le proxy ; les contrôles sont dans les layouts).
- `app/layout.tsx` (`ClerkProvider`, localisation française, apparence).
- `.env.example`.

## Constat mesuré (7 octobre 2026)

- L'organisation « Mairie Dakar Plateau » a bien été créée par le backend et existe dans Clerk.
- L'invitation a été acceptée : le compte invité est membre avec le rôle `org:admin`.
- Le parcours d'acceptation s'est fait entièrement sur le domaine Clerk, sans retour vers le dashboard.

## Décisions et hypothèses

- Nouvelle page publique `/invitation`. C'est l'adresse de retour que le backend doit donner à Clerk en créant l'invitation.
- La page lit `__clerk_status` :
  - `sign_up` : affiche `<SignUp />` de Clerk (nouveau compte) ;
  - `sign_in` : affiche `<SignIn />` de Clerk (compte existant) ;
  - `complete` : redirige vers `/dashboard` ;
  - absent, ou pas de `__clerk_ticket` : message « Lien d'invitation invalide ou expiré » avec un lien vers la connexion. Aucune inscription libre n'est proposée.
- Uniquement les composants Clerk : aucun formulaire de mot de passe maison (interdit par `AGENTS.md`).
- Après inscription ou connexion : redirection vers `/dashboard`, qui choisit déjà l'organisation active.
- Même mise en page que la connexion (`SignInStory` à gauche, panneau à droite), titre « Rejoindre votre organisation ».
- En mode dev (`AUTH_MODE=dev`), la page redirige vers `/dashboard`, comme la page de connexion.
- Hypothèse à vérifier pendant le test : `__clerk_status` est bien présent sur l'adresse de retour avec la version installée (`@clerk/nextjs` 7.9.7). Sinon, repli : afficher `<SignUp />` dès qu'un ticket est présent, avec un lien « J'ai déjà un compte ».

## Fichiers touchés

- `app/invitation/page.tsx` — nouvelle page.
- `components/auth/ClerkWidgets.tsx` — `ClerkSignUp`.
- `components/auth/LazyClerk.tsx` — `LazyClerkSignUp`.
- `.env.example` — note sur l'adresse de retour attendue par le backend.

## Exigences

- Textes en français, responsive (le récit à gauche disparaît sous `lg`, comme la connexion).
- États : chargement (squelette), lien invalide, redirection.
- Aucune dépendance ajoutée.

## Sécurité

- La page n'accorde aucun droit : c'est Clerk qui valide le ticket et le backend qui décide des accès.
- Pas d'inscription sans ticket valide sur cette page. L'inscription libre doit aussi être fermée dans Clerk (mode restreint) : réglage à faire dans le tableau de bord Clerk, hors code.
- Le ticket n'est ni journalisé ni envoyé à Sentry.
- Aucun secret côté navigateur.

## Critères d'acceptation

- Un lien d'invitation pointant vers `/invitation` permet de créer son compte sur une page Tontouma Bot, puis d'arriver sur `/dashboard` dans la bonne organisation.
- Un invité qui a déjà un compte se connecte depuis la même page.
- `/invitation` ouverte sans ticket affiche le message d'erreur et le lien vers la connexion.
- Type check, lint et build de production sans erreur.

## Vérifications à lancer

- `npx tsc --noEmit`, `npm run lint`, `npm run build` (nouvelle route).

## Tests manuels

1. Ouvrir `http://localhost:3000/invitation` sans paramètre : message « Lien d'invitation invalide ou expiré ».
2. Une fois le backend modifié : depuis `/admin`, inviter un nouvel email dans une organisation de test.
3. Cliquer le lien de l'email : la page `/invitation` s'ouvre avec le formulaire d'inscription Clerk aux couleurs du dashboard.
4. Créer le compte : arrivée sur `/dashboard` dans l'organisation invitante.
5. Inviter un email qui a déjà un compte : la page propose la connexion, puis `/dashboard`.
6. Réduire la fenêtre en mobile : la page reste utilisable.

## Dépendance côté backend (bloquante pour les tests 2 à 5)

Le backend doit passer une adresse de retour à Clerk quand il crée l'invitation (`redirect_url`), lue dans sa configuration :

- en développement : `http://localhost:3000/invitation` ;
- en production : `https://<domaine du dashboard>/invitation`.

Sans cela, Clerk continue d'envoyer l'invité sur sa propre page.

## À signaler (hors de ce changement)

- L'administrateur invité à la création d'une organisation reçoit le rôle `org:admin`. Dans le dashboard, ce rôle n'a pas accès aux membres, aux bornes, aux paramètres ni à l'abonnement (`AGENTS.md`, section 7). Le premier administrateur d'une organisation devrait recevoir `org:super_admin`.
- Le créateur de l'organisation dans Clerk est le compte du développeur backend, membre `org:super_admin` de « Mairie Dakar Plateau ».
