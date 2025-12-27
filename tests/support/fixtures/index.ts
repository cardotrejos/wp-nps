/**
 * FlowPulse Test Fixtures
 *
 * Extends Playwright base test with project-specific fixtures.
 * Pattern: Pure function → fixture → mergeTests composition
 *
 * Usage in tests:
 *   import { test, expect } from '../support/fixtures';
 */
import { test as base, type Page } from '@playwright/test';
import { UserFactory } from './factories/user-factory';
import { SurveyFactory } from './factories/survey-factory';

// Define fixture types
type TestFixtures = {
  userFactory: UserFactory;
  surveyFactory: SurveyFactory;
  authenticatedPage: Page;
};

// Extend base test with FlowPulse fixtures
export const test = base.extend<TestFixtures>({
  // User factory with auto-cleanup
  userFactory: async ({}, use) => {
    const factory = new UserFactory();
    await use(factory);
    await factory.cleanup();
  },

  // Survey factory with auto-cleanup
  surveyFactory: async ({}, use) => {
    const factory = new SurveyFactory();
    await use(factory);
    await factory.cleanup();
  },

  // Pre-authenticated page fixture
  authenticatedPage: async ({ page, userFactory }, use) => {
    // Create test user
    const user = await userFactory.createUser();

    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.password);
    await page.click('[data-testid="login-button"]');

    // Wait for auth to complete
    await page.waitForURL(/\/(dashboard|onboarding)/);

    await use(page);
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';
