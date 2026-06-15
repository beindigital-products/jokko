# ADR-0006 — Frontières monorepo mobile

- **Statut** : Accepté
- **Date** : 2026-05-02
- **Source décisionnelle** : `architecture.md` décisions #14, #15, #16, #18
- **Implémentation liée** : `apps/mobile`, `packages/ui-mobile`, `packages/convex-client`, `packages/i18n`, `@jokko/tokens`

## Contexte

Jokko vit dans un monorepo avec une app web Next.js, une app mobile Expo et des fonctions Convex. Le risque principal est de créer des imports croisés web/mobile ou de dupliquer les tokens, types, traductions et helpers multi-tenant.

Le mobile doit rester natif : pas de dépendance DOM/Next, pas de composants web réutilisés directement.

## Décision

**`apps/mobile` est l'application Expo; le code partagé passe uniquement par des packages workspace explicites.**

Frontières :

1. `apps/mobile` contient routes Expo, écrans, wiring natif et intégrations device.
2. `packages/ui-mobile` contient les primitives React Native réutilisables, sans import Convex ni Expo Router.
3. `packages/convex-client` contient config Convex et helpers multi-tenant/cache/session, sans UI.
4. `packages/i18n` contient les messages typés FR/EN et helpers de traduction.
5. `@jokko/tokens` reste la source de vérité design tokens web/mobile.
6. `convex/_generated` reste la source des types backend générés.
7. `apps/mobile` ne doit pas importer depuis `apps/web`.
8. `apps/web` ne doit pas importer depuis `apps/mobile`.

## Conséquences positives

- La compilation Expo évite les dépendances web incompatibles.
- Les packages partagés restent testables hors runtime mobile.
- Le design system mobile peut évoluer sans casser le dashboard web.
- Les règles multi-tenant sont mutualisées sans mélanger UI et sécurité.

## Contraintes acceptées

- Certains composants similaires web/mobile seront recodés deux fois quand les plateformes divergent.
- Les packages partagés doivent rester petits et strictement typés.
- Toute nouvelle dépendance doit être ajoutée au bon niveau : app si runtime spécifique, package si logique partagée.

## Règles d'import

- Autorisé dans `apps/mobile` : `@jokko/ui-mobile`, `@jokko/convex-client`, `@jokko/i18n`, `@jokko/tokens`, `convex/_generated`.
- Interdit dans `packages/ui-mobile` : `convex/react`, `expo-router`, modules `apps/*`.
- Interdit dans `packages/convex-client` : React Native UI, Expo UI, Next.js.
- Interdit dans `packages/i18n` : runtime UI.

## Vérification

- `pnpm -r typecheck`
- `pnpm --filter @jokko/mobile lint`
- Revue `find apps/mobile packages -type f` pour détecter les imports interdits si une règle ESLint workspace est ajoutée.

## Triggers de ré-évaluation

- Ajout Android v1.1.
- Extraction d'un package `core` plus large.
- Besoin de composants cross-platform web/native via React Native Web.
