import { test, expect } from '@playwright/test';

// Override auth state — this test exercises the login flow itself.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login flow', () => {
    test('signs in and reaches dashboard without infinite spinner', async ({ page }) => {
        // Uses baseURL (https://localhost:1000) — the redesign dropped the
        // subdomain hop, so log in on the main domain like auth.setup.ts.
        await page.goto('/auth/sign-in');
        // The form is the reliable marker (the heading "Ravi de vous revoir."
        // is rendered char-by-char via SplitText, so don't match it by role).
        await expect(page.locator('#email')).toBeVisible({ timeout: 15000 });

        await page.locator('#email').fill('momoseck8@gmail.com');
        await page.locator('#password').fill('Password123!');
        await page.getByRole('button', { name: /acc[eé]der|se connecter/i }).click();

        await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
        await expect(page).not.toHaveURL(/\/sign-in/);
    });

    test('shows error for invalid credentials', async ({ page }) => {
        await page.goto('/auth/sign-in');
        await expect(page.locator('#email')).toBeVisible({ timeout: 15000 });

        await page.locator('#email').fill('wrong@example.com');
        await page.locator('#password').fill('WrongPassword!');
        await page.getByRole('button', { name: /acc[eé]der|se connecter/i }).click();

        await expect(page.getByText('Email ou mot de passe incorrect')).toBeVisible({ timeout: 15000 });
        await expect(page).toHaveURL(/\/sign-in/);
    });
});
