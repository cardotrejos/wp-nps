/**
 * Authentication Helpers
 *
 * Utility functions for test authentication flows.
 * Follows FlowPulse Better Auth patterns (AR1).
 */
import type { Page } from '@playwright/test';

/**
 * Login via UI
 *
 * Use when testing the actual login flow.
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/\/(dashboard|onboarding)/);
}

/**
 * Get stored auth token from page context
 *
 * FlowPulse uses Better Auth which stores session in cookies.
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((c) => c.name === 'better-auth.session');
  return sessionCookie?.value || null;
}

/**
 * Check if page is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await getAuthToken(page);
  return token !== null;
}

/**
 * Logout via UI
 */
export async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}
