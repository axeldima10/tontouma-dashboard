# TONTOUMA BOT — Modèle de données (VERSION FINALE RÉCONCILIÉE)

Ce document fusionne le travail de modélisation détaillé de l'équipe (diagramme de classes,
sections C/D/E) avec les décisions d'architecture actées dans cette conversation (Clerk,
v3 ticket-based). Structure conservée en sections A→G pour rester familier à l'équipe.

**Règle de lecture** : `✅ conservé tel quel` · `✏️ ajusté` · `❌ supprimé, remplacé par Clerk` · `🆕 nouveau, requis par l'architecture`

---

## A. ESPACE ADMINISTRATION TONTOUMA BOT

**Organisation** ✏️
`id, nom, type, description, adresse, telephone, email, siteWeb, logo, statut, dateCreation, dateActivation, **clerk_org_id**`
→ Ajout de `clerk_org_id` : lien vers l'organisation correspondante côté Clerk (membres et rôles y vivent, pas ici).

**DemandeAccesOrganisation** ✅
Conservée telle quelle — c'est un processus métier (une organisation candidate avant même d'avoir un compte), pas de l'identité.

**InvitationOrganisation** ✏️
Conservée, mais le `token` est un token métier applicatif à toi (ex. lien d'onboarding), **pas** un jeton Clerk — il sert à amorcer la création du compte Clerk, pas à s'authentifier.

**AdminTontouma** ❌ (en tant que table avec identité propre)
Remplacé par : un simple lien `clerk_user_id` partout où on a besoin de savoir "qui a fait quoi" (ex. dans Audit). Si des champs métier internes sont vraiment nécessaires (poste, téléphone pro) et que Clerk ne les stocke pas, une table légère `AdminTontoumaProfile(clerk_user_id, ...)` peut exister — jamais de mot de passe, jamais de statut de connexion, Clerk gère ça.

**RoleAdminTontouma** ❌
Remplacé par un rôle porté directement par Clerk (claim personnalisé dans le JWT, ex. `platform_role: admin`). Pas de table à maintenir pour un rôle qui n'a, à ce stade, qu'une seule vraie valeur utile ("admin plateforme").

---

## B. ACCÈS & GESTION DES UTILISATEURS (CÔTÉ ORGANISATION)

**Cette section disparaît presque entièrement — c'est le cœur du désaccord.**

| Entité du diagramme | Décision |
|---|---|
| `UtilisateurOrganisation` (avec `motDePasseHash`) | ❌ Clerk gère l'identité et le mot de passe des membres d'organisation |
| `RoleOrganisation`, `UserRole`, `Permission`, `RolePermission` | ❌ Remplacés par les 2 rôles fixes Clerk Organizations (`super_admin` / `admin`), lus depuis le JWT à chaque requête — voir ADR-2 |
| `SessionUtilisateur` (token, ip, userAgent) | ❌ Clerk gère ses propres sessions |

Si un jour on a besoin d'associer un membre à une info métier que Clerk ne stocke pas (ex. département assigné en interne à l'organisation) :

**MembreOrganisationProfile** 🆕 *(optionnelle, seulement si un vrai besoin apparaît)*
`clerk_user_id, organisation_id, [champs métier optionnels]` — jamais de mot de passe, jamais de rôle personnalisé ici.

---

## C. ABONNEMENTS & FACTURATION

**Conservé quasi tel quel — excellent travail, cohérent avec nos décisions (pas de Clerk Billing, gestion maison).**

`PlanAbonnement`, `RegleAbonnement`, `Abonnement`, `HistoriqueAbonnement`, `Facture`, `RappelAbonnement` ✅

**FournisseurPaiement** ✏️ → renommé **TransactionPaiement**
M�me structure, juste un nom plus précis : ce n'est pas "le fournisseur" (ça, c'est PayDunya/CinetPay, un système externe déjà dans le C4), c'est l'enregistrement d'une transaction. `methode: MoyenPaiement` doit se limiter aux moyens Mobile Money pertinents au Sénégal (Orange Money, Wave) — pas de carte bancaire, cohérent avec la décision Stripe/Clerk Billing écartée.

---

## D. CONTENU MÉTIER & CONNAISSANCE

**Conservé quasi tel quel.**

`Departement`, `Service`, `Demarche`, `ConditionDemarche`, `PieceRequise`, `Formulaire`, `SectionFormulaire`, `ChampFormulaire` ✅

**DocumentConnaissance** ✏️
Ajout requis : `statutIndexation: en_attente | en_cours | indexe | erreur` — distinct du statut de publication du contenu. Sans ce champ, rien ne représente l'état défini dans l'architecture C4 (Documents publie une tâche d'indexation, l'AI Service répond par un événement de fin d'indexation).

---

## E. BORNES & QR CODES

**Conservé tel quel — bonne précision d'avoir séparé `Borne` et `QRCode` plutôt qu'une seule entité générique.** ✅

`Borne.codeUnique` et `QRCode.code` sont les points d'entrée exploités par le composant Spring `Access Points & QR` pour résoudre l'organisation et créer une `UserSession`.

---

## F. CONVERSATIONS & IA — reconstruite pour la v3

**Incompatible telle quelle.** Le schéma suppose que Spring voit et écrit chaque message en direct — faux depuis la v3 : Spring n'est plus dans le chemin du flux conversationnel (texte SSE ou voix WebSocket va directement React ↔ AI Service, via ticket).

**Ce qui change** : l'AI Service est le seul à voir la conversation en temps réel. Une fois une conversation terminée, il publie un événement récapitulatif dans la Message Queue ; côté Spring, un composant (extension d'`Audit`, ou un nouveau composant léger `Conversation Logging`) consomme cet événement et persiste l'historique — **après coup, jamais en direct**. C'est un journal à des fins de reporting/audit pour Tontouma Bot et les organisations, pas un stockage temps réel.

**Conversation** ✏️ `id, organisation, canal, dateDebut, dateFin, resume(nullable)` — écrite par Spring uniquement à la réception de l'événement de fin de conversation publié par l'AI Service.

**Message** ✏️ `id, conversation, role (user/assistant), contenu, dateCreation` — idem, écrit après coup depuis l'événement récapitulatif, pas message par message en direct (l'AI Service n'a aucune raison de publier un événement par mot généré).

**SourceInformation** ✅ `id, message, typeSource, entiteId, titre, ordre` — conservé, utile pour tracer quelles démarches/documents ont servi de contexte à une réponse (inclus dans l'événement récapitulatif de l'AI Service).

**RappelAMemoriser** — à clarifier avec l'équipe : si c'est pour la mémoire courte de l'IA pendant UNE conversation, ça vit côté AI Service (Python), pas ici. Si c'est un rappel métier (relance à froid), à modéliser séparément — pas assez d'information dans le schéma actuel pour trancher, à préciser avant d'implémenter.

---

## G. INTERFACES USAGERS

Pas de données à modéliser ici (UI pure) — inchangé.

---

## Ce que ça change dans les contrats d'API déjà livrés

- `tontouma-bot-api-contract.yaml` (Spring) : nouveaux endpoints nécessaires pour Departement, PlanAbonnement/Abonnement/Facture, Borne/QRCode distincts — voir mise à jour ci-dessous pour le socle golden-path ; le reste suit le même patron.
- `tontouma-bot-ai-service-contract.md` (Python) : inchangé sur le fond (SSE/WebSocket/ticket), mais l'AI Service doit désormais publier l'événement récapitulatif de fin de conversation (nouveau, décrit en section F) — à ajouter au contrat.

---

## MISE À JOUR MVP — suite aux retours du coach (remplace certains points ci-dessus)

### Suppression de Redis pour les sessions

**User Sessions ne vit plus côté Spring/Redis.** La session usager (borne ou PWA) est désormais gérée entièrement côté **AI Service**, dans sa propre base PostgreSQL — nécessaire pour la continuité borne→PWA (accessible par `session_id` depuis n'importe quel appareil, persistante). Spring délivre seulement le ticket initial.

**Session** 🆕 *(table PostgreSQL côté AI Service, pas côté Spring)*
`id, organisation_id, canal (borne|pwa), dateCreation, dateDerniereActivite, statut (active|terminee)`

**Message** ✏️ *(déplacé côté AI Service — écrit en temps réel, pas après coup comme envisagé en v3)*
`id, session_id, role (user|assistant), contenu_texte, audio_url (nullable), display_card (JSON, nullable), navigation_point (JSON, nullable), dateCreation`

> Correction par rapport à la section F précédente : puisque le canal est maintenant un WebSocket unique directement entre le front et l'AI Service (pas de relais Spring), et puisqu'on a besoin de retrouver l'historique en temps réel pour la continuité PWA (pas seulement pour du reporting après coup), l'AI Service écrit directement dans sa propre base — pas d'événement asynchrone vers Spring pour ça. Un événement de synthèse (agrégé, anonymisé si besoin) peut toujours être envoyé vers Spring pour le reporting côté `Platform Administration`, mais ce n'est plus le mécanisme de persistance principal de la conversation elle-même.

### Copie structurée côté AI Service (remplace la lecture directe qu'on avait un temps envisagée)

**ServiceOfferingCache** / **ProcedureCache** 🆕 *(tables PostgreSQL côté AI Service, en lecture seule pour l'IA)*
Copie synchronisée du contenu publié de `Service`/`Procedure` — mêmes champs utiles (nom, description, coût, délai, conditions, pièces requises). Mise à jour par l'appel HTTP direct que Spring fait à chaque publication (`POST /internal/sync-content`), plus de RabbitMQ. L'AI Service ne lit **jamais** directement les tables de Spring, ni ne l'appelle pendant qu'il répond à une question — il lit toujours sa copie locale.

### Cartographie (nouveau)

**PlanBatiment** 🆕
`id, organisation_id, nom (ex: "Rez-de-chaussée"), image_url, dateCreation`

**Position** 🆕 *(rattachée à Borne ou Service, jamais les deux)*
`id, plan_id, entite_type (borne|service), entite_id, coordonnee_x, coordonnee_y`

**Service** ✏️ — ajout du champ `description_orientation: string (nullable)` — instructions textuelles ("couloir central, première porte à droite") que l'IA restitue à l'oral et à l'écran, en complément du point sur le plan.

### Documents rattachés au bon niveau métier

**DocumentConnaissance** ✏️ — ajout de `service_id (nullable)` et `procedure_id (nullable)`, en plus de `organization_id` (déjà présent). Un document rattaché à une organisation entière laisse les deux nuls ; rattaché à un service précis, seul `service_id` est renseigné ; etc. Pas de bibliothèque de documents séparée — chaque document vit là où il a un sens métier, conformément à la décision actée.

### Formulaires — QR récapitulatif (PWA)

**FormulaireSubmission** ✏️ — ajout de `qr_recapitulatif_token: string (unique)`, généré à la soumission. L'agent au guichet scanne ce token pour récupérer instantanément les réponses sans ressaisie — pas de soumission électronique vers un système tiers en V1.

### Containers supprimés de l'infrastructure — pour mémoire

~~Redis~~, ~~RabbitMQ~~, ~~Worker~~ — voir `tontouma-bot-c4-MVP.md` pour le raisonnement complet (YAGNI pour le MVP, réintroductibles en V1.1).
