import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Jokko/);
    await expect(page.getByRole('link', { name: 'Connexion' })).toBeVisible({ timeout: 10000 });
});

test('navigate to sign-in page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Connexion');
    await expect(page).toHaveURL(/.*sign-in/);
    // The v3 heading ("Ravi de vous revoir.") is rendered char-by-char via
    // SplitText, so assert on the stable login form instead.
    await expect(page.locator('#email')).toBeVisible({ timeout: 10000 });
});
