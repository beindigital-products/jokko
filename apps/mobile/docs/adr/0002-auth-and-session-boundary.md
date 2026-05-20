# ADR-0002 — Auth mobile et frontière de session

- **Statut** : Accepté
- **Date** : 2026-05-02
- **Source décisionnelle** : `architecture.md` décisions #5, #14, #23 + `lot-L2-auth-onboarding.md`
- **Implémentation liée** : `MobileAppProviders`, `auth-storage`, routes `/auth/*`, `/invite/[token]`, `/onboarding`

## Contexte

Jokko mobile doit reprendre le modèle multi-tenant du web sans créer une seconde autorité d'authentification. L'app doit gérer :

- Password auth, Google OAuth et Sign in with Apple.
- Liens d'invitation équipe.
- Création d'organisation pendant l'onboarding.
- Stockage sûr des tokens sur iOS.
- Changement d'organisation sans fuite de cache entre tenants.

Apple impose aussi Sign in with Apple si des providers sociaux tiers sont proposés. Le spike S1 valide la vérification du JWT Apple, mais la session Convex Apple n'est pas encore branchée dans L2.

## Décision

**Convex Auth reste l'unique autorité de session.** Le mobile ne crée pas de session parallèle, ne mint pas de JWT local et ne stocke pas de profil utilisateur comme source de vérité.

Concrètement :

1. Le root Expo utilise `ConvexAuthProvider` avec `ConvexReactClient`.
2. Les tokens Convex Auth sont stockés via `expo-secure-store` dans le namespace `jokko-mobile-auth`.
3. Password auth mobile utilise le même provider Convex Auth que le web.
4. Google OAuth mobile passe par `signIn("google")`, `expo-web-browser`, puis retour `jokko://auth/callback`.
5. Apple doit aboutir à une session Convex Auth complète côté backend. La vérification du `identityToken` seule ne suffit pas pour considérer l'utilisateur authentifié.
6. `/invite/[token]` accepte le lien uniquement après authentification, via `invitations.acceptLink`.
7. L'onboarding crée l'organisation côté Convex, puis appelle `users.completeOnboarding`.
8. Tout switch d'organisation doit purger les caches org-scoped avant de changer le token actif.

## Conséquences positives

- Une seule logique de permission côté backend.
- Pas de divergence web/mobile sur les rôles OWNER, ADMIN, AGENT.
- Révocation, reset password et linking email restent centralisés.
- Le token est dans le Keychain iOS, pas dans AsyncStorage.
- Les invitations restent validées serveur, pas par simple parsing de deep link.

## Contraintes acceptées

- Apple ne sera "complet" qu'après ajout du provider Convex Auth backend.
- Google doit être validé sur device réel avec les credentials iOS.
- Les tests unitaires peuvent valider les helpers, mais pas le comportement OAuth natif complet.
- Les changements d'organisation doivent être traités comme une opération sensible : pas de navigation optimiste tant que le purge/cache/token swap n'est pas terminé.

## Règles d'implémentation

- Aucun écran ne doit lire directement un token pour décider du rôle. Il faut utiliser les queries Convex (`users.me`, memberships, organizations).
- Les flags locaux non sensibles peuvent vivre hors Keychain, mais les tokens et device identifiers durables restent en stockage sécurisé.
- Les callbacks OAuth ne doivent pas activer `shouldHandleCode` automatiquement dans `ConvexAuthProvider`; la route callback garde le contrôle de la redirection.
- Les erreurs d'auth doivent renvoyer vers `/auth/sign-in` ou `/auth/sign-up` avec `redirectTo`, jamais vers un écran app authentifié.

## Vérification

- `pnpm --filter @jokko/mobile typecheck`
- `pnpm --filter @jokko/mobile lint`
- Tests onboarding/auth helpers dans `apps/mobile/src/lib/*`
- Validation manuelle device pour Google et Apple avant TestFlight.

## Triggers de ré-évaluation

- Ajout d'un IdP entreprise (SAML/OIDC).
- Auth offline ou mode kiosk.
- Besoin de multi-session simultanée par utilisateur sur un même device.
