import { test, expect } from '@playwright/test';

test.describe('ElimuPlus applicant registration', () => {
  test('blocks registration when the privacy notice is not acknowledged', async ({
    page,
  }) => {
    await page.goto('/register');

    await page.locator('#fullName').fill('Privacy Test Applicant');
    await page.locator('#phoneNumber').fill('0712345681');
    await page.locator('#identityNumber').fill('22345679');
    await page.locator('#ward').selectOption('Ganze');
    await page.locator('#village').fill('Bamba');
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('Password123!');

    // Deliberately leave the privacy checkbox unchecked.
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('alert')).toContainText(
      'Please read and acknowledge the Data Protection & Privacy Notice'
    );

    await expect(page).toHaveURL(/\/register$/);
  });

  test('registers an applicant successfully after privacy acknowledgement', async ({
    page,
  }) => {
    await page.goto('/register');

    await page.locator('#fullName').fill('Playwright Registration Applicant');
    await page.locator('#phoneNumber').fill('0712345680');

    // Select birth certificate instead of National ID.
    await page.getByRole('radio', {
      name: 'Birth certificate',
    }).check();

    await expect(
      page.getByLabel('Birth certificate number')
    ).toBeVisible();

    await page.locator('#identityNumber').fill('BC-PLAYWRIGHT-2026-01');
    await page.locator('#ward').selectOption('Ganze');
    await page.locator('#village').fill('Bamba');
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('Password123!');

    // Acknowledge the Data Protection & Privacy Notice.
    await page.getByRole('checkbox').check();

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('status')).toContainText(
      'Your account has been created successfully'
    );

    await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
  });
});
