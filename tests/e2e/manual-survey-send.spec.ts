import { test, expect } from "@playwright/test";

test.describe("Manual Survey Send UI (Story 3.10)", () => {
  test.describe("AC #1: Modal with phone input", () => {
    test.skip("opens send modal for manual trigger survey", async ({ page }) => {
      await page.goto("/surveys/test-survey-id");

      await page.click('[data-testid="send-survey-button"]');

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByTestId("phone-input")).toBeVisible();
      await expect(page.getByTestId("country-code-trigger")).toBeVisible();
    });
  });

  test.describe("AC #3: Invalid phone validation", () => {
    test.skip("shows validation error for invalid phone", async ({ page }) => {
      await page.goto("/surveys/test-survey-id");
      await page.click('[data-testid="send-survey-button"]');

      await page.fill('[data-testid="phone-input"]', "123");
      await page.click('button[type="submit"]');

      await expect(page.getByTestId("phone-error")).toBeVisible();
      await expect(page.getByTestId("phone-error")).toContainText(/invalid/i);
    });
  });

  test.describe("AC #4: Disabled button for inactive survey", () => {
    test.skip("shows disabled button with tooltip for inactive survey", async ({ page }) => {
      await page.goto("/surveys/inactive-survey-id");

      const sendButton = page.getByTestId("send-survey-button");
      await expect(sendButton).toBeDisabled();

      await sendButton.hover();
      await expect(page.getByText(/activate/i)).toBeVisible();
    });
  });

  test.describe("AC #5: Optional metadata fields", () => {
    test.skip("shows optional metadata fields in modal", async ({ page }) => {
      await page.goto("/surveys/test-survey-id");
      await page.click('[data-testid="send-survey-button"]');

      await expect(page.getByTestId("customer-name-input")).toBeVisible();
      await expect(page.getByTestId("order-id-input")).toBeVisible();
    });
  });
});
