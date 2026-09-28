# API TontumaBot — Endpoints pour le Front

Généré automatiquement depuis l'export OpenAPI live du backend (`GET /v3/api-docs`), pour intégration du Front (Axel) sans environnement déployé. Régénérable à tout moment tant que le backend tourne, via `/v3/api-docs` ou `/swagger-ui.html`.

**Base URL** (dev local) : `http://localhost:8080` · préfixe API : `/api/v1`

**Authentification** : `Authorization: Bearer <JWT Clerk>` sur les routes `admin`/`superadmin`/`/me` ; ignoré/absent sur les routes `public`.

**Erreurs** : toute erreur (y compris en SSE) suit le même format `ApiError` — voir [Annexe — Schémas communs](#annexe-schémas-communs).

**Colonne « Requis »** : reflète les contraintes Bean Validation exposées par le schéma OpenAPI ; certaines règles (ex. « l'un des deux champs, pas les deux ») ne sont exprimables qu'en texte — elles sont alors précisées dans la description de l'endpoint. Une contrainte `non vide` en colonne « Contraintes » signale un champ obligatoire non nul même quand la colonne « Requis » est vide.

## Sommaire

- [1. Public — sans authentification (PWA usager + bornes)](#1-public-sans-authentification-pwa-usager-bornes)
  - [Public · Chatbot](#public-chatbot)
  - [Public · Organisations](#public-organisations)
  - [Public · Démarches](#public-démarches)
  - [Public · Formulaires](#public-formulaires)
  - [Public · Structure (bornes & services)](#public-structure-bornes-services)
- [2. Admin — JWT Clerk requis, rôle `ADMIN_ORGANISATION` (scope = son organisation)](#2-admin-jwt-clerk-requis-rôle-adminorganisation-scope-son-organisation)
  - [Admin · Démarches](#admin-démarches)
  - [Admin · Formulaires](#admin-formulaires)
  - [Admin · Base de connaissances IA](#admin-base-de-connaissances-ia)
  - [Admin · Départements](#admin-départements)
  - [Admin · Services](#admin-services)
  - [Admin · Bornes](#admin-bornes)
  - [Admin · Statistiques](#admin-statistiques)
  - [Admin · Abonnement](#admin-abonnement)
- [3. SuperAdmin — JWT Clerk requis, `public_metadata.role=SUPER_ADMIN` (scope global)](#3-superadmin-jwt-clerk-requis-publicmetadatarolesuperadmin-scope-global)
  - [SuperAdmin · Organisations](#superadmin-organisations)
  - [SuperAdmin · Plans](#superadmin-plans)
  - [SuperAdmin · Bornes](#superadmin-bornes)
- [4. Hors préfixe `/api/v1`](#4-hors-préfixe-apiv1)
  - [Hors préfixe · Hors préfixe](#hors-préfixe-hors-préfixe)
- [Annexe — Schémas communs](#annexe-schémas-communs)

## 1. Public — sans authentification (PWA usager + bornes)

### Public · Chatbot

### `POST` `/api/v1/public/conversations`
**Démarre une conversation**

- **Authentification** : aucune (public)

Deux façons : `organizationId` déjà connu (borne physique, qui connaît son organisation par construction), ou `question` seule — l'organisation est alors résolue depuis le texte (cas normal d'une PWA ouverte sans structure choisie). Exactement l'un des deux est requis (400 sinon).

`language` est optionnel et **informatif** : il n'influence aucun appel au service IA. `fr`, `FR` ou `fr-FR` valent `fr` ; toute valeur inconnue retombe sur `fr` (jamais un 400 : une langue déclarée n'empêche pas de démarrer). Le texte est détecté par l'IA à chaque question (français comme wolof), la voix se règle par question vocale (`lang` de `POST /{id}/messages/audio`).

**PWA sans structure choisie** : envoyer seulement `question` (ni `organizationId` ni `borneId`, à omettre — pas de valeur factice). Si la plateforme n'a qu'une organisation active, elle est retenue d'office (201) ; sinon le routage la déduit de la question, ou renvoie 200 `disambiguation_required` avec les `candidates` à proposer. La réponse (`id`) est ensuite l'identifiant de `POST /{id}/messages`, réservé à une conversation existante.

**Corps de requête** — `StartConversationRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `organizationId` | UUID |  |  |
| `question` | chaîne |  |  |
| `borneId` | UUID |  |  |
| `language` | chaîne |  |  |


**Réponses**

- **`201`** — Conversation créée (en-tête `Location` renseigné)
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/public/conversations/audio/{filename}`
**Relaie un fichier audio de synthèse vocale**

- **Authentification** : aucune (public)

Deux origines possibles selon le nom de fichier : un morceau encore en direct, relayé depuis `GET /static/{filename}` côté IA, ou une réponse assemblée déjà persistée dans notre propre stockage (voir `GET /{id}/messages`, champ `audioUrl`). Le service IA n'est jamais exposé directement au navigateur.

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `filename` | path | chaîne | oui |  |

**Réponses**

- **`200`** — OK
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/public/conversations/{id}/messages`
**Relit l'historique d'une conversation**

- **Authentification** : aucune (public)

Messages dans l'ordre chronologique, avec sources pour les réponses de l'assistant (`documentId`, `title`, `category`, `relevanceScore` — ce dernier n'est pas un pourcentage de confiance, voir la doc du service IA). `audioUrl` est conservé (réponse assemblée persistée dans notre stockage) ; `qrCode`, lui, ne l'est **pas** : disponible uniquement en direct, sur l'événement SSE `done` du tour concerné.

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `[]` | objet ChatMessageResponse |  |  |
| `[].id` | UUID |  |  |
| `[].role` | énumération (USER, ASSISTANT) |  |  |
| `[].content` | chaîne |  |  |
| `[].confidence` | décimal |  |  |
| `[].sources` | tableau de objet SourceRefResponse |  |  |
| `[].sources[].documentId` | UUID |  |  |
| `[].sources[].title` | chaîne |  |  |
| `[].sources[].category` | chaîne |  |  |
| `[].sources[].relevanceScore` | décimal |  |  |
| `[].audioUrl` | chaîne |  |  |
| `[].createdAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/public/conversations/{id}/messages`
**Pose une question écrite (réponse en flux SSE)**

- **Authentification** : aucune (public)

Répond en `text/event-stream`, jusqu'à cinq types d'événement :

- `message` — `{"delta": "<texte de la réponse>"}`, dès qu'il est disponible (potentiellement avant l'audio si `tts: true`).
- `audio-chunk` — `{"audioUrl", "index", "total"}`, un par morceau de réponse vocale prêt (0 si `tts: false`).
- `language-alert` — `{"declaredLanguage", "detectedLanguage"}`, si la langue transcrite d'une question vocale ne correspond pas à celle choisie. Jamais émis pour une question écrite : aucune langue n'est transmise à l'IA, qui détecte seule celle de chaque question (français comme wolof) et répond dans cette langue.
- `error` — `{"message"}`, si le service IA échoue en cours de flux. Le flux se termine alors normalement (HTTP 200) : voir la Javadoc de ce contrôleur.
- `done` — métadonnées de la réponse, émis une fois, en dernier (absent après `error`).

Une conversation inconnue est rejetée **avant** l'ouverture du flux, comme une réponse HTTP normale (404 `ApiError`).

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `SendMessageRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `content` | chaîne |  | non vide |
| `tts` | booléen |  |  |


**Réponses**

- **`200`** — Flux SSE de la réponse → voir *Détail du flux SSE* ci-dessous.
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).


**Détail du flux SSE** (`POST /{id}/messages` et `POST /{id}/messages/audio` partagent exactement le même contrat d'événements) :

| Événement | Payload JSON (`data:`) | Quand |
|---|---|---|
| `message` | `{"delta": "<texte de la réponse>"}` | Dès que du texte est disponible (avant l'audio si `tts: true`). |
| `audio-chunk` | `{"audioUrl": "...", "index": 0, "total": 3}` | Un par morceau de réponse vocale prêt ; absent si `tts: false`. `audioUrl` est jouable immédiatement (`GET /public/conversations/audio/{filename}`). |
| `language-alert` | `{"declaredLanguage": "wo", "detectedLanguage": "fr"}` | Uniquement pour une question **vocale**, si la langue transcrite ne correspond pas à `lang`. Jamais émis pour une question écrite. |
| `error` | `{"message": "..."}` | Panne du service IA en cours de flux. **Le flux se termine normalement (HTTP 200)** — ce n'est pas un code d'erreur HTTP, voir plus bas. |
| `done` | `{"messageId": "uuid", "confidence": 0.0, "sources": [{"documentId","title","category","relevanceScore"}], "audioUrl": "...\|null", "qrCode": "...\|null", "memoryReset": false}` | Émis une seule fois, en dernier (absent après `error`). `qrCode` n'est disponible qu'ici, en direct — il n'est pas repersisté dans `GET /{id}/messages`. |

Piège à connaître : une fois le flux SSE ouvert (200), une panne IA n'est **plus** une erreur HTTP — elle arrive en événement `error`, puis le flux se termine proprement. Une conversation inconnue (404) est en revanche rejetée **avant** l'ouverture du flux, comme une erreur HTTP classique.

Les morceaux `audio-chunk` ne s'enchaînent pas tout seuls : à jouer côté Front en file d'attente, avec un léger buffer d'avance et un indicateur « en train de répondre » pendant les silences.

### `POST` `/api/v1/public/conversations/{id}/messages/audio`
**Pose une question vocale (réponse en flux SSE)**

- **Authentification** : aucune (public)

`multipart/form-data` : `file` (WAV/MP3/M4A/WebM), `lang` (optionnel, `wo` ou `fr`, 400 sinon — sélectionne le moteur de transcription côté IA, qui ne sait pas deviner la langue depuis l'audio ; **wolof par défaut**. À envoyer à `fr` à chaque question vocale quand l'usager a choisi de parler français : la langue déclarée de la conversation n'est pas utilisée ici), `tts` (optionnel, `true` par défaut — une question posée à l'oral appelle normalement une réponse orale).

Même flux SSE que `POST /{id}/messages` (voir sa description) — la transcription de la question n'est jamais renvoyée dans la réponse HTTP elle-même, seulement persistée (visible via `GET /{id}/messages`).

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |
| `lang` | query | chaîne |  |  |
| `tts` | query | booléen |  |  |

**Corps de requête** — `(inline)`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `file` | fichier | oui |  |


**Réponses**

- **`200`** — Flux SSE de la réponse → voir *Détail du flux SSE* ci-dessous.
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).


**Détail du flux SSE** (`POST /{id}/messages` et `POST /{id}/messages/audio` partagent exactement le même contrat d'événements) :

| Événement | Payload JSON (`data:`) | Quand |
|---|---|---|
| `message` | `{"delta": "<texte de la réponse>"}` | Dès que du texte est disponible (avant l'audio si `tts: true`). |
| `audio-chunk` | `{"audioUrl": "...", "index": 0, "total": 3}` | Un par morceau de réponse vocale prêt ; absent si `tts: false`. `audioUrl` est jouable immédiatement (`GET /public/conversations/audio/{filename}`). |
| `language-alert` | `{"declaredLanguage": "wo", "detectedLanguage": "fr"}` | Uniquement pour une question **vocale**, si la langue transcrite ne correspond pas à `lang`. Jamais émis pour une question écrite. |
| `error` | `{"message": "..."}` | Panne du service IA en cours de flux. **Le flux se termine normalement (HTTP 200)** — ce n'est pas un code d'erreur HTTP, voir plus bas. |
| `done` | `{"messageId": "uuid", "confidence": 0.0, "sources": [{"documentId","title","category","relevanceScore"}], "audioUrl": "...\|null", "qrCode": "...\|null", "memoryReset": false}` | Émis une seule fois, en dernier (absent après `error`). `qrCode` n'est disponible qu'ici, en direct — il n'est pas repersisté dans `GET /{id}/messages`. |

Piège à connaître : une fois le flux SSE ouvert (200), une panne IA n'est **plus** une erreur HTTP — elle arrive en événement `error`, puis le flux se termine proprement. Une conversation inconnue (404) est en revanche rejetée **avant** l'ouverture du flux, comme une erreur HTTP classique.

Les morceaux `audio-chunk` ne s'enchaînent pas tout seuls : à jouer côté Front en file d'attente, avec un léger buffer d'avance et un indicateur « en train de répondre » pendant les silences.

### Public · Organisations

### `GET` `/api/v1/public/organizations`
**Recherche des organisations**

- **Authentification** : aucune (public)

Le repli de l'usager quand `POST /public/conversations` renvoie une liste de candidats vide (« Autre structure… ») : il tape quelques lettres, choisit une structure, puis rappelle `POST /public/conversations` avec son `organizationId`.

`q` (obligatoire, 2 à 100 caractères, 400 sinon) : tous les mots doivent se retrouver dans le nom, l'adresse ou le type, dans n'importe quel ordre. Les accents, les majuscules et les articles (« de », « la »…) sont ignorés, et un début de mot suffit (`fan` retrouve « Hôpital de Fann »).

Organisations actives uniquement, triées par nom. Réponse minimale (`id`, `name`, `type`, `address`) — la même forme que les `candidates` de la désambiguïsation. Paginée comme les autres listes : `page` à partir de 0, `size` 10 par défaut, 50 au maximum. Aucun résultat n'est une réponse `200` normale avec `content: []`.

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `q` | query | chaîne | oui |  |
| `page` | query | entier |  |  |
| `size` | query | entier |  |  |

**Réponses**

- **`200`** — OK → `PageResponseOrganizationCandidateResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `content` | tableau de objet OrganizationCandidateResponse |  |  |
| `content[].id` | UUID |  |  |
| `content[].name` | chaîne |  |  |
| `content[].type` | chaîne |  |  |
| `content[].address` | chaîne |  |  |
| `page` | entier |  |  |
| `size` | entier |  |  |
| `totalElements` | entier long |  |  |
| `totalPages` | entier |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/public/organizations/{organizationId}`
**Détail d'une organisation**

- **Authentification** : aucune (public)

Nom, type, adresse, contact, logo et horaires. 404 si l'organisation est inconnue ou désactivée.

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `organizationId` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `PublicOrganizationResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `name` | chaîne |  |  |
| `type` | chaîne |  |  |
| `address` | chaîne |  |  |
| `phone` | chaîne |  |  |
| `email` | chaîne |  |  |
| `logoUrl` | chaîne |  |  |
| `openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `openingHours[].opensAt` | chaîne |  |  |
| `openingHours[].closesAt` | chaîne |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### Public · Démarches

### `GET` `/api/v1/public/organizations/{organizationId}/procedures`
**Liste les démarches d'une organisation**

- **Authentification** : aucune (public)

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `organizationId` | path | UUID | oui |  |
| `q` | query | chaîne |  |  |
| `page` | query | entier |  |  |
| `size` | query | entier |  |  |
| `sort` | query | chaîne |  |  |

**Réponses**

- **`200`** — OK → `PageResponseProcedureResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `content` | tableau de objet ProcedureResponse |  |  |
| `content[].id` | UUID |  |  |
| `content[].organizationId` | UUID |  |  |
| `content[].serviceId` | UUID |  |  |
| `content[].serviceName` | chaîne |  |  |
| `content[].title` | chaîne |  |  |
| `content[].description` | chaîne |  |  |
| `content[].conditions` | chaîne |  |  |
| `content[].cost` | entier |  |  |
| `content[].costCurrency` | chaîne |  |  |
| `content[].place` | chaîne |  |  |
| `content[].additionalInfo` | chaîne |  |  |
| `content[].processingDays` | entier |  |  |
| `content[].active` | booléen |  |  |
| `content[].requiredDocuments` | tableau de objet RequiredDocumentResponse |  |  |
| `content[].requiredDocuments[].id` | UUID |  |  |
| `content[].requiredDocuments[].label` | chaîne |  |  |
| `content[].requiredDocuments[].displayOrder` | entier |  |  |
| `content[].createdAt` | date-heure (ISO 8601) |  |  |
| `content[].updatedAt` | date-heure (ISO 8601) |  |  |
| `page` | entier |  |  |
| `size` | entier |  |  |
| `totalElements` | entier long |  |  |
| `totalPages` | entier |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/public/procedures/{id}`
**Détail d'une démarche**

- **Authentification** : aucune (public)

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `ProcedureResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `serviceId` | UUID |  |  |
| `serviceName` | chaîne |  |  |
| `title` | chaîne |  |  |
| `description` | chaîne |  |  |
| `conditions` | chaîne |  |  |
| `cost` | entier |  |  |
| `costCurrency` | chaîne |  |  |
| `place` | chaîne |  |  |
| `additionalInfo` | chaîne |  |  |
| `processingDays` | entier |  |  |
| `active` | booléen |  |  |
| `requiredDocuments` | tableau de objet RequiredDocumentResponse |  |  |
| `requiredDocuments[].id` | UUID |  |  |
| `requiredDocuments[].label` | chaîne |  |  |
| `requiredDocuments[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### Public · Formulaires

### `GET` `/api/v1/public/procedures/{procedureId}/form`
**Récupère le formulaire d'une démarche**

- **Authentification** : aucune (public)

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `procedureId` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `FormBuilderResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `procedureId` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `active` | booléen |  |  |
| `sections` | tableau de objet FormSectionResponse |  |  |
| `sections[].id` | UUID |  |  |
| `sections[].title` | chaîne |  |  |
| `sections[].description` | chaîne |  |  |
| `sections[].displayOrder` | entier |  |  |
| `sections[].fields` | tableau de objet FormFieldResponse |  |  |
| `sections[].fields[].id` | UUID |  |  |
| `sections[].fields[].name` | chaîne |  |  |
| `sections[].fields[].label` | chaîne |  |  |
| `sections[].fields[].fieldType` | énumération (TEXT, TEXTAREA, NUMBER, DATE, EMAIL, PHONE, SELECT, RADIO, CHECKBOX) |  |  |
| `sections[].fields[].placeholder` | chaîne |  |  |
| `sections[].fields[].required` | booléen |  |  |
| `sections[].fields[].displayOrder` | entier |  |  |
| `sections[].fields[].defaultValue` | chaîne |  |  |
| `sections[].fields[].helpText` | chaîne |  |  |
| `sections[].fields[].validationRegex` | chaîne |  |  |
| `sections[].fields[].validationMessage` | chaîne |  |  |
| `sections[].fields[].options` | tableau de objet FieldOptionResponse |  |  |
| `sections[].fields[].options[].id` | UUID |  |  |
| `sections[].fields[].options[].label` | chaîne |  |  |
| `sections[].fields[].options[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### Public · Structure (bornes & services)

### `GET` `/api/v1/public/bornes/{borneId}`
**Détail d'une borne**

- **Authentification** : aucune (public)

Une borne physique n'est configurée qu'avec son propre identifiant : cet appel lui apprend à quelle organisation elle appartient (nom, logo, horaires) et dans quel état elle est. 404 si la borne est inconnue, hors service, ou si son organisation est désactivée.

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `borneId` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `PublicBorneResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `identifier` | chaîne |  |  |
| `location` | chaîne |  |  |
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) |  |  |
| `organization` | objet PublicOrganizationResponse |  |  |
| `organization.id` | UUID |  |  |
| `organization.name` | chaîne |  |  |
| `organization.type` | chaîne |  |  |
| `organization.address` | chaîne |  |  |
| `organization.phone` | chaîne |  |  |
| `organization.email` | chaîne |  |  |
| `organization.logoUrl` | chaîne |  |  |
| `organization.openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `organization.openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `organization.openingHours[].opensAt` | chaîne |  |  |
| `organization.openingHours[].closesAt` | chaîne |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/public/organizations/{organizationId}/services`
**Liste les services d'une organisation**

- **Authentification** : aucune (public)

Guichets actifs, groupés par département — pour naviguer par service plutôt que de chercher une démarche au titre exact. Chaque `id` se réinjecte dans le filtre `serviceId` de la recherche de démarches. 404 si l'organisation est inconnue ou désactivée.

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `organizationId` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `[]` | objet PublicServiceResponse |  |  |
| `[].id` | UUID |  |  |
| `[].name` | chaîne |  |  |
| `[].description` | chaîne |  |  |
| `[].location` | chaîne |  |  |
| `[].phone` | chaîne |  |  |
| `[].openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `[].openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `[].openingHours[].opensAt` | chaîne |  |  |
| `[].openingHours[].closesAt` | chaîne |  |  |
| `[].departmentId` | UUID |  |  |
| `[].departmentName` | chaîne |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

## 2. Admin — JWT Clerk requis, rôle `ADMIN_ORGANISATION` (scope = son organisation)

### Admin · Démarches

### `GET` `/api/v1/admin/procedures`
**Liste les démarches**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `q` | query | chaîne |  |  |
| `serviceId` | query | UUID |  |  |
| `active` | query | booléen |  |  |
| `page` | query | entier |  |  |
| `size` | query | entier |  |  |
| `sort` | query | chaîne |  |  |

**Réponses**

- **`200`** — OK → `PageResponseProcedureResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `content` | tableau de objet ProcedureResponse |  |  |
| `content[].id` | UUID |  |  |
| `content[].organizationId` | UUID |  |  |
| `content[].serviceId` | UUID |  |  |
| `content[].serviceName` | chaîne |  |  |
| `content[].title` | chaîne |  |  |
| `content[].description` | chaîne |  |  |
| `content[].conditions` | chaîne |  |  |
| `content[].cost` | entier |  |  |
| `content[].costCurrency` | chaîne |  |  |
| `content[].place` | chaîne |  |  |
| `content[].additionalInfo` | chaîne |  |  |
| `content[].processingDays` | entier |  |  |
| `content[].active` | booléen |  |  |
| `content[].requiredDocuments` | tableau de objet RequiredDocumentResponse |  |  |
| `content[].requiredDocuments[].id` | UUID |  |  |
| `content[].requiredDocuments[].label` | chaîne |  |  |
| `content[].requiredDocuments[].displayOrder` | entier |  |  |
| `content[].createdAt` | date-heure (ISO 8601) |  |  |
| `content[].updatedAt` | date-heure (ISO 8601) |  |  |
| `page` | entier |  |  |
| `size` | entier |  |  |
| `totalElements` | entier long |  |  |
| `totalPages` | entier |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/admin/procedures`
**Crée une démarche**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Corps de requête** — `ProcedureRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `serviceId` | UUID | oui |  |
| `title` | chaîne |  | max 255 car. |
| `description` | chaîne |  | non vide |
| `conditions` | chaîne |  | non vide |
| `cost` | entier |  |  |
| `costCurrency` | chaîne |  | min 3 car., max 3 car. |
| `place` | chaîne |  | max 500 car. |
| `additionalInfo` | chaîne |  |  |
| `processingDays` | entier |  |  |
| `requiredDocuments` | tableau de objet RequiredDocumentRequest |  |  |
| `requiredDocuments[].label` | chaîne |  | max 255 car. |
| `requiredDocuments[].displayOrder` | entier |  |  |


**Réponses**

- **`201`** — Démarche créée (en-tête `Location` renseigné) → `ProcedureResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `serviceId` | UUID |  |  |
| `serviceName` | chaîne |  |  |
| `title` | chaîne |  |  |
| `description` | chaîne |  |  |
| `conditions` | chaîne |  |  |
| `cost` | entier |  |  |
| `costCurrency` | chaîne |  |  |
| `place` | chaîne |  |  |
| `additionalInfo` | chaîne |  |  |
| `processingDays` | entier |  |  |
| `active` | booléen |  |  |
| `requiredDocuments` | tableau de objet RequiredDocumentResponse |  |  |
| `requiredDocuments[].id` | UUID |  |  |
| `requiredDocuments[].label` | chaîne |  |  |
| `requiredDocuments[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/admin/procedures/{id}`
**Détail d'une démarche**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `ProcedureResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `serviceId` | UUID |  |  |
| `serviceName` | chaîne |  |  |
| `title` | chaîne |  |  |
| `description` | chaîne |  |  |
| `conditions` | chaîne |  |  |
| `cost` | entier |  |  |
| `costCurrency` | chaîne |  |  |
| `place` | chaîne |  |  |
| `additionalInfo` | chaîne |  |  |
| `processingDays` | entier |  |  |
| `active` | booléen |  |  |
| `requiredDocuments` | tableau de objet RequiredDocumentResponse |  |  |
| `requiredDocuments[].id` | UUID |  |  |
| `requiredDocuments[].label` | chaîne |  |  |
| `requiredDocuments[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/procedures/{id}`
**Modifie une démarche**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `ProcedureRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `serviceId` | UUID | oui |  |
| `title` | chaîne |  | max 255 car. |
| `description` | chaîne |  | non vide |
| `conditions` | chaîne |  | non vide |
| `cost` | entier |  |  |
| `costCurrency` | chaîne |  | min 3 car., max 3 car. |
| `place` | chaîne |  | max 500 car. |
| `additionalInfo` | chaîne |  |  |
| `processingDays` | entier |  |  |
| `requiredDocuments` | tableau de objet RequiredDocumentRequest |  |  |
| `requiredDocuments[].label` | chaîne |  | max 255 car. |
| `requiredDocuments[].displayOrder` | entier |  |  |


**Réponses**

- **`200`** — OK → `ProcedureResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `serviceId` | UUID |  |  |
| `serviceName` | chaîne |  |  |
| `title` | chaîne |  |  |
| `description` | chaîne |  |  |
| `conditions` | chaîne |  |  |
| `cost` | entier |  |  |
| `costCurrency` | chaîne |  |  |
| `place` | chaîne |  |  |
| `additionalInfo` | chaîne |  |  |
| `processingDays` | entier |  |  |
| `active` | booléen |  |  |
| `requiredDocuments` | tableau de objet RequiredDocumentResponse |  |  |
| `requiredDocuments[].id` | UUID |  |  |
| `requiredDocuments[].label` | chaîne |  |  |
| `requiredDocuments[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `DELETE` `/api/v1/admin/procedures/{id}`
**Supprime une démarche**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`204`** — No Content
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/procedures/{id}/status`
**Change le statut d'une démarche**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `ProcedureStatusRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `active` | booléen | oui |  |


**Réponses**

- **`200`** — OK → `ProcedureResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `serviceId` | UUID |  |  |
| `serviceName` | chaîne |  |  |
| `title` | chaîne |  |  |
| `description` | chaîne |  |  |
| `conditions` | chaîne |  |  |
| `cost` | entier |  |  |
| `costCurrency` | chaîne |  |  |
| `place` | chaîne |  |  |
| `additionalInfo` | chaîne |  |  |
| `processingDays` | entier |  |  |
| `active` | booléen |  |  |
| `requiredDocuments` | tableau de objet RequiredDocumentResponse |  |  |
| `requiredDocuments[].id` | UUID |  |  |
| `requiredDocuments[].label` | chaîne |  |  |
| `requiredDocuments[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### Admin · Formulaires

### `GET` `/api/v1/admin/procedures/{procedureId}/form`
**Récupère le formulaire d'une démarche**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `procedureId` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `FormBuilderResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `procedureId` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `active` | booléen |  |  |
| `sections` | tableau de objet FormSectionResponse |  |  |
| `sections[].id` | UUID |  |  |
| `sections[].title` | chaîne |  |  |
| `sections[].description` | chaîne |  |  |
| `sections[].displayOrder` | entier |  |  |
| `sections[].fields` | tableau de objet FormFieldResponse |  |  |
| `sections[].fields[].id` | UUID |  |  |
| `sections[].fields[].name` | chaîne |  |  |
| `sections[].fields[].label` | chaîne |  |  |
| `sections[].fields[].fieldType` | énumération (TEXT, TEXTAREA, NUMBER, DATE, EMAIL, PHONE, SELECT, RADIO, CHECKBOX) |  |  |
| `sections[].fields[].placeholder` | chaîne |  |  |
| `sections[].fields[].required` | booléen |  |  |
| `sections[].fields[].displayOrder` | entier |  |  |
| `sections[].fields[].defaultValue` | chaîne |  |  |
| `sections[].fields[].helpText` | chaîne |  |  |
| `sections[].fields[].validationRegex` | chaîne |  |  |
| `sections[].fields[].validationMessage` | chaîne |  |  |
| `sections[].fields[].options` | tableau de objet FieldOptionResponse |  |  |
| `sections[].fields[].options[].id` | UUID |  |  |
| `sections[].fields[].options[].label` | chaîne |  |  |
| `sections[].fields[].options[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/admin/procedures/{procedureId}/form`
**Crée le formulaire d'une démarche**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `procedureId` | path | UUID | oui |  |

**Corps de requête** — `FormBuilderRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `name` | chaîne |  | max 255 car. |
| `description` | chaîne |  |  |
| `sections` | tableau de objet FormSectionRequest |  |  |
| `sections[].title` | chaîne |  | max 255 car. |
| `sections[].description` | chaîne |  |  |
| `sections[].displayOrder` | entier |  |  |
| `sections[].fields` | tableau de objet FormFieldRequest |  |  |
| `sections[].fields[].name` | chaîne |  | max 100 car. |
| `sections[].fields[].label` | chaîne |  | max 255 car. |
| `sections[].fields[].fieldType` | énumération (TEXT, TEXTAREA, NUMBER, DATE, EMAIL, PHONE, SELECT, RADIO, CHECKBOX) | oui |  |
| `sections[].fields[].placeholder` | chaîne |  | max 255 car. |
| `sections[].fields[].required` | booléen |  |  |
| `sections[].fields[].displayOrder` | entier |  |  |
| `sections[].fields[].defaultValue` | chaîne |  | max 500 car. |
| `sections[].fields[].helpText` | chaîne |  |  |
| `sections[].fields[].validationRegex` | chaîne |  | max 500 car. |
| `sections[].fields[].validationMessage` | chaîne |  | max 255 car. |
| `sections[].fields[].options` | tableau de objet FieldOptionRequest |  |  |
| `sections[].fields[].options[].label` | chaîne |  | max 255 car. |
| `sections[].fields[].options[].displayOrder` | entier |  |  |


**Réponses**

- **`201`** — Formulaire créé (en-tête `Location` renseigné) → `FormBuilderResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `procedureId` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `active` | booléen |  |  |
| `sections` | tableau de objet FormSectionResponse |  |  |
| `sections[].id` | UUID |  |  |
| `sections[].title` | chaîne |  |  |
| `sections[].description` | chaîne |  |  |
| `sections[].displayOrder` | entier |  |  |
| `sections[].fields` | tableau de objet FormFieldResponse |  |  |
| `sections[].fields[].id` | UUID |  |  |
| `sections[].fields[].name` | chaîne |  |  |
| `sections[].fields[].label` | chaîne |  |  |
| `sections[].fields[].fieldType` | énumération (TEXT, TEXTAREA, NUMBER, DATE, EMAIL, PHONE, SELECT, RADIO, CHECKBOX) |  |  |
| `sections[].fields[].placeholder` | chaîne |  |  |
| `sections[].fields[].required` | booléen |  |  |
| `sections[].fields[].displayOrder` | entier |  |  |
| `sections[].fields[].defaultValue` | chaîne |  |  |
| `sections[].fields[].helpText` | chaîne |  |  |
| `sections[].fields[].validationRegex` | chaîne |  |  |
| `sections[].fields[].validationMessage` | chaîne |  |  |
| `sections[].fields[].options` | tableau de objet FieldOptionResponse |  |  |
| `sections[].fields[].options[].id` | UUID |  |  |
| `sections[].fields[].options[].label` | chaîne |  |  |
| `sections[].fields[].options[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/procedures/{procedureId}/form`
**Remplace le formulaire d'une démarche**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `procedureId` | path | UUID | oui |  |

**Corps de requête** — `FormBuilderRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `name` | chaîne |  | max 255 car. |
| `description` | chaîne |  |  |
| `sections` | tableau de objet FormSectionRequest |  |  |
| `sections[].title` | chaîne |  | max 255 car. |
| `sections[].description` | chaîne |  |  |
| `sections[].displayOrder` | entier |  |  |
| `sections[].fields` | tableau de objet FormFieldRequest |  |  |
| `sections[].fields[].name` | chaîne |  | max 100 car. |
| `sections[].fields[].label` | chaîne |  | max 255 car. |
| `sections[].fields[].fieldType` | énumération (TEXT, TEXTAREA, NUMBER, DATE, EMAIL, PHONE, SELECT, RADIO, CHECKBOX) | oui |  |
| `sections[].fields[].placeholder` | chaîne |  | max 255 car. |
| `sections[].fields[].required` | booléen |  |  |
| `sections[].fields[].displayOrder` | entier |  |  |
| `sections[].fields[].defaultValue` | chaîne |  | max 500 car. |
| `sections[].fields[].helpText` | chaîne |  |  |
| `sections[].fields[].validationRegex` | chaîne |  | max 500 car. |
| `sections[].fields[].validationMessage` | chaîne |  | max 255 car. |
| `sections[].fields[].options` | tableau de objet FieldOptionRequest |  |  |
| `sections[].fields[].options[].label` | chaîne |  | max 255 car. |
| `sections[].fields[].options[].displayOrder` | entier |  |  |


**Réponses**

- **`200`** — OK → `FormBuilderResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `procedureId` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `active` | booléen |  |  |
| `sections` | tableau de objet FormSectionResponse |  |  |
| `sections[].id` | UUID |  |  |
| `sections[].title` | chaîne |  |  |
| `sections[].description` | chaîne |  |  |
| `sections[].displayOrder` | entier |  |  |
| `sections[].fields` | tableau de objet FormFieldResponse |  |  |
| `sections[].fields[].id` | UUID |  |  |
| `sections[].fields[].name` | chaîne |  |  |
| `sections[].fields[].label` | chaîne |  |  |
| `sections[].fields[].fieldType` | énumération (TEXT, TEXTAREA, NUMBER, DATE, EMAIL, PHONE, SELECT, RADIO, CHECKBOX) |  |  |
| `sections[].fields[].placeholder` | chaîne |  |  |
| `sections[].fields[].required` | booléen |  |  |
| `sections[].fields[].displayOrder` | entier |  |  |
| `sections[].fields[].defaultValue` | chaîne |  |  |
| `sections[].fields[].helpText` | chaîne |  |  |
| `sections[].fields[].validationRegex` | chaîne |  |  |
| `sections[].fields[].validationMessage` | chaîne |  |  |
| `sections[].fields[].options` | tableau de objet FieldOptionResponse |  |  |
| `sections[].fields[].options[].id` | UUID |  |  |
| `sections[].fields[].options[].label` | chaîne |  |  |
| `sections[].fields[].options[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `DELETE` `/api/v1/admin/procedures/{procedureId}/form`
**Supprime le formulaire d'une démarche**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `procedureId` | path | UUID | oui |  |

**Réponses**

- **`204`** — No Content
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/procedures/{procedureId}/form/status`
**Change le statut du formulaire**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `procedureId` | path | UUID | oui |  |

**Corps de requête** — `FormStatusRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `active` | booléen | oui |  |


**Réponses**

- **`200`** — OK → `FormBuilderResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `procedureId` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `active` | booléen |  |  |
| `sections` | tableau de objet FormSectionResponse |  |  |
| `sections[].id` | UUID |  |  |
| `sections[].title` | chaîne |  |  |
| `sections[].description` | chaîne |  |  |
| `sections[].displayOrder` | entier |  |  |
| `sections[].fields` | tableau de objet FormFieldResponse |  |  |
| `sections[].fields[].id` | UUID |  |  |
| `sections[].fields[].name` | chaîne |  |  |
| `sections[].fields[].label` | chaîne |  |  |
| `sections[].fields[].fieldType` | énumération (TEXT, TEXTAREA, NUMBER, DATE, EMAIL, PHONE, SELECT, RADIO, CHECKBOX) |  |  |
| `sections[].fields[].placeholder` | chaîne |  |  |
| `sections[].fields[].required` | booléen |  |  |
| `sections[].fields[].displayOrder` | entier |  |  |
| `sections[].fields[].defaultValue` | chaîne |  |  |
| `sections[].fields[].helpText` | chaîne |  |  |
| `sections[].fields[].validationRegex` | chaîne |  |  |
| `sections[].fields[].validationMessage` | chaîne |  |  |
| `sections[].fields[].options` | tableau de objet FieldOptionResponse |  |  |
| `sections[].fields[].options[].id` | UUID |  |  |
| `sections[].fields[].options[].label` | chaîne |  |  |
| `sections[].fields[].options[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### Admin · Base de connaissances IA

### `GET` `/api/v1/admin/knowledge-documents`
**Liste les documents de la base de connaissances**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `q` | query | chaîne |  |  |
| `category` | query | chaîne |  |  |
| `page` | query | entier |  |  |
| `size` | query | entier |  |  |
| `sort` | query | chaîne |  |  |

**Réponses**

- **`200`** — OK → `PageResponseDocumentResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `content` | tableau de objet DocumentResponse |  |  |
| `content[].id` | UUID |  |  |
| `content[].organizationId` | UUID |  |  |
| `content[].title` | chaîne |  |  |
| `content[].fileUrl` | chaîne |  |  |
| `content[].fileSizeBytes` | entier long |  |  |
| `content[].source` | chaîne |  |  |
| `content[].category` | chaîne |  |  |
| `content[].active` | booléen |  |  |
| `content[].sourceProcedureId` | UUID |  |  |
| `content[].createdAt` | date-heure (ISO 8601) |  |  |
| `content[].updatedAt` | date-heure (ISO 8601) |  |  |
| `page` | entier |  |  |
| `size` | entier |  |  |
| `totalElements` | entier long |  |  |
| `totalPages` | entier |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/admin/knowledge-documents`
**Ajoute un document (texte collé)**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Corps de requête** — `DocumentTextRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `title` | chaîne |  | max 500 car. |
| `content` | chaîne |  | non vide |
| `source` | chaîne |  | max 500 car. |
| `category` | chaîne |  | max 100 car. |


**Réponses**

- **`201`** — Document créé (texte stocké en .txt) ; service IA notifié de façon synchrone (échec d'indexation renvoyé dans cette même réponse) → `DocumentResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `title` | chaîne |  |  |
| `fileUrl` | chaîne |  |  |
| `fileSizeBytes` | entier long |  |  |
| `source` | chaîne |  |  |
| `category` | chaîne |  |  |
| `active` | booléen |  |  |
| `sourceProcedureId` | UUID |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/admin/knowledge-documents/upload`
**Ajoute un document (fichier uploadé)**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `title` | query | chaîne | oui |  |
| `source` | query | chaîne |  |  |
| `category` | query | chaîne |  |  |

**Corps de requête** — `(inline)`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `file` | fichier | oui |  |


**Réponses**

- **`201`** — Fichier accepté et stocké tel quel ; service IA notifié de façon synchrone (échec d'indexation renvoyé dans cette même réponse) → `DocumentResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `title` | chaîne |  |  |
| `fileUrl` | chaîne |  |  |
| `fileSizeBytes` | entier long |  |  |
| `source` | chaîne |  |  |
| `category` | chaîne |  |  |
| `active` | booléen |  |  |
| `sourceProcedureId` | UUID |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/admin/knowledge-documents/{id}`
**Détail d'un document**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `DocumentResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `title` | chaîne |  |  |
| `fileUrl` | chaîne |  |  |
| `fileSizeBytes` | entier long |  |  |
| `source` | chaîne |  |  |
| `category` | chaîne |  |  |
| `active` | booléen |  |  |
| `sourceProcedureId` | UUID |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/knowledge-documents/{id}`
**Modifie un document**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `DocumentUpdateRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `title` | chaîne |  | max 500 car. |
| `source` | chaîne |  | max 500 car. |
| `category` | chaîne |  | max 100 car. |


**Réponses**

- **`200`** — OK → `DocumentResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `title` | chaîne |  |  |
| `fileUrl` | chaîne |  |  |
| `fileSizeBytes` | entier long |  |  |
| `source` | chaîne |  |  |
| `category` | chaîne |  |  |
| `active` | booléen |  |  |
| `sourceProcedureId` | UUID |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `DELETE` `/api/v1/admin/knowledge-documents/{id}`
**Supprime un document**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`204`** — No Content
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/knowledge-documents/{id}/status`
**Active/désactive un document**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `DocumentStatusRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `active` | booléen | oui |  |


**Réponses**

- **`200`** — OK → `DocumentResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `title` | chaîne |  |  |
| `fileUrl` | chaîne |  |  |
| `fileSizeBytes` | entier long |  |  |
| `source` | chaîne |  |  |
| `category` | chaîne |  |  |
| `active` | booléen |  |  |
| `sourceProcedureId` | UUID |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### Admin · Départements

### `GET` `/api/v1/admin/departments`
**Liste les départements**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Réponses**

- **`200`** — OK

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `[]` | objet DepartmentResponse |  |  |
| `[].id` | UUID |  |  |
| `[].organizationId` | UUID |  |  |
| `[].name` | chaîne |  |  |
| `[].description` | chaîne |  |  |
| `[].active` | booléen |  |  |
| `[].createdAt` | date-heure (ISO 8601) |  |  |
| `[].updatedAt` | date-heure (ISO 8601) |  |  |

- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/admin/departments`
**Crée un département**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Corps de requête** — `DepartmentRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `name` | chaîne |  | max 255 car. |
| `description` | chaîne |  |  |


**Réponses**

- **`201`** — Département créé (en-tête `Location` renseigné) → `DepartmentResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/admin/departments/{id}`
**Détail d'un département**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `DepartmentResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/departments/{id}`
**Modifie un département**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `DepartmentRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `name` | chaîne |  | max 255 car. |
| `description` | chaîne |  |  |


**Réponses**

- **`200`** — OK → `DepartmentResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `DELETE` `/api/v1/admin/departments/{id}`
**Supprime un département**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`204`** — No Content
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/departments/{id}/status`
**Change le statut d'un département**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `ActiveStatusRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `active` | booléen | oui |  |


**Réponses**

- **`200`** — OK → `DepartmentResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### Admin · Services

### `GET` `/api/v1/admin/services`
**Liste les services**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `departmentId` | query | UUID |  |  |

**Réponses**

- **`200`** — OK

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `[]` | objet ServiceDeskResponse |  |  |
| `[].id` | UUID |  |  |
| `[].departmentId` | UUID |  |  |
| `[].departmentName` | chaîne |  |  |
| `[].name` | chaîne |  |  |
| `[].description` | chaîne |  |  |
| `[].location` | chaîne |  |  |
| `[].phone` | chaîne |  |  |
| `[].openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `[].openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `[].openingHours[].opensAt` | chaîne |  |  |
| `[].openingHours[].closesAt` | chaîne |  |  |
| `[].active` | booléen |  |  |
| `[].createdAt` | date-heure (ISO 8601) |  |  |
| `[].updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/admin/services`
**Crée un service**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Corps de requête** — `ServiceDeskRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `departmentId` | UUID | oui |  |
| `name` | chaîne |  | max 255 car. |
| `description` | chaîne |  |  |
| `location` | chaîne |  | max 500 car. |
| `phone` | chaîne |  | max 20 car. |
| `openingHours` | tableau de objet OpeningHoursRequest |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) | oui |  |
| `openingHours[].opensAt` | chaîne | oui |  |
| `openingHours[].closesAt` | chaîne | oui |  |


**Réponses**

- **`201`** — Service créé (en-tête `Location` renseigné) → `ServiceDeskResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `departmentName` | chaîne |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `location` | chaîne |  |  |
| `phone` | chaîne |  |  |
| `openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `openingHours[].opensAt` | chaîne |  |  |
| `openingHours[].closesAt` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/admin/services/{id}`
**Détail d'un service**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `ServiceDeskResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `departmentName` | chaîne |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `location` | chaîne |  |  |
| `phone` | chaîne |  |  |
| `openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `openingHours[].opensAt` | chaîne |  |  |
| `openingHours[].closesAt` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/services/{id}`
**Modifie un service**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `ServiceDeskRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `departmentId` | UUID | oui |  |
| `name` | chaîne |  | max 255 car. |
| `description` | chaîne |  |  |
| `location` | chaîne |  | max 500 car. |
| `phone` | chaîne |  | max 20 car. |
| `openingHours` | tableau de objet OpeningHoursRequest |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) | oui |  |
| `openingHours[].opensAt` | chaîne | oui |  |
| `openingHours[].closesAt` | chaîne | oui |  |


**Réponses**

- **`200`** — OK → `ServiceDeskResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `departmentName` | chaîne |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `location` | chaîne |  |  |
| `phone` | chaîne |  |  |
| `openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `openingHours[].opensAt` | chaîne |  |  |
| `openingHours[].closesAt` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `DELETE` `/api/v1/admin/services/{id}`
**Supprime un service**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`204`** — No Content
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/services/{id}/status`
**Change le statut d'un service**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `ActiveStatusRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `active` | booléen | oui |  |


**Réponses**

- **`200`** — OK → `ServiceDeskResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `departmentName` | chaîne |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `location` | chaîne |  |  |
| `phone` | chaîne |  |  |
| `openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `openingHours[].opensAt` | chaîne |  |  |
| `openingHours[].closesAt` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### Admin · Bornes

### `GET` `/api/v1/admin/bornes`
**Liste les bornes de l'organisation**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Réponses**

- **`200`** — OK

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `[]` | objet BorneResponse |  |  |
| `[].id` | UUID |  |  |
| `[].organizationId` | UUID |  |  |
| `[].departmentId` | UUID |  |  |
| `[].departmentName` | chaîne |  |  |
| `[].identifier` | chaîne |  |  |
| `[].location` | chaîne |  |  |
| `[].status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) |  |  |
| `[].createdAt` | date-heure (ISO 8601) |  |  |
| `[].updatedAt` | date-heure (ISO 8601) |  |  |

- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/admin/bornes/{id}`
**Détail d'une borne**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `BorneResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `departmentName` | chaîne |  |  |
| `identifier` | chaîne |  |  |
| `location` | chaîne |  |  |
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/admin/bornes/{id}/status`
**Change le statut d'une borne**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `BorneStatusRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) | oui |  |


**Réponses**

- **`200`** — OK → `BorneResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `departmentName` | chaîne |  |  |
| `identifier` | chaîne |  |  |
| `location` | chaîne |  |  |
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### Admin · Statistiques

### `GET` `/api/v1/admin/statistics`
**Statistiques de l'organisation**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Réponses**

- **`200`** — OK → `AdminStatisticsResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `departmentCount` | entier long |  |  |
| `serviceCount` | entier long |  |  |
| `procedureCount` | entier long |  |  |
| `activeProcedureCount` | entier long |  |  |
| `borneActiveCount` | entier long |  |  |
| `borneMaintenanceCount` | entier long |  |  |
| `borneOutOfServiceCount` | entier long |  |  |
| `knowledgeDocumentCount` | entier long |  |  |
| `conversationCount` | entier long |  |  |
| `messageCount` | entier long |  |  |

- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### Admin · Abonnement

### `GET` `/api/v1/admin/subscription`
**Abonnement courant de l'organisation**

- **Authentification** : JWT Clerk — `ADMIN_ORGANISATION`

**Réponses**

- **`200`** — OK → `AdminSubscriptionResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `subscriptionId` | UUID |  |  |
| `startDate` | date (AAAA-MM-JJ) |  |  |
| `status` | énumération (ACTIVE, REMPLACEE, ANNULEE) |  |  |
| `plan` | objet PlanResponse |  |  |
| `plan.id` | UUID |  |  |
| `plan.name` | chaîne |  |  |
| `plan.description` | chaîne |  |  |
| `plan.amount` | entier |  |  |
| `plan.currency` | chaîne |  |  |
| `plan.billingPeriod` | énumération (MOIS, TRIMESTRE, ANNEE) |  |  |
| `plan.maxAdmins` | entier |  |  |
| `plan.maxBornes` | entier |  |  |
| `plan.maxAiDocuments` | entier |  |  |
| `plan.active` | booléen |  |  |
| `plan.features` | tableau de objet PlanFeatureResponse |  |  |
| `plan.features[].id` | UUID |  |  |
| `plan.features[].label` | chaîne |  |  |
| `plan.features[].displayOrder` | entier |  |  |
| `plan.createdAt` | date-heure (ISO 8601) |  |  |
| `plan.updatedAt` | date-heure (ISO 8601) |  |  |

- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

## 3. SuperAdmin — JWT Clerk requis, `public_metadata.role=SUPER_ADMIN` (scope global)

### SuperAdmin · Organisations

### `GET` `/api/v1/superadmin/organizations`
**Liste les organisations**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Réponses**

- **`200`** — OK

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `[]` | objet OrganizationResponse |  |  |
| `[].id` | UUID |  |  |
| `[].clerkOrgId` | chaîne |  |  |
| `[].name` | chaîne |  |  |
| `[].type` | chaîne |  |  |
| `[].ninea` | chaîne |  |  |
| `[].address` | chaîne |  |  |
| `[].phone` | chaîne |  |  |
| `[].email` | chaîne |  |  |
| `[].logoUrl` | chaîne |  |  |
| `[].openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `[].openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `[].openingHours[].opensAt` | chaîne |  |  |
| `[].openingHours[].closesAt` | chaîne |  |  |
| `[].plan` | objet PlanRef |  |  |
| `[].plan.id` | UUID |  |  |
| `[].plan.name` | chaîne |  |  |
| `[].active` | booléen |  |  |
| `[].createdAt` | date-heure (ISO 8601) |  |  |
| `[].updatedAt` | date-heure (ISO 8601) |  |  |

- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/superadmin/organizations`
**Crée une organisation**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Corps de requête** — `CreateOrganizationRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `name` | chaîne |  | max 255 car. |
| `type` | chaîne |  | max 30 car. |
| `ninea` | chaîne |  | max 15 car. |
| `address` | chaîne |  | non vide |
| `phone` | chaîne |  | max 20 car. |
| `email` | chaîne |  | max 255 car. |
| `logoUrl` | chaîne |  | max 500 car. |
| `openingHours` | tableau de objet OpeningHoursRequest |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) | oui |  |
| `openingHours[].opensAt` | chaîne | oui |  |
| `openingHours[].closesAt` | chaîne | oui |  |
| `planId` | UUID | oui |  |
| `adminEmail` | chaîne |  | max 255 car. |


**Réponses**

- **`201`** — Organisation créée, Organization Clerk provisionnée et 1ᵉʳ admin invité par email → `OrganizationResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `clerkOrgId` | chaîne |  |  |
| `name` | chaîne |  |  |
| `type` | chaîne |  |  |
| `ninea` | chaîne |  |  |
| `address` | chaîne |  |  |
| `phone` | chaîne |  |  |
| `email` | chaîne |  |  |
| `logoUrl` | chaîne |  |  |
| `openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `openingHours[].opensAt` | chaîne |  |  |
| `openingHours[].closesAt` | chaîne |  |  |
| `plan` | objet PlanRef |  |  |
| `plan.id` | UUID |  |  |
| `plan.name` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/superadmin/organizations/{id}`
**Détail d'une organisation**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `OrganizationResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `clerkOrgId` | chaîne |  |  |
| `name` | chaîne |  |  |
| `type` | chaîne |  |  |
| `ninea` | chaîne |  |  |
| `address` | chaîne |  |  |
| `phone` | chaîne |  |  |
| `email` | chaîne |  |  |
| `logoUrl` | chaîne |  |  |
| `openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `openingHours[].opensAt` | chaîne |  |  |
| `openingHours[].closesAt` | chaîne |  |  |
| `plan` | objet PlanRef |  |  |
| `plan.id` | UUID |  |  |
| `plan.name` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/superadmin/organizations/{id}`
**Modifie une organisation**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `UpdateOrganizationRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `name` | chaîne |  | max 255 car. |
| `type` | chaîne |  | max 30 car. |
| `ninea` | chaîne |  | max 15 car. |
| `address` | chaîne |  | non vide |
| `phone` | chaîne |  | max 20 car. |
| `email` | chaîne |  | max 255 car. |
| `logoUrl` | chaîne |  | max 500 car. |
| `openingHours` | tableau de objet OpeningHoursRequest |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) | oui |  |
| `openingHours[].opensAt` | chaîne | oui |  |
| `openingHours[].closesAt` | chaîne | oui |  |


**Réponses**

- **`200`** — OK → `OrganizationResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `clerkOrgId` | chaîne |  |  |
| `name` | chaîne |  |  |
| `type` | chaîne |  |  |
| `ninea` | chaîne |  |  |
| `address` | chaîne |  |  |
| `phone` | chaîne |  |  |
| `email` | chaîne |  |  |
| `logoUrl` | chaîne |  |  |
| `openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `openingHours[].opensAt` | chaîne |  |  |
| `openingHours[].closesAt` | chaîne |  |  |
| `plan` | objet PlanRef |  |  |
| `plan.id` | UUID |  |  |
| `plan.name` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/superadmin/organizations/{id}/admins`
**Invite un administrateur**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `InviteAdminRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `email` | chaîne |  | max 255 car. |


**Réponses**

- **`202`** — Accepted
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `DELETE` `/api/v1/superadmin/organizations/{id}/admins/{clerkUserId}`
**Retire un administrateur**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |
| `clerkUserId` | path | chaîne | oui |  |

**Réponses**

- **`204`** — No Content
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/superadmin/organizations/{id}/members`
**Liste les membres Clerk d'une organisation**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `[]` | objet MemberResponse |  |  |
| `[].clerkUserId` | chaîne |  |  |
| `[].firstName` | chaîne |  |  |
| `[].lastName` | chaîne |  |  |
| `[].identifier` | chaîne |  |  |
| `[].role` | chaîne |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/superadmin/organizations/{id}/plan`
**Change le plan d'une organisation**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `ChangePlanRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `planId` | UUID | oui |  |


**Réponses**

- **`200`** — OK → `OrganizationResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `clerkOrgId` | chaîne |  |  |
| `name` | chaîne |  |  |
| `type` | chaîne |  |  |
| `ninea` | chaîne |  |  |
| `address` | chaîne |  |  |
| `phone` | chaîne |  |  |
| `email` | chaîne |  |  |
| `logoUrl` | chaîne |  |  |
| `openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `openingHours[].opensAt` | chaîne |  |  |
| `openingHours[].closesAt` | chaîne |  |  |
| `plan` | objet PlanRef |  |  |
| `plan.id` | UUID |  |  |
| `plan.name` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/superadmin/organizations/{id}/status`
**Change le statut d'une organisation**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `OrganizationStatusRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `active` | booléen | oui |  |


**Réponses**

- **`200`** — OK → `OrganizationResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `clerkOrgId` | chaîne |  |  |
| `name` | chaîne |  |  |
| `type` | chaîne |  |  |
| `ninea` | chaîne |  |  |
| `address` | chaîne |  |  |
| `phone` | chaîne |  |  |
| `email` | chaîne |  |  |
| `logoUrl` | chaîne |  |  |
| `openingHours` | tableau de objet OpeningHoursResponse |  |  |
| `openingHours[].dayOfWeek` | énumération (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY) |  |  |
| `openingHours[].opensAt` | chaîne |  |  |
| `openingHours[].closesAt` | chaîne |  |  |
| `plan` | objet PlanRef |  |  |
| `plan.id` | UUID |  |  |
| `plan.name` | chaîne |  |  |
| `active` | booléen |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`502`** — Un service en amont (IA, stockage objet ou Clerk) a échoué. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### SuperAdmin · Plans

### `GET` `/api/v1/superadmin/plans`
**Liste les plans**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `activeOnly` | query | booléen |  |  |

**Réponses**

- **`200`** — OK

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `[]` | objet PlanResponse |  |  |
| `[].id` | UUID |  |  |
| `[].name` | chaîne |  |  |
| `[].description` | chaîne |  |  |
| `[].amount` | entier |  |  |
| `[].currency` | chaîne |  |  |
| `[].billingPeriod` | énumération (MOIS, TRIMESTRE, ANNEE) |  |  |
| `[].maxAdmins` | entier |  |  |
| `[].maxBornes` | entier |  |  |
| `[].maxAiDocuments` | entier |  |  |
| `[].active` | booléen |  |  |
| `[].features` | tableau de objet PlanFeatureResponse |  |  |
| `[].features[].id` | UUID |  |  |
| `[].features[].label` | chaîne |  |  |
| `[].features[].displayOrder` | entier |  |  |
| `[].createdAt` | date-heure (ISO 8601) |  |  |
| `[].updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/superadmin/plans`
**Crée un plan**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Corps de requête** — `PlanRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `name` | chaîne |  | max 100 car. |
| `description` | chaîne |  |  |
| `amount` | entier |  |  |
| `currency` | chaîne |  | min 3 car., max 3 car. |
| `billingPeriod` | énumération (MOIS, TRIMESTRE, ANNEE) | oui |  |
| `maxAdmins` | entier |  |  |
| `maxBornes` | entier |  |  |
| `maxAiDocuments` | entier |  |  |
| `features` | tableau de objet PlanFeatureRequest |  |  |
| `features[].label` | chaîne |  | max 255 car. |
| `features[].displayOrder` | entier |  |  |


**Réponses**

- **`201`** — Plan créé (en-tête `Location` renseigné) → `PlanResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `amount` | entier |  |  |
| `currency` | chaîne |  |  |
| `billingPeriod` | énumération (MOIS, TRIMESTRE, ANNEE) |  |  |
| `maxAdmins` | entier |  |  |
| `maxBornes` | entier |  |  |
| `maxAiDocuments` | entier |  |  |
| `active` | booléen |  |  |
| `features` | tableau de objet PlanFeatureResponse |  |  |
| `features[].id` | UUID |  |  |
| `features[].label` | chaîne |  |  |
| `features[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/superadmin/plans/{id}`
**Détail d'un plan**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `PlanResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `amount` | entier |  |  |
| `currency` | chaîne |  |  |
| `billingPeriod` | énumération (MOIS, TRIMESTRE, ANNEE) |  |  |
| `maxAdmins` | entier |  |  |
| `maxBornes` | entier |  |  |
| `maxAiDocuments` | entier |  |  |
| `active` | booléen |  |  |
| `features` | tableau de objet PlanFeatureResponse |  |  |
| `features[].id` | UUID |  |  |
| `features[].label` | chaîne |  |  |
| `features[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/superadmin/plans/{id}`
**Modifie un plan**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `PlanRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `name` | chaîne |  | max 100 car. |
| `description` | chaîne |  |  |
| `amount` | entier |  |  |
| `currency` | chaîne |  | min 3 car., max 3 car. |
| `billingPeriod` | énumération (MOIS, TRIMESTRE, ANNEE) | oui |  |
| `maxAdmins` | entier |  |  |
| `maxBornes` | entier |  |  |
| `maxAiDocuments` | entier |  |  |
| `features` | tableau de objet PlanFeatureRequest |  |  |
| `features[].label` | chaîne |  | max 255 car. |
| `features[].displayOrder` | entier |  |  |


**Réponses**

- **`200`** — OK → `PlanResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `amount` | entier |  |  |
| `currency` | chaîne |  |  |
| `billingPeriod` | énumération (MOIS, TRIMESTRE, ANNEE) |  |  |
| `maxAdmins` | entier |  |  |
| `maxBornes` | entier |  |  |
| `maxAiDocuments` | entier |  |  |
| `active` | booléen |  |  |
| `features` | tableau de objet PlanFeatureResponse |  |  |
| `features[].id` | UUID |  |  |
| `features[].label` | chaîne |  |  |
| `features[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `DELETE` `/api/v1/superadmin/plans/{id}`
**Supprime un plan**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/superadmin/plans/{id}/status`
**Change le statut d'un plan**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `PlanStatusRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `active` | booléen | oui |  |


**Réponses**

- **`200`** — OK → `PlanResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `name` | chaîne |  |  |
| `description` | chaîne |  |  |
| `amount` | entier |  |  |
| `currency` | chaîne |  |  |
| `billingPeriod` | énumération (MOIS, TRIMESTRE, ANNEE) |  |  |
| `maxAdmins` | entier |  |  |
| `maxBornes` | entier |  |  |
| `maxAiDocuments` | entier |  |  |
| `active` | booléen |  |  |
| `features` | tableau de objet PlanFeatureResponse |  |  |
| `features[].id` | UUID |  |  |
| `features[].label` | chaîne |  |  |
| `features[].displayOrder` | entier |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### SuperAdmin · Bornes

### `GET` `/api/v1/superadmin/bornes`
**Liste toutes les bornes**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `organizationId` | query | UUID |  |  |

**Réponses**

- **`200`** — OK

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `[]` | objet BorneResponse |  |  |
| `[].id` | UUID |  |  |
| `[].organizationId` | UUID |  |  |
| `[].departmentId` | UUID |  |  |
| `[].departmentName` | chaîne |  |  |
| `[].identifier` | chaîne |  |  |
| `[].location` | chaîne |  |  |
| `[].status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) |  |  |
| `[].createdAt` | date-heure (ISO 8601) |  |  |
| `[].updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `POST` `/api/v1/superadmin/bornes`
**Crée une borne**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Corps de requête** — `BorneRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `organizationId` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `identifier` | chaîne |  | max 100 car. |
| `location` | chaîne |  | max 500 car. |
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) | oui |  |


**Réponses**

- **`201`** — Borne créée (en-tête `Location` renseigné) → `BorneResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `departmentName` | chaîne |  |  |
| `identifier` | chaîne |  |  |
| `location` | chaîne |  |  |
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `GET` `/api/v1/superadmin/bornes/{id}`
**Détail d'une borne**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`200`** — OK → `BorneResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `departmentName` | chaîne |  |  |
| `identifier` | chaîne |  |  |
| `location` | chaîne |  |  |
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/superadmin/bornes/{id}`
**Modifie une borne**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `BorneRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `organizationId` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `identifier` | chaîne |  | max 100 car. |
| `location` | chaîne |  | max 500 car. |
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) | oui |  |


**Réponses**

- **`200`** — OK → `BorneResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `departmentName` | chaîne |  |  |
| `identifier` | chaîne |  |  |
| `location` | chaîne |  |  |
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `DELETE` `/api/v1/superadmin/bornes/{id}`
**Supprime une borne**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Réponses**

- **`204`** — No Content
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

### `PUT` `/api/v1/superadmin/bornes/{id}/status`
**Change le statut d'une borne**

- **Authentification** : JWT Clerk — `SUPER_ADMIN`

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `id` | path | UUID | oui |  |

**Corps de requête** — `BorneStatusRequest` — requis

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) | oui |  |


**Réponses**

- **`200`** — OK → `BorneResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `id` | UUID |  |  |
| `organizationId` | UUID |  |  |
| `departmentId` | UUID |  |  |
| `departmentName` | chaîne |  |  |
| `identifier` | chaîne |  |  |
| `location` | chaîne |  |  |
| `status` | énumération (ACTIVE, MAINTENANCE, HORS_SERVICE) |  |  |
| `createdAt` | date-heure (ISO 8601) |  |  |
| `updatedAt` | date-heure (ISO 8601) |  |  |

- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`401`** — Jeton absent, expiré ou invalide. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`403`** — Rôle insuffisant, ou organisation du jeton non résolue. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`404`** — Ressource introuvable, ou hors du périmètre de l'appelant. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).
- **`409`** — Conflit métier : quota de plan atteint, doublon, ou ressource encore référencée. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

## 4. Hors préfixe `/api/v1`

### Hors préfixe · Hors préfixe

### `GET` `/api/v1/me`
**Profil de l'utilisateur connecté**

- **Authentification** : JWT Clerk — tout rôle connecté

**Réponses**

- **`200`** — OK → `MeResponse`

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `clerkUserId` | chaîne |  |  |
| `email` | chaîne |  |  |
| `firstName` | chaîne |  |  |
| `lastName` | chaîne |  |  |
| `roles` | tableau de chaîne |  |  |
| `clerkOrgId` | chaîne |  |  |
| `organizationId` | UUID |  |  |
| `organizationName` | chaîne |  |  |
| `mirrored` | booléen |  |  |


### `POST` `/webhooks/clerk`
**Webhook Clerk (serveur à serveur, hors Front)**

- **Authentification** : aucune (public)

**Paramètres**

| Nom | Dans | Type | Requis | Description |
|---|---|---|---|---|
| `svix-id` | header | chaîne |  |  |
| `svix-timestamp` | header | chaîne |  |  |
| `svix-signature` | header | chaîne |  |  |

**Corps de requête** — `(inline)`



**Réponses**

- **`200`** — OK
- **`400`** — Requête invalide — `violations[]` détaille les champs en cause. → `ApiError`, voir [Annexe — Schémas communs](#annexe-schémas-communs).

## Annexe — Schémas communs

### `ApiError`

Format uniforme de toute erreur renvoyée par l'API (`GlobalExceptionHandler`), y compris sous `Accept: text/event-stream`.

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `timestamp` | date-heure (ISO 8601) |  |  |
| `status` | entier |  |  |
| `error` | chaîne |  |  |
| `message` | chaîne |  |  |
| `path` | chaîne |  |  |
| `violations` | tableau de objet Violation |  |  |
| `violations[].field` | chaîne |  |  |
| `violations[].message` | chaîne |  |  |


`violations[]` (présent seulement sur 400 de validation) :

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `field` | chaîne |  |  |
| `message` | chaîne |  |  |


---
Généré depuis l'export OpenAPI live du commit `54026bb` (branche `dev`), le 2026-09-24. Le JSON brut (`openapi.json`, importable dans Postman/Insomnia) accompagne ce fichier.