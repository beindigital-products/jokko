# ADR-0003 — State management mobile

- **Statut** : Accepté
- **Date** : 2026-05-02
- **Source décisionnelle** : `architecture.md` décisions #7, #14, #15
- **Implémentation liée** : Expo Router, Convex React, `packages/convex-client`, helpers inbox/onboarding

## Contexte

L'app mobile combine plusieurs types d'état :

- Server state temps réel : conversations, messages, contacts, memberships, notifications.
- Etat de navigation : route courante, deep links, onboarding.
- Etat d'UI local : champs, filtres, modals, reply draft.
- Etat persistant local : first launch, consent privacy, device id, préférences légères.
- Etat multi-tenant : organisation active, caches org-scoped, queue d'envoi.

Le risque principal est de dupliquer le server state Convex dans un store client et de créer des incohérences difficiles à débugger.

## Décision

**Convex est la source de vérité pour le server state. React local state couvre l'état d'écran. Zustand est réservé aux états globaux client qui ne sont pas du server state.**

Concrètement :

1. Les données backend sont lues via `useQuery` et modifiées via `useMutation`.
2. Les listes et filtres purement dérivés restent dans des helpers testables (`mobile-inbox`, `mobile-onboarding`).
3. `useState` / `useReducer` restent le choix par défaut pour l'état propre à un écran.
4. Zustand + persist sera ajouté seulement pour les états globaux cross-screen : drafts, queue offline, préférences UI, organisation active si nécessaire.
5. Aucun store Zustand ne doit contenir une copie durable des conversations/messages comme source de vérité.
6. Toute clé persistée qui dépend d'une organisation doit utiliser le préfixe `jokko.<orgId>.`.
7. Le package `@jokko/convex-client` porte les helpers multi-tenant communs, pas les composants UI.

## Conséquences positives

- Moins de bugs de synchro entre realtime Convex et store local.
- Les tests restent simples sur les fonctions pures.
- Les écrans peuvent évoluer sans introduire Redux ou un cache client lourd.
- Les purges tenant sont centralisées et vérifiables.

## Contraintes acceptées

- Certains écrans auront plus de state local au début, tant qu'il n'y a pas de besoin cross-screen.
- Zustand n'est pas installé pour le plaisir de respecter l'architecture cible; il arrive avec le premier besoin réel de store global.
- Les optimisations offline doivent passer par une queue explicite, pas par mutation implicite du cache Convex.

## Règles d'implémentation

- Si l'état peut être recalculé depuis une query Convex + route params, ne pas le persister.
- Si l'état contient de la donnée tenant, il doit être org-scoped et purgable.
- Si l'état contient un secret, il va dans `expo-secure-store`, pas dans MMKV/AsyncStorage.
- Si un store persistant est ajouté, il doit être couvert par un test de purge via `detectOrgLeak`.

## Vérification

- Tests unitaires sur les helpers de tri/filtre.
- Tests du package `@jokko/convex-client` pour purge org-scoped et mutex de switch org.
- Revue de code : aucun import mobile depuis `apps/web`.

## Triggers de ré-évaluation

- Offline-first complet.
- Besoin de cache normalisé client.
- Ajout d'Android avec contraintes perf différentes.
