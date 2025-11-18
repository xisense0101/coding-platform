# Coding Platform

A comprehensive educational platform for secure exams, coding challenges, and course management.

## Prerequisites

- Node.js >= 18.17.0
- npm >= 9.0.0

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Testing

This project includes a comprehensive test suite with unit, component, and E2E tests.

### Running Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with headed browser (see UI)
npm run test:e2e:headed

# Run E2E tests with Playwright UI for debugging
npm run test:e2e:ui
```

### Test Structure

- **Unit Tests**: Located alongside source files (`.test.ts`, `.test.tsx`)
- **Component Tests**: In component directories (`.test.tsx`)
- **E2E Tests**: In `apps/web/e2e/` directory

### Test Technologies

- **Vitest** - Fast unit test framework
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **jsdom** - DOM simulation

For detailed testing guidelines, see [docs/testing-strategy.md](./docs/testing-strategy.md).

## Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## CI/CD

GitHub Actions automatically runs:
- Type checking
- Linting
- Unit tests (blocking)
- E2E tests (non-blocking)

on every push and pull request.

## Project Structure

```
.
├── apps/
│   └── web/              # Next.js application
│       ├── e2e/          # E2E tests
│       ├── src/
│       │   ├── app/      # Next.js App Router pages
│       │   ├── components/ # React components with tests
│       │   └── lib/      # Utility functions with tests
│       ├── playwright.config.ts
│       └── vitest.config.ts
├── docs/
│   └── testing-strategy.md  # Comprehensive testing guide
└── .github/
    └── workflows/
        └── ci.yml        # CI/CD pipeline

```

## Documentation

- [Testing Strategy](./docs/testing-strategy.md) - Complete guide to writing and running tests

## Contributing

1. Write tests for new features
2. Ensure all tests pass: `npm run test`
3. Verify type safety: `npm run type-check`
4. Run linting: `npm run lint`
5. Create a pull request

## License

Proprietary - All rights reserved
