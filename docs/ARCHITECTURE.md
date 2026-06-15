# Jokko — Architecture

> Plateforme SaaS multi-tenant qui centralise les conversations **WhatsApp Business** d'une équipe : plusieurs numéros, collaboration d'agents, assignation, automatisations et assistance IA.

Ce document décrit l'architecture, le modèle de données, les domaines fonctionnels, les intégrations et le modèle de sécurité. Pour la configuration et le déploiement, voir [OPERATIONS.md](./OPERATIONS.md).

---

## 1. Stack & structure

| Couche | Techno |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, shadcn/ui (Radix), Zustand, framer-motion |
| Backend | [Convex](https://convex.dev) (runtime edge-like, temps réel, scheduler, crons) |
| Auth | `@convex-dev/auth` (Password + Google OAuth) |
| Tests | Vitest + `convex-test` (unitaire/intégration), Playwright (e2e) |
| Externes | WhatsApp Cloud API (Meta), Stripe + Wave (paiement), AWS SES (email), 6 CRM (OAuth/API-key) |

Monorepo pnpm :
```
convex/            # Backend Convex (SOURCE DE VÉRITÉ — déployé)
  schema.ts        # Toutes les tables
  http.ts          # Webhooks (WhatsApp, Stripe, Wave, CRM, Facebook)
  crons.ts         # Jobs périodiques
  engine.ts        # Moteur d'automatisations (flows)
  crm/             # Sync CRM (adaptateurs + dispatcher + poller)
  lib/             # auth, permissions, encryption, email, planLimits, callPricing…
apps/web/          # App Next.js (dashboard + landing)
  app/dashboard/   # Application (inbox, contacts, campagnes, flows, team…)
  app/(marketing)/ # Pages publiques
  components/, hooks/, lib/, e2e/
apps/mobile/       # App mobile (Expo) — hors périmètre de ce doc
packages/          # core, tokens partagés
```

> ⚠️ Le dossier `apps/web/convex/` est un **orphelin** (types générés résiduels). Le seul backend actif est `convex/` à la racine. Tout déploiement Convex doit se lancer **depuis la racine du repo**.

---

## 2. Modèle multi-tenant

Toute donnée appartient à une **organisation**. L'org active d'un utilisateur est portée par `userSessions.currentOrganizationId`. Le pattern serveur :

```ts
// convex/lib/auth.ts
const orgId = await getCurrentOrgId(ctx);                 // org active de l'appelant
const { userId } = await requireMembership(ctx, orgId);   // doit être membre
await requirePermission(ctx, orgId, "contacts:export");   // + permission précise
```

**Règle d'or** : toute `query`/`mutation`/`action` publique prenant un `Id` valide l'appartenance de l'appelant à `entity.organizationId` avant de lire/écrire. Les fonctions sensibles non destinées au client sont `internalQuery`/`internalMutation`/`internalAction`.

### Rôles & permissions (`convex/lib/permissions.ts`)
`OWNER > ADMIN > AGENT`. Permissions fines (`flows:create`, `contacts:export`, `members:invite`, `settings:whatsapp`, `conversations:assign`, `calls:initiate`…) mappées par rôle. Côté client : hooks `usePermission()` / `useCan()`.

---

## 3. Modèle de données (tables clés)

| Domaine | Tables |
|---|---|
| Tenant | `organizations`, `memberships`, `users`, `userSessions`, `invitations`, `poles` (services) |
| Messagerie | `conversations`, `messages`, `contacts`, `tags`, `contactSegments`, `shortcuts` |
| WhatsApp | `wabas` (compte business, token chiffré), `whatsappChannels` (numéros) |
| Diffusion | `broadcasts` (campagnes), `templates` (modèles Meta) |
| Automatisation | `flows` (nœuds/edges JSON + `triggerConfig`), assignations |
| Appels | `calls` (signaling WebRTC + statut) |
| Facturation | `plans`, `creditTransactions` (solde via `organizations.creditBalance`), `paymentSessions` |
| CRM | `crmConnections`, `crmSyncQueue`, `crmContactLinks` + DLQ |
| Notifications | `notifications`, `notificationPreferences`, devices push |

Détails utiles :
- **Tokens chiffrés au repos** (`wabas.accessTokenRef`, `organizations.whatsapp.accessToken`, `crmConnections.accessTokenEnc`) via AES-256-GCM (`convex/lib/encryption.ts`). Toujours `decrypt()` avant un appel sortant. `decrypt()` est *gracieux* : un token en clair (env) passe inchangé.
- **Variables de modèle de campagne** : `broadcasts.templateVariables` (mapping `{token, src, fixed?}`) résolu par contact à l'envoi (`buildTemplateComponents`).
- **Tags** : `contacts.tags` = `Id<"tags">[]` (FK) ; `conversations.tags` = `string[]` (libellés libres) — dualité volontaire.

---

## 4. Domaines fonctionnels (dashboard)

| Domaine | Description |
|---|---|
| **Inbox / Conversations** | Liste temps réel, fil, envoi texte/média/audio, notes internes + @mentions, assignation, résolution, **envoi de modèle**, brouillon IA (Copilot) |
| **Contacts** | CRUD, import CSV, tags + filtre, segments, fusion de doublons, timeline, blocage, notes, export |
| **Campagnes** | Wizard (audience tags/tous, modèle + variables), planification, **envoi chunké auto-planifié** + débit crédit, pause/reprise, brouillon, détail/activité |
| **Modèles** | Wizard de création, soumission + synchro Meta, raccourcis, envoi en conversation |
| **Automatisations** | Éditeur visuel React Flow (start/message/interactive/**action**), déclencheurs (mot-clé / nouvelle conv.), assistant IA, **moteur `engine.ts`** |
| **Équipe** | Membres, rôles, pôles, invitations (email SES) |
| **Analytique** | Stats (volume, taux de réponse, heatmap heures de pointe) bornées par période |
| **Paramètres** | Profil, org, canaux WhatsApp (connexion/statut/appels), préférences de notification |
| **Facturation** | Plan, usage, crédits + recharge (Stripe/Wave), portail Stripe |
| **Intégrations** | Catalogue CRM, connexion OAuth/clé API, détail, déconnexion, plan-gating (Pro) |
| **Appels** | Appels audio WhatsApp (WebRTC) entrants/sortants — voir §6 |

---

## 5. Temps réel, scheduler & crons

- **Temps réel** : `useQuery` (Convex) réagit automatiquement aux écritures — pas de polling.
- **Scheduler** : `ctx.scheduler.runAfter(0, internal.x.y, …)` pour le travail asynchrone (envoi WhatsApp, emails, CPR d'appel, débit crédit). Les actions (Node/fetch) ne peuvent pas être appelées depuis une mutation → on planifie.
- **Crons** (`convex/crons.ts`) : présence (1 min), campagnes planifiées (1 min), expiration sessions paiement (5 min), **CRM dispatcher** (20 s, push Jokko→CRM), **CRM poller** (1 min, pull CRM→Jokko), expiration des appels manqués (1 min), + un job quotidien.

---

## 6. Intégrations

### WhatsApp Cloud API (Meta)
- **Webhook** `/api/whatsapp/webhook` : GET (vérification) + POST (signature **HMAC-SHA256** via `FACEBOOK_APP_SECRET`). Traite `messages`, `statuses`, `calls`.
- **Sortant** : `whatsapp_actions.sendMessage` (texte/média/modèle) avec token déchiffré, Graph API v24.0 pour les appels.
- **Appels (audio)** : Business Calling API en **WebRTC**. Convex relaie le signaling SDP entre Meta et le navigateur de l'agent. Flux sortant : permission (CPR / 138017 « déjà autorisé ») → offre SDP → réponse SDP (webhook) → audio. Crédit débité à la minute (`convex/lib/callPricing.ts`, ~6 FCFA/min Sénégal). **Vidéo non disponible** côté API (voix uniquement).

### CRM (`convex/crm/`)
Architecture queue : mutations de conversation → `enqueueConversationEvent` → `crmSyncQueue` → **dispatcher** (lock CAS + circuit-breaker + DLQ) → adaptateur provider. Pull via **poller** delta. OAuth signé (state HMAC + PKCE + nonce + TTL anti-replay).
- **Actifs** : HubSpot, Pipedrive, Salesforce, Sellsy (OAuth).
- **« Bientôt »** (désactivés) : Axonaut, noCRM (API-key) — `availability: "coming_soon"` dans `crm/core/providers.ts`.

### Paiement
Stripe (abonnements + crédits) et Wave (crédits) : webhooks signés (`/api/stripe/webhook`, `/api/wave/webhook`) avec anti-replay. Montants whitelistés, prix dérivés serveur. Orange Money : prévu (compte marchand externe requis).

### Email — AWS SES (`convex/lib/email.ts`)
Invitations, mentions, réinitialisation de mot de passe. **No-op gracieux** si `AWS_SES_FROM_EMAIL` absent (dev/test).

### Auth
`@convex-dev/auth` : Password (politique : ≥10 car. + maj/min/chiffre) + Google OAuth. Sessions via cookies (+ miroir HttpOnly). Reset par code email (TTL 30 min).

---

## 7. Sécurité

- **Isolation multi-tenant** systématique (§2) — audité, IDOR fermés (envoi/lecture par canal, resync CRM, routage IA passé en `internal`).
- **Chiffrement des secrets au repos** (AES-256-GCM) + jamais renvoyés au client (`channels.list` strip les refs de token).
- **Webhooks** tous signés (HMAC temps constant) + anti-replay (Stripe/Wave).
- **Injection LLM** : message client délimité (`<customer_message>`) + garde dure post-réponse (ids vérifiés). Routage IA = `internalAction`.
- **SSRF** : les médias par URL sont validés contre une allow-list d'hôtes (domaine Convex Storage) avant `fetch`.
- **Mutations publiques** (lead/contact) : validation d'email, bornage, rate-limit (`convex/lib/rateLimits.ts`).
- **Rôles** : config WhatsApp / facturation / invitations / assignation gardées par permission ; un non-OWNER ne peut pas modifier un OWNER.

---

## 8. Tests & qualité

- **Unitaire/intégration** : ~300 tests Convex (`convex-test`) + ~420 tests web (Vitest) — couvrent sécurité (IDOR/rôles), moteur de flux, campagnes, analytics, CRM, paiement-gating, mappers.
- **E2E** : Playwright (`apps/web/e2e/`) sur les flux clés (auth, inbox, contacts, campagnes, modèles, équipe, plan-gating…). Serveur de test sur `https://localhost:1000`, login via `auth.setup.ts`.
- **CI gates** : `pnpx convex typecheck`, `pnpm --filter @jokko/web run typecheck`, `pnpm build` (prod), suites Vitest.

---

## 9. Limitations connues / roadmap

- **CRM** : Axonaut & noCRM en « Bientôt » (chemin API-key à finaliser). Push Jokko→CRM nécessite des contacts liés (sinon items DLQ).
- **Appels** : voix uniquement (pas de vidéo via l'API) ; nécessite token Meta valide + calling activé + numéro éligible.
- **Scalabilité** : certaines requêtes d'audience/analytics chargent l'ensemble des contacts d'une org — à pré-calculer (sous-table d'audience) pour les très grandes orgs.
- **Facturation** : `updateOrgPlan` permet d'octroyer un plan sans paiement (trial/onboarding) — à arbitrer si seul Stripe doit accorder les plans payants.
- **Orange Money**, export RGPD, SLA, CSAT, mode sombre : roadmap.
