import { test, expect } from '@playwright/test';

// Use a relative path so the test runs on the configured baseURL
// (https://localhost:1000) where the shared auth cookie applies. The redesign
// dropped the per-org subdomain hop, so the old be-in-digital.localhost host
// is no longer authenticated.
const INTEGRATIONS_URL = '/dashboard/integrations';

test.describe('Integrations Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(INTEGRATIONS_URL);
        await page.waitForLoadState('networkidle');
    });

    test('should load and display the integrations header', async ({ page }) => {
        // v3 PageHeader title is just "Intégrations" (was "Intégrations CRM").
        await expect(page.getByRole('heading', { name: /^intégrations$/i })).toBeVisible();
    });

    test('should display stats cards', async ({ page }) => {
        // v3 dropped the 3 stat cards (connexions actives / contacts importés /
        // opt-ins collectés). The page summary is now the header eyebrow
        // ("Connecteurs · N actif…") plus the category filter bar. Assert those.
        await expect(page.getByText(/connecteurs\s*·/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /^CRM$/ })).toBeVisible();
    });

    test('should display at least one provider card', async ({ page }) => {
        // HubSpot is always in the catalog (available or coming_soon)
        const anyProvider = page.getByText(/hubspot|pipedrive|salesforce|sellsy|axonaut|nocrm/i).first();
        await expect(anyProvider).toBeVisible();
    });

    test('should display Connecter buttons on provider cards', async ({ page }) => {
        // v3 provider CTAs: "Connecter" (not connected) or "Configurer" (connected).
        // Each provider card is itself a button whose accessible name embeds the
        // CTA text, so a substring match reliably finds the provider cards. Use an
        // auto-retrying visibility assertion: `networkidle` fires before the
        // Convex provider query resolves, so a one-shot count() would read 0.
        const ctaCards = page.getByRole('button', { name: /connecter|configurer/i });
        await expect(ctaCards.first()).toBeVisible({ timeout: 10000 });
        expect(await ctaCards.count()).toBeGreaterThan(0);
    });

    test.describe('Disconnect dialog', () => {
        test.beforeEach(async ({ page }) => {
            const disconnectBtn = page.getByRole('button', { name: /^déconnecter$/i }).first();
            const appeared = await disconnectBtn
                .waitFor({ state: 'visible', timeout: 5000 })
                .then(() => true)
                .catch(() => false);
            if (!appeared) {
                test.skip();
                return;
            }
            await disconnectBtn.click();
            await expect(page.getByRole('dialog')).toBeVisible();
        });

        test('should display the dialog title', async ({ page }) => {
            await expect(
                page.getByRole('heading', { name: /déconnecter .+ \?/i }),
            ).toBeVisible();
        });

        test('should display the 4 consequences', async ({ page }) => {
            await expect(page.getByText(/tokens (révoqués|supprimés)/i)).toBeVisible();
            await expect(page.getByText(/liens contacts ↔ crm conservés/i)).toBeVisible();
            await expect(page.getByText(/événements en file d'attente/i)).toBeVisible();
            await expect(page.getByText(/reconnexion ultérieure/i)).toBeVisible();
        });

        test('should display the acknowledgement checkbox', async ({ page }) => {
            await expect(page.getByLabel(/j'ai compris les conséquences/i)).toBeVisible();
        });

        test('should keep the confirm button disabled until checkbox is checked', async ({ page }) => {
            const confirmBtn = page.getByRole('button', { name: /^déconnecter$/i }).last();
            await expect(confirmBtn).toBeDisabled();

            await page.getByLabel(/j'ai compris les conséquences/i).click();
            await expect(confirmBtn).toBeEnabled();
        });

        test('should close when Annuler is clicked', async ({ page }) => {
            await page.getByRole('button', { name: /^annuler$/i }).click();
            await expect(page.getByRole('dialog')).not.toBeVisible();
        });

        test('should reset acknowledged checkbox when reopened', async ({ page }) => {
            // Tick + cancel
            const checkbox = page.getByLabel(/j'ai compris les conséquences/i);
            await checkbox.click();
            await page.getByRole('button', { name: /^annuler$/i }).click();
            await expect(page.getByRole('dialog')).not.toBeVisible();

            // Reopen
            await page.getByRole('button', { name: /^déconnecter$/i }).first().click();
            await expect(page.getByRole('dialog')).toBeVisible();

            // The confirm button should be disabled again (checkbox was reset)
            const confirmBtn = page.getByRole('button', { name: /^déconnecter$/i }).last();
            await expect(confirmBtn).toBeDisabled();
        });
    });
});
