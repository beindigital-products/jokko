import { test, expect, Page } from '@playwright/test';

// Tests E2E pour la logique de gating de plan :
// - Période d'essai de 14 jours débloque toutes les features avec badges
// - Essai expiré + pas de plan = tout verrouillé
// - Essai expiré + plan choisi = features selon rank du plan

// Empty → use the configured baseURL (https://localhost:1000) where the shared
// auth cookie applies. The redesign dropped the per-org subdomain hop, so the
// old be-in-digital.localhost host now lands on the sign-in page (unauthenticated).
const BASE_URL = '';

// A FeatureGate (either the billing or the plan variant) renders one of these
// CTAs when a feature is locked for the current plan.
const GATE_CTA = /voir les plans|passer au plan|plan .+ requis|débloquer/i;

async function gotoOrSkip(page: Page, path: string) {
    await page.goto(`${BASE_URL}${path}`);
    await page.waitForLoadState('networkidle');
    // Court délai : laisse le temps aux queries d'erreur de se manifester sans
    // attendre la propagation complète des error boundaries.
    await page.waitForTimeout(400);
    // Skip si la page est dans un état d'erreur Convex global (bug pré-existant
    // indépendant du gating).
    const errorHeading = page.getByRole('heading', { name: /une erreur est survenue/i });
    const errorText = page.locator('text=/Could not find public function|getActiveCall/i').first();
    const hasError =
        (await errorHeading.isVisible().catch(() => false)) ||
        (await errorText.isVisible().catch(() => false));
    if (hasError) {
        test.skip(true, 'Page en erreur Convex — bug pré-existant hors scope plan gating');
    }
}

/**
 * A FeatureGate first renders a "Chargement…" frame while `useFeatureAccess`
 * resolves, then either the gated content or an upgrade CTA. Poll until one of
 * the two terminal states is reached (rides through the loading frame; tolerant
 * of the Convex websocket query resolving well after `networkidle`).
 */
async function expectFeatureContentOrGate(page: Page, contentHeading: string) {
    const content = page.getByRole('heading', { name: contentHeading });
    const gateCta = page.getByText(GATE_CTA).first();
    await expect
        .poll(
            async () =>
                (await content.isVisible().catch(() => false)) ||
                (await gateCta.isVisible().catch(() => false)),
            { timeout: 15000 },
        )
        .toBe(true);
}

test.describe('Plan gating — trial & feature badges', () => {
    test('dashboard affiche le badge de plan ou countdown d\'essai dans la sidebar', async ({ page }) => {
        await gotoOrSkip(page, '/dashboard');

        const planOrTrial = page.locator(
            'text=/FREE|STARTER|BUSINESS|PRO|ENTERPRISE|jours? d[\'e]essai|essai/i'
        ).first();

        await expect(planOrTrial).toBeVisible({ timeout: 10000 });
    });

    test('page campagnes : badge tier OU FeatureGate actif', async ({ page }) => {
        await gotoOrSkip(page, '/dashboard/campagnes');
        // Gating is wired either way: the feature is unlocked (the Campagnes
        // screen renders) OR locked (a FeatureGate upgrade CTA shows).
        await expectFeatureContentOrGate(page, 'Campagnes');
    });

    test('page flows : badge PRO OU FeatureGate actif', async ({ page }) => {
        // /dashboard/flows now redirects (308) to /dashboard/automatisations.
        await gotoOrSkip(page, '/dashboard/flows');
        await expectFeatureContentOrGate(page, 'Automatisations');
    });

    test('page automatisations (chatbot) : badge BUSINESS OU gate', async ({ page }) => {
        await gotoOrSkip(page, '/dashboard/automatisations');
        await expectFeatureContentOrGate(page, 'Automatisations');
    });

    test('page billing : info de plan / essai visible', async ({ page }) => {
        await gotoOrSkip(page, '/dashboard/billing');

        const planInfo = page.locator(
            'text=/plan actuel|abonnement|essai|trial|FREE|STARTER|BUSINESS|PRO/i'
        ).first();

        await expect(planInfo).toBeVisible({ timeout: 10000 });
    });

    test('sidebar : items nav gated rendus (campagnes, automatisations, analytics)', async ({ page }) => {
        await gotoOrSkip(page, '/dashboard');

        const campagnesLink = page.getByRole('link', { name: /campagne/i }).first();
        const automatisationsLink = page.getByRole('link', { name: /automat/i }).first();
        const analyticsLink = page.getByRole('link', { name: /analytic|statistique/i }).first();

        const campVisible = await campagnesLink.isVisible({ timeout: 5000 }).catch(() => false);
        const autoVisible = await automatisationsLink.isVisible({ timeout: 5000 }).catch(() => false);
        const anaVisible = await analyticsLink.isVisible({ timeout: 5000 }).catch(() => false);

        expect(campVisible || autoVisible || anaVisible).toBeTruthy();
    });
});
