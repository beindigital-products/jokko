# Documentation Jokko

Jokko centralise les conversations **WhatsApp Business** d'une équipe (multi-numéros, collaboration, assignation, automatisations, IA, appels).

| Document | Contenu |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, modèle multi-tenant, données, domaines fonctionnels, intégrations, sécurité, tests, limitations |
| [OPERATIONS.md](./OPERATIONS.md) | Commandes, variables d'environnement, webhooks, mise en place des intégrations, crons, checklist prod |
| [verification-report.md](../.context/verification-report.md) | Rapport de vérification fonctionnelle (état par domaine + dette) |

## Démarrage rapide

```bash
pnpm install
pnpx convex dev        # backend (terminal 1, depuis la RACINE)
pnpm dev               # frontend https://localhost:1000 (terminal 2)
```

Voir [OPERATIONS.md](./OPERATIONS.md) pour les variables d'environnement requises et la configuration des intégrations (WhatsApp, CRM, Stripe, SES).

## Conventions

- **Commits** : Conventional Commits, en français, sans mention d'outil IA.
- **Backend** : `convex/` à la racine (PAS `apps/web/convex`). Déployer **depuis la racine**.
- **État** : Zustand (UI) ; données via `useQuery`/`useMutation` Convex (pas de REST).
- **Tests** : tout ajout fonctionnel = test Vitest (+ e2e Playwright pour les flux UI).
