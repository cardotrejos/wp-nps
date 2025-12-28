# FlowPulse E2E Test Suite

End-to-end testing infrastructure for FlowPulse, the WhatsApp-native customer feedback platform.

## Quick Start

```bash
# Install Playwright and browsers
bun add -d @playwright/test
bunx playwright install

# Copy environment configuration
cp tests/.env.example tests/.env

# Run tests
bun run test:e2e
```

## Directory Structure

```
tests/
├── e2e/                      # E2E test files
│   └── example.spec.ts       # Example tests demonstrating patterns
├── support/                  # Test infrastructure
│   ├── fixtures/             # Playwright fixtures
│   │   ├── index.ts          # Main fixture export
│   │   └── factories/        # Data factories
│   │       ├── user-factory.ts
│   │       └── survey-factory.ts
│   ├── helpers/              # Utility functions
│   │   ├── auth.ts           # Authentication helpers
│   │   └── selectors.ts      # Centralized selectors
│   └── page-objects/         # Page object models (optional)
├── .env.example              # Environment template
└── README.md                 # This file
```

## Running Tests

```bash
# Run all tests
bun run test:e2e

# Run with UI (interactive)
bunx playwright test --ui

# Run headed (see browser)
bunx playwright test --headed

# Run specific file
bunx playwright test tests/e2e/example.spec.ts

# Run specific test
bunx playwright test -g "should load homepage"

# Debug mode
bunx playwright test --debug

# Generate HTML report
bunx playwright show-report
```

## Test Patterns

### Fixture Architecture

Tests use the fixture pattern for data setup and auto-cleanup:

```typescript
import { test, expect } from '../support/fixtures';

test('example with fixtures', async ({ page, userFactory }) => {
  // Create test data (auto-cleaned after test)
  const user = await userFactory.createUser();

  // Test with created data
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', user.email);
  // ...
});
```

### Selector Strategy

**Always use `data-testid` attributes** for stable, refactor-proof selectors:

```typescript
import { auth, dashboard } from '../support/helpers/selectors';

// Use centralized selectors
await page.click(auth.loginButton);
await expect(page.locator(dashboard.npsScore)).toBeVisible();
```

When adding new UI elements, add `data-testid`:

```tsx
<Button data-testid="submit-survey">Submit</Button>
```

### Test Isolation

Each test runs in isolation:

- Fresh browser context per test
- Factories auto-cleanup created data
- No shared state between tests

### Authenticated Tests

Use the `authenticatedPage` fixture for tests requiring login:

```typescript
test('dashboard test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // User is already logged in
});
```

## Configuration

### Timeouts

| Type       | Duration | Purpose                   |
| ---------- | -------- | ------------------------- |
| Action     | 15s      | Button clicks, form fills |
| Navigation | 30s      | Page loads                |
| Test       | 60s      | Full test execution       |
| Assertion  | 15s      | expect() statements       |

### Browser Projects

Tests run against multiple browsers/devices:

- `chromium` - Desktop Chrome
- `firefox` - Desktop Firefox
- `webkit` - Desktop Safari
- `mobile-chrome` - Pixel 5 (Android)
- `mobile-safari` - iPhone 13 (iOS)

Run specific project:

```bash
bunx playwright test --project=mobile-chrome
```

### Artifacts

Artifacts are captured **on failure only**:

- Screenshots: `test-results/`
- Videos: `test-results/`
- Traces: `test-results/`

View trace for debugging:

```bash
bunx playwright show-trace test-results/trace.zip
```

## Writing Tests

### Best Practices

1. **One assertion per concept** - Keep tests focused
2. **Use data-testid** - Avoid CSS/XPath selectors
3. **Test user flows** - Not implementation details
4. **Auto-cleanup** - Use factories with cleanup
5. **Explicit waits** - Avoid arbitrary `sleep()`

### Example Test

```typescript
import { test, expect } from '../support/fixtures';
import { survey } from '../support/helpers/selectors';

test.describe('Survey Creation', () => {
  test('should create NPS survey from template', async ({
    authenticatedPage,
    surveyFactory,
  }) => {
    await authenticatedPage.goto('/surveys/new');

    // Select template
    await authenticatedPage.click(survey.templateCard);

    // Fill survey name
    await authenticatedPage.fill('[data-testid="survey-name"]', 'My NPS Survey');

    // Publish
    await authenticatedPage.click(survey.publishButton);

    // Verify success
    await expect(authenticatedPage.locator('text=Survey published')).toBeVisible();
  });
});
```

## CI/CD Integration

Tests run in CI with:

- Single worker (sequential execution)
- 2 retries on failure
- JUnit XML output for test reporting

GitHub Actions example:

```yaml
- name: Run E2E Tests
  run: bun run test:e2e
  env:
    BASE_URL: ${{ secrets.TEST_BASE_URL }}
```

## Debugging

### View Trace

```bash
bunx playwright show-trace test-results/trace.zip
```

### Debug Mode

```bash
bunx playwright test --debug
```

### Headed Mode

```bash
bunx playwright test --headed
```

### Pause on Failure

```typescript
test('debug example', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Opens Inspector
});
```

## Knowledge Base References

- Fixture architecture: `_bmad/bmm/testarch/knowledge/fixture-architecture.md`
- Data factories: `_bmad/bmm/testarch/knowledge/data-factories.md`
- Network-first testing: `_bmad/bmm/testarch/knowledge/network-first.md`
- Playwright config: `_bmad/bmm/testarch/knowledge/playwright-config.md`

---

**Framework:** Playwright Test
**Generated:** 2025-12-26
**Project:** FlowPulse (wp-nps)
