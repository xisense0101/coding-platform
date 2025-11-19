# Testing Strategy

This document outlines the testing strategy for the coding platform monorepo, including guidelines for writing and running tests.

## Testing Pyramid

We follow the testing pyramid approach with three layers:

1. **Unit Tests** (Base) - Fast, isolated tests for individual functions and components
2. **Integration Tests** (Middle) - Tests for interactions between components
3. **E2E Tests** (Top) - Smoke tests for critical user flows

## Test Technologies

### Unit & Component Testing
- **Vitest** - Fast unit test framework with native ESM support
- **React Testing Library** - Component testing with user-centric queries
- **@testing-library/jest-dom** - Custom matchers for DOM assertions
- **@testing-library/user-event** - Simulate user interactions
- **jsdom** - Simulated browser environment

### E2E Testing
- **Playwright** - Cross-browser E2E testing framework
- **Chromium** - Primary browser for E2E tests in CI

## Running Tests

### Unit & Component Tests

From the repository root:
```bash
# Run all unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

From apps/web workspace:
```bash
cd apps/web

# Run unit tests
npm run test:unit

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### E2E Tests

From the repository root:
```bash
# Run E2E tests (headless)
npm run test:e2e
```

From apps/web workspace:
```bash
cd apps/web

# Run E2E tests (headless)
npm run test:e2e

# Run with headed browser
npm run test:e2e:headed

# Run with Playwright UI
npm run test:e2e:ui

# Run for CI
npm run test:e2e:ci
```

## Writing Tests

### Unit Tests

Unit tests should be colocated with the code they test, using the `.test.ts` or `.test.tsx` extension.

**Example - Utility function test:**

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatBytes } from './utils'

describe('formatBytes', () => {
  it('formats 0 bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
  })

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })
})
```

### Component Tests

Component tests should test behavior, not implementation details.

**Example - Button component test:**

```typescript
// src/components/ui/button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
```

### E2E Tests

E2E tests should focus on critical user flows and smoke testing. Place them in the `e2e/` directory.

**Example - Home page smoke test:**

```typescript
// e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load and display title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Secure Exam Platform/)
    
    const heading = page.getByRole('heading', { name: /Secure Exam Platform/i, level: 1 })
    await expect(heading).toBeVisible()
  })
})
```

## Testing Conventions

### Test IDs

When semantic queries (role, text, label) are insufficient, add `data-testid` attributes:

```tsx
<button data-testid="submit-form">Submit</button>
```

Query in tests:
```typescript
screen.getByTestId('submit-form')
```

**Use sparingly** - prefer semantic queries when possible:
- `getByRole`
- `getByLabelText`
- `getByText`
- `getByPlaceholderText`

### Mocks and Fixtures

#### Mocking External Services

For tests requiring external services (database, APIs), use mocks:

```typescript
import { vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mocked' }),
  })
) as any
```

#### Test Fixtures

Store reusable test data in separate files:

```typescript
// src/test/fixtures/users.ts
export const mockUser = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
}
```

### Component Testing Best Practices

1. **Test user behavior, not implementation**
   - ✅ Good: Test that clicking a button shows a modal
   - ❌ Bad: Test internal component state

2. **Use accessible queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - This ensures components are accessible

3. **Avoid testing third-party libraries**
   - Don't test Radix UI components
   - Test your usage of them

4. **Keep tests simple and readable**
   - One assertion per test when possible
   - Clear test names describing expected behavior

### E2E Testing Best Practices

1. **Test critical paths only**
   - User registration and login
   - Core exam-taking flow
   - Course enrollment
   - Key admin actions

2. **Keep tests fast and stable**
   - Use `waitForSelector` with reasonable timeouts
   - Avoid hard-coded delays
   - Use test IDs for dynamic content

3. **Test one thing at a time**
   - Each test should validate one user flow
   - Use setup functions for common actions

4. **Handle test data carefully**
   - Use unique identifiers (timestamps, UUIDs)
   - Clean up after tests when possible
   - Use test-specific accounts

## CI/CD Integration

### Continuous Integration

Our GitHub Actions workflow (`ci.yml`) runs:

1. **Type checking** - Ensures TypeScript types are valid
2. **Linting** - Checks code style and quality
3. **Unit tests** - Runs all unit and component tests (blocking)
4. **E2E tests** - Runs smoke tests (non-blocking initially)

Tests run on:
- Node.js 18.x
- Node.js 20.x

### Test Artifacts

CI automatically uploads:
- Test coverage reports
- Playwright HTML reports
- Test traces (on failure)

Access artifacts from the GitHub Actions run summary.

## Coverage Goals

While we don't enforce strict coverage percentages initially, aim for:
- **Utilities**: 80%+ coverage
- **Components**: 70%+ coverage
- **Critical paths**: 100% E2E coverage

Use coverage reports to identify gaps:
```bash
npm run test:coverage
```

## Debugging Tests

### Unit Tests

Run in watch mode for rapid feedback:
```bash
npm run test:watch
```

Use `test.only` to focus on specific tests:
```typescript
it.only('should test this specific case', () => {
  // ...
})
```

### E2E Tests

Run with headed browser:
```bash
cd apps/web && npm run test:e2e:headed
```

Use Playwright UI for step-by-step debugging:
```bash
cd apps/web && npm run test:e2e:ui
```

View traces after failures:
```bash
npx playwright show-trace test-results/*/trace.zip
```

## Environment Setup

### Local Development

Ensure you have:
- Node.js >= 18.17.0
- npm >= 9.0.0

Install dependencies:
```bash
npm install
```

For E2E tests, Playwright browsers are installed automatically:
```bash
cd apps/web && npx playwright install chromium
```

### CI Environment

The CI workflow automatically:
- Caches Playwright browsers
- Sets up proper Node versions
- Installs all dependencies
- Configures test environments

## Future Improvements

As the test infrastructure matures, we plan to:

1. **Increase E2E coverage**
   - Add tests for auth flows
   - Add tests for exam-taking flows
   - Add tests for admin actions

2. **Add visual regression testing**
   - Integrate Playwright visual comparisons
   - Track UI changes over time

3. **Improve test performance**
   - Parallelize more tests
   - Optimize setup/teardown
   - Use test sharding for large suites

4. **Make E2E blocking in CI**
   - Once stable and comprehensive
   - Current non-blocking status is temporary

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Questions?

For questions or suggestions about testing strategy, please:
1. Check this document first
2. Review existing test examples
3. Open a discussion in GitHub
4. Contact the development team
