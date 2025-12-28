/**
 * Example E2E Tests for FlowPulse
 *
 * Demonstrates test patterns from project-context.md:
 * - Fixture usage (userFactory, surveyFactory)
 * - Selector strategy (data-testid)
 * - Test isolation with auto-cleanup
 */
import { test, expect } from "../support/fixtures";
import { dashboard, auth } from "../support/helpers/selectors";

test.describe("Homepage", () => {
  test("should load and display hero content", async ({ page }) => {
    await page.goto("/");

    // Verify page loaded
    await expect(page).toHaveTitle(/FlowPulse/i);

    // Check for call-to-action
    await expect(page.locator("text=Get Started")).toBeVisible();
  });
});

test.describe("Authentication", () => {
  test("should show login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator(auth.emailInput)).toBeVisible();
    await expect(page.locator(auth.passwordInput)).toBeVisible();
    await expect(page.locator(auth.loginButton)).toBeVisible();
  });

  test("should create user and login successfully", async ({ page, userFactory }) => {
    // Create test user (auto-cleaned up after test)
    const user = await userFactory.createUser();

    // Navigate to login
    await page.goto("/login");

    // Fill form
    await page.fill(auth.emailInput, user.email);
    await page.fill(auth.passwordInput, user.password);
    await page.click(auth.loginButton);

    // Should redirect to dashboard or onboarding
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill(auth.emailInput, "nonexistent@example.com");
    await page.fill(auth.passwordInput, "wrongpassword");
    await page.click(auth.loginButton);

    // Should show error message
    await expect(page.locator("text=Invalid credentials")).toBeVisible();
  });
});

test.describe("Dashboard", () => {
  test("should display NPS score for authenticated user", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard");

    // Wait for dashboard to load
    await expect(authenticatedPage.locator(dashboard.npsScore)).toBeVisible();

    // NPS ring should be visible
    await expect(authenticatedPage.locator(dashboard.npsRing)).toBeVisible();
  });

  test("should show empty state for new organization", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard");

    // New org should show "send your first survey" prompt
    await expect(authenticatedPage.locator("text=Your first insights await")).toBeVisible();
  });
});

test.describe("Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test("should show bottom navigation on mobile", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard");

    // Bottom nav should be visible on mobile
    await expect(authenticatedPage.locator(dashboard.bottomNav)).toBeVisible();
  });
});
