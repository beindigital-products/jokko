import { test as setup } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth', 'user.json');

// Credentials from env (fall back to the shared test account). The subdomain
// redirect is opt-in/off, so we log in on the main domain — no subdomain hop.
const EMAIL = process.env.E2E_EMAIL || 'momoseck8@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD || 'Password123!';

setup('authenticate', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');

    await page.locator('#email').fill(EMAIL);
    await page.locator('#password').fill(PASSWORD);
    await page.getByRole('button', { name: /acc[eé]der|se connecter/i }).click();

    // Lands on the dashboard (same origin — no subdomain bounce).
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    await page.context().storageState({ path: AUTH_FILE });
});
