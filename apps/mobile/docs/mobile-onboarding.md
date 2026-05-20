# Mobile onboarding — première implémentation

> **Statut** : écran natif livré, backend/auth non branchés.
> **Date** : 2026-05-01

---

## Ce qui est livré

- Entrée par défaut de l'app mobile sur l'onboarding.
- Welcome carousel 3 slides.
- Chemin "Créer mon espace".
- Chemin "J'ai une invitation" qui saute la création d'organisation.
- Wizard entreprise : nom, slug preview, secteur, langue, fuseau horaire.
- Étape WhatsApp Business : placeholder pour le futur deep link web Meta.
- Étape permissions : push, caméra, micro avec logique just-in-time.
- État final "Inbox prête".
- Accès au menu des spikes depuis l'onboarding pour garder les POC testables.

Fichiers :

- `apps/mobile/src/MobileOnboarding.tsx`
- `apps/mobile/src/lib/mobile-onboarding.ts`
- `apps/mobile/src/lib/mobile-onboarding.test.ts`
- `apps/mobile/app/onboarding.tsx`
- `apps/mobile/app/inbox-empty.tsx`

---

## Ce qui est maintenant branché en L2

- Auth password mobile via `@convex-dev/auth`.
- Création organisation Convex depuis le wizard.
- `users.completeOnboarding()` à la fin du flow.
- Persistance `firstLaunchSeen`.
- Demande native push si l'utilisateur garde Push activé.

Voir `apps/mobile/docs/lot-L2-auth-onboarding.md`.

## Ce qui n'est pas encore branché

- Pas encore de deeplink réel vers le flow Meta WhatsApp.
- Routage Expo Router livré en L1, mais pas encore découpé en sous-routes `(onboarding-org)` connectées au backend.

Ces points appartiennent à L1/L2 :

- L1 : Expo Router, packages `ui-mobile`, `convex-client`, `i18n`, consent runtime. **Livré** dans `apps/mobile/docs/lot-L1-bootstrap.md`.
- L2 : auth réelle + création organisation + onboarding org connecté au backend. **Partiellement livré** dans `apps/mobile/docs/lot-L2-auth-onboarding.md`.

---

## Vérification

Commandes exécutées :

```bash
pnpm exec vitest run apps/mobile/src/lib/mobile-onboarding.test.ts
pnpm --filter @jokko/mobile typecheck
pnpm --filter @jokko/mobile lint
pnpm exec vitest run
pnpm -r typecheck
pnpm --filter @jokko/mobile exec expo export --platform ios --output-dir ../../.context/onboarding-ios-export --clear
```

Résultat :

- Tests onboarding : 5 passants.
- Suite Vitest complete : 271 tests passants.
- Typecheck mobile : OK.
- Typecheck workspace : OK.
- Lint mobile : OK.
- Export iOS Expo : OK.
