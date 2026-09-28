# TONTOUMA BOT — Architecture C4 (MVP SIMPLIFIÉ — remplace tontouma-bot-c4-DEFINITIVE.md)

**Ce document remplace et annule `tontouma-bot-c4-DEFINITIVE.md`.** Révision déclenchée par le retour du coach (YAGNI sur l'infra, valeur usager avant dashboard admin) + décisions actées ensemble (canal unique WebSocket, synchronisation événementielle sans broker, continuité de session sans Redis, cartographie simplifiée, PWA).

---

## Ce qui change par rapport à la version précédente

1. **Redis supprimé.** Les sessions (borne et transfert vers PWA) vivent dans une table PostgreSQL côté AI Service — accessible par `session_id` depuis n'importe quel appareil, persistante (pas perdue au redémarrage), sans nouvelle brique d'infrastructure.
2. **RabbitMQ et le Worker supprimés.** Les notifications et vérifications d'abonnement deviennent des tâches planifiées (`@Scheduled`) **à l'intérieur** du Backend API — plus de container séparé. L'indexation de documents devient un appel HTTP direct Spring → AI Service (déclenché à l'upload), traité en tâche de fond côté Python (`BackgroundTasks` FastAPI) pour ne jamais bloquer la réponse à l'organisation.
3. **Synchronisation du contenu structuré : événementielle, mais sans broker.** À chaque publication/modification d'un service ou d'une démarche, Spring appelle directement un endpoint interne de l'AI Service (`POST /internal/sync-content`) qui met à jour sa propre copie locale (une table PostgreSQL classique, pas vectorielle). **L'AI Service n'appelle jamais Spring pendant qu'il répond à une question usager** — il lit sa copie locale, toujours à jour, jamais dépendante de la disponibilité de Spring à cet instant précis.
4. **Un seul canal conversationnel : WebSocket**, texte ET voix mêlés (au lieu de SSE pour le texte + WebSocket pour la voix). Le Backend API reste hors de ce canal (architecture par ticket, inchangée).
5. **Cartographie simplifiée** : image de plan statique + points de coordonnées (x, y), pas de navigation interactive temps réel.
6. **PWA** : l'expérience usager n'est plus limitée à la borne physique — même code React, accessible en continu sur mobile, avec transfert de session par QR Code entre borne et téléphone.

---

## NIVEAU 1 — CONTEXT DIAGRAM

Inchangé sur les acteurs. Une nuance : l'**Usager** peut désormais interagir depuis la borne physique **ou** depuis son propre smartphone (PWA), en continuité — ce n'est plus deux parcours séparés, c'est la même session qui peut migrer de l'un à l'autre.

---

## NIVEAU 2 — CONTAINER DIAGRAM (simplifié)

### Boundary : "Tontouma Bot Platform"

**User Experience Web / PWA** `[Container: Next.js, React — installable comme PWA]`
Borne physique (mode kiosque, navigateur plein écran) et smartphone de l'usager : **même code**. Parcours sans IA (Backend API) + chat multimodal (AI Service, direct, WebSocket unique). Affiche audio, texte, cartes de synthèse et plan d'orientation.

**Admin Web / Organization Dashboard** `[Container: Next.js, React]` — inchangés.

**Backend API** `[Container: Spring Boot, Java]`
Cœur métier : organisations, services, démarches, formulaires, abonnements, **cartographie (plans, positions)**. Émet le ticket d'accès signé. Exécute en interne les tâches planifiées (notifications, vérification d'abonnements — plus de Worker séparé). Notifie l'AI Service par appel HTTP direct à chaque changement de contenu publié.

**AI Service** `[Container: Python, FastAPI]`
Exposé directement à Internet : `WS /v1/chat` — canal unique, texte et voix, pipeline STT→RAG→LLM→TTS selon le type d'entrée. Maintient sa propre copie du contenu structuré (synchronisée par Spring) — ne consulte jamais Spring en direct pendant une conversation. Gère lui-même la continuité de session (table PostgreSQL) pour le transfert borne↔PWA.

**PostgreSQL — métier** `[Relational DB]` — organisations, services, démarches, formulaires, abonnements, plans/positions. Utilisée uniquement par Backend API.

**PostgreSQL — AI Service** `[Relational DB + pgvector, instance séparée]`
Renommée (elle ne stocke plus seulement des vecteurs) : embeddings des documents, **copie locale du contenu structuré** (services/démarches, synchronisée), **sessions et historique de conversation** (pour la continuité borne↔PWA). Toujours physiquement isolée de la base métier.

**Object Storage** `[Container: MinIO, S3-compatible]` — fichiers bruts et images de plans. Inchangé.

### Containers supprimés depuis la v3
~~Worker~~, ~~Redis~~, ~~Message Queue (RabbitMQ)~~ — plus nécessaires au MVP, réintroductibles en V1.1 si le volume le justifie réellement (voir `tontouma-bot-design-rationale.md`, principe "ajouter un composant seulement quand une vraie raison l'impose").

### Relations clés

- User Experience Web/PWA -> Backend API : Parcourt/filtre les services, récupère les plans/positions `[HTTPS/JSON]`
- User Experience Web/PWA -> Backend API : Demande un ticket d'accès `[HTTPS/JSON]`
- User Experience Web/PWA -> AI Service : **Connexion directe unique**, texte et voix mêlés, ticket signé `[WebSocket]`
- Backend API -> AI Service : Notifie un changement de contenu (service/démarche publiée) `[HTTPS/JSON, synchrone, direct — plus de queue]`
- Backend API -> AI Service : Déclenche l'indexation d'un document après upload `[HTTPS/JSON]`
- AI Service -> Backend API : Callback de fin d'indexation `[HTTPS/JSON]`
- Backend API -> PostgreSQL (métier), Object Storage, Identity Provider (Clerk), Monitoring (Sentry) : inchangé
- AI Service -> PostgreSQL (AI Service) : lit/écrit sa copie structurée, ses embeddings, ses sessions `[SQL/TCP]`
- AI Service -> AI Provider (LLM) : inchangé

---

## NIVEAU 3 — COMPONENT DIAGRAM (zoom Backend API)

Modules inchangés depuis la v3 (Identity & Access, Organizations, Subscriptions, Services & Procedures, Form Builder, Documents, Access Points & QR, Access Ticket Issuer, Audit/Conversation Logging, Platform Administration), **avec ces ajustements** :

- **User Sessions disparaît en tant que composant Spring** — la session usager vit désormais côté AI Service (voir Niveau 2). Spring n'a plus besoin de la gérer, seulement de délivrer le ticket initial.
- **Nouveau : Cartographie** `[Spring MVC + JPA]` — gère `PlanBatiment` (image, étage) et les positions (x, y) rattachées à `Borne` et `Service`.
- **Notifications et Subscriptions** exécutent désormais leurs vérifications périodiques via `@Scheduled`, en interne — plus de Worker externe à orchestrer.
- **Services & Procedures** appelle directement l'AI Service (HTTP) à chaque publication, au lieu de publier sur une queue.
- **Documents** appelle directement l'AI Service pour déclencher l'indexation, au lieu de publier sur une queue.

---

## Format multimodal du canal conversationnel (WebSocket unique)

```json
{
  "event": "ai_response",
  "session_id": "sess_abc123",
  "audio_chunk": "<octets audio ou base64, streaming>",
  "text_content": "Le guichet de l'état civil se trouve au premier étage. Il vous faudra 1000 FCFA.",
  "display_card": {
    "type": "procedure_summary",
    "cost": "1000 FCFA",
    "delay": "2 jours",
    "required_pieces": ["Copie CNI", "Justificatif de domicile"]
  },
  "navigation_point": {
    "plan_id": "plan_rdc_mairie",
    "target_service": "État Civil",
    "coordinate_x": 120,
    "coordinate_y": 450,
    "description_chemin": "Prenez le couloir central en face de vous, première porte à droite."
  },
  "sources": [{ "type": "procedure", "entite_id": "proc_2" }]
}
```

`display_card` et `navigation_point` sont **optionnels** — présents seulement quand la réponse s'appuie sur une donnée structurée (E04) ou une demande d'orientation. Une question purement documentaire (E05) ne renvoie que `audio_chunk` + `text_content` + `sources`.

---

## Continuité de session — Borne vers PWA

1. Sur la borne : conversation en cours, `session_id` généré par l'AI Service à la connexion WebSocket, stocké dans sa table PostgreSQL (pas en mémoire — la borne elle-même n'enregistre rien localement, conforme RGPD).
2. L'usager clique "Continuer sur mon téléphone" → la borne affiche un QR Code encodant `session_id` + un ticket frais.
3. Scan → la PWA s'ouvre, extrait `session_id` + ticket de l'URL, ouvre son propre WebSocket vers l'AI Service avec ces identifiants.
4. L'AI Service retrouve l'historique en base et le renvoie à la PWA — reprise exacte là où c'était resté sur la borne.
5. **Pas de création de compte** — session anonyme de bout en bout, y compris sur mobile.

---

## Ce qui reste vrai, non affecté par cette révision

- Clerk (User Authentication + Organizations, 2 rôles fixes) pour Admin/Organisation — inchangé.
- Pas de Clerk Billing — abonnements gérés en Spring/PostgreSQL, paiement Mobile Money externe.
- Séparation Spring (métier)/Python (IA) par langage et isolation de panne.
- Vector DB = PostgreSQL séparée, pas de nouveau produit.
- Ticket JWT signé pour le canal conversationnel — Spring hors du chemin temps réel.
