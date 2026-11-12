import { test, expect } from '@playwright/test';

test.describe('ElimuPlus public navigation', () => {
  test('loads the homepage successfully', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('link', { name: /home/i }).first()
    ).toBeVisible();
  });

  test('navigates from the homepage to the login page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /^login$/i }).click();

    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByRole('heading', { name: /log in/i })
    ).toBeVisible();
  });

  test('redirects unauthenticated visitors away from the applicant dashboard', async ({ page }) => {
    await page.goto('/applicant-dashboard');

    await expect(page).toHaveURL(/\/login$/);
  });
});
