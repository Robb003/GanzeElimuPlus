import { test, expect } from '@playwright/test';

test.describe('ElimuPlus applicant authentication', () => {
  test('allows an applicant to register, log in, access the dashboard and sign out', async ({
    page,
    request,
  }) => {
    // Arrange: create a test applicant in the isolated E2E database.
    const registrationResponse = await request.post(
      'http://127.0.0.1:5000/api/auth/register',
      {
        data: {
          fullName: 'Playwright Test Applicant',
          phoneNumber: '0712345678',
          password: 'Password123!',
          nationalID: '12345678',
          ward: 'Ganze',
          village: 'Bamba',
        },
      }
    );

    expect(
      registrationResponse.status(),
      'Test applicant registration should succeed'
    ).toBe(201);

    // Act: open the login page and authenticate.
    await page.goto('/login');

    await page.locator('#phoneNumber').fill('0712345678');
    await page.locator('#password').fill('Password123!');

    await page.getByRole('button', { name: /log in/i }).click();

    // Assert: applicant reaches the dashboard.
    await expect(page).toHaveURL(/\/applicant-dashboard$/);

    await expect(
      page.getByRole('heading', {
        name: 'Applicant Dashboard',
      })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', {
        name: 'Welcome, Playwright Test Applicant',
      })
    ).toBeVisible();

    // Act: sign out.
    await page.getByRole('button', { name: /sign out/i }).click();

    // Assert: applicant is returned to login.
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('ElimuPlus login security', () => {
  test('rejects an incorrect password', async ({ page, request }) => {
    const registrationResponse = await request.post(
      'http://127.0.0.1:5000/api/auth/register',
      {
        data: {
          fullName: 'Incorrect Password Test Applicant',
          phoneNumber: '0712345690',
          password: 'Password123!',
          nationalID: '12345690',
          ward: 'Ganze',
          village: 'Bamba',
        },
      }
    );

    expect(registrationResponse.status()).toBe(201);

    await page.goto('/login');

    await page.locator('#phoneNumber').fill('0712345690');
    await page.locator('#password').fill('WrongPassword123!');

    await page.getByRole('button', { name: /log in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByRole('heading', { name: 'Applicant Dashboard' })
    ).not.toBeVisible();
  });
});
