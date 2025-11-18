# CI/CD Runbook

## Overview

This document describes the Continuous Integration and Continuous Deployment (CI/CD) strategy for the Coding Platform. Currently, there are **no GitHub Actions workflows configured**, but this document outlines the recommended CI/CD pipeline structure.

## Current State

### What Exists

- ✅ Turbo monorepo setup for build orchestration
- ✅ TypeScript configuration for type checking
- ✅ ESLint configuration for code linting
- ✅ Next.js build configuration
- ✅ Package scripts for common tasks

### What's Missing

- ❌ GitHub Actions workflows
- ❌ Automated testing (unit, integration, E2E)
- ❌ Automated deployment pipelines
- ❌ Pull request checks
- ❌ Release automation

## Recommended CI/CD Pipeline

### CI Pipeline Stages

```
┌─────────────────────────────────────────────────────┐
│              Pull Request Trigger                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│  Stage 1: Install & Cache Dependencies              │
│  - npm install                                      │
│  - Cache node_modules                               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│  Stage 2: Lint & Type Check (Parallel)              │
│  - npm run lint                                     │
│  - npm run type-check                               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│  Stage 3: Build                                      │
│  - npm run build                                    │
│  - Cache .next and .turbo                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│  Stage 4: Tests (Parallel - Future)                 │
│  - Unit tests                                       │
│  - Integration tests                                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│  Stage 5: E2E Tests (Non-blocking - Future)         │
│  - Playwright/Cypress tests                         │
│  - Run on merge to main                             │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│  Stage 6: Deploy Preview (Future)                   │
│  - Deploy to Vercel preview                         │
│  - Comment PR with preview URL                      │
└─────────────────────────────────────────────────────┘
```

## Recommended GitHub Actions Workflows

### 1. Pull Request CI Workflow

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint-and-typecheck:
    name: Lint and Type Check
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: apps/web/.next
          retention-days: 7

  # Future: Unit and Integration Tests
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      # Uncomment when tests are added
      # - name: Run unit tests
      #   run: npm run test
      # 
      # - name: Run integration tests
      #   run: npm run test:integration
      # 
      # - name: Upload coverage
      #   uses: codecov/codecov-action@v3
```

### 2. E2E Tests Workflow (Non-blocking)

**File**: `.github/workflows/e2e.yml`

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e:
    name: E2E Tests (Non-blocking)
    runs-on: ubuntu-latest
    continue-on-error: true  # Non-blocking
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      # Future: Playwright E2E tests
      # - name: Install Playwright
      #   run: npx playwright install --with-deps
      # 
      # - name: Run E2E tests
      #   run: npm run e2e
      #   env:
      #     NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
      #     NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
      # 
      # - name: Upload test results
      #   if: always()
      #   uses: actions/upload-artifact@v4
      #   with:
      #     name: playwright-report
      #     path: playwright-report/
```

### 3. Deploy Production Workflow

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy Production

on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
      
      # If using Vercel CLI
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
      
      # Or use Vercel GitHub integration (recommended)
      # Vercel will automatically deploy on push to main
```

## Node.js Version Matrix

### Recommended Strategy

Test against multiple Node.js versions to ensure compatibility:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

**Rationale:**
- **18.x**: Current LTS, minimum required version
- **20.x**: Latest LTS, future-proofing

### CI Job Matrix Example

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

## Caching Strategy

### npm Dependencies

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 18.x
    cache: 'npm'
```

**What gets cached:**
- `~/.npm`
- Speeds up `npm ci`

### Turbo Cache

```yaml
- name: Cache Turbo
  uses: actions/cache@v4
  with:
    path: |
      .turbo
      apps/web/.next/cache
    key: ${{ runner.os }}-turbo-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-turbo-
```

**Benefits:**
- Faster builds (incremental)
- Skip unchanged packages
- Reduce CI time by 50%+

### Next.js Build Cache

```yaml
- name: Cache Next.js
  uses: actions/cache@v4
  with:
    path: apps/web/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-
```

## Artifacts

### Build Artifacts

Store build outputs for deployment or debugging:

```yaml
- name: Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-${{ github.sha }}
    path: |
      apps/web/.next
      !apps/web/.next/cache
    retention-days: 7
```

### Test Reports

```yaml
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: |
      coverage/
      playwright-report/
    retention-days: 14
```

## Environment Variables & Secrets

### Required Secrets

Configure in GitHub Settings → Secrets and variables → Actions:

**Build Secrets:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Deployment Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Optional Secrets:**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `MAILJET_API_KEY`
- `MAILJET_API_SECRET`
- `JUDGE0_API_KEY`

### Environment Variables in Workflow

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  NODE_ENV: production
```

## Status Checks

### Required Checks for PR Merge

Configure in GitHub Settings → Branches → Branch protection rules:

**Status checks:**
- ✅ Lint and Type Check (Node 18.x)
- ✅ Lint and Type Check (Node 20.x)
- ✅ Build
- ✅ Tests (when implemented)

**Optional checks:**
- E2E Tests (non-blocking)

### Branch Protection Rules

**Recommended settings:**
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators
- ❌ Allow force pushes (disabled)
- ❌ Allow deletions (disabled)

## Deployment Strategy

### Vercel Integration (Recommended)

**Benefits:**
- Automatic preview deployments for PRs
- Production deployments on merge to main
- Edge network (fast global access)
- Automatic HTTPS
- Zero configuration

**Setup:**
1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Vercel handles deployments automatically

**Preview Deployments:**
- Every PR gets unique URL
- Automatically comments on PR with link
- Isolated environment for testing

**Production Deployment:**
- Automatic on push to `main`
- Or manual promotion from preview

### Alternative: Manual Deployment

**Using Vercel CLI:**
```bash
# Install CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Using Docker:**
```bash
# Build image
docker build -t coding-platform .

# Run container
docker run -p 3000:3000 coding-platform
```

## Monitoring & Alerts

### Build Notifications

**Slack Integration:**
```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "Build failed on ${{ github.ref }}"
      }
```

### Email Notifications

Configure in GitHub Settings → Notifications:
- Enable for failed workflow runs
- Team members get notified on failure

## Performance Benchmarks

### Typical CI Times

**Without cache:**
- Install: 2-3 minutes
- Lint + Type check: 30-60 seconds
- Build: 1-2 minutes
- **Total**: ~4-6 minutes

**With cache:**
- Install: 20-30 seconds
- Lint + Type check: 30-60 seconds
- Build: 30-60 seconds (Turbo cache)
- **Total**: ~1.5-2.5 minutes

### Optimization Tips

1. **Use caching**: npm, Turbo, Next.js
2. **Parallel jobs**: Run lint/typecheck in parallel
3. **Matrix strategy**: Test multiple Node versions efficiently
4. **Fail fast**: Stop other jobs on critical failure
5. **Skip unchanged**: Turbo only builds changed packages

## Troubleshooting CI

### Build Fails Locally But Passes in CI

**Causes:**
- Different Node.js version
- Missing environment variables
- OS-specific issues

**Solutions:**
```bash
# Match CI Node version
nvm use 18

# Clean install
rm -rf node_modules
npm ci

# Check env vars
cat .env.local
```

### Build Passes Locally But Fails in CI

**Causes:**
- Missing files in git
- Environment variables not set in GitHub Secrets
- Dependencies not in package.json

**Solutions:**
```bash
# Check git status
git status

# Verify all dependencies are listed
npm run build
```

### Cache Issues

**Symptoms:**
- Slow builds
- Stale dependencies
- Build inconsistencies

**Solutions:**
- Clear cache in GitHub Actions UI
- Update cache key
- Verify cache restore logic

### Timeout Issues

**Solutions:**
```yaml
jobs:
  build:
    timeout-minutes: 30  # Default is 360
```

## Testing Strategy (Future)

### Unit Tests

**Framework**: Jest + React Testing Library

**Coverage Requirements:**
- Overall: 80%+
- New code: 90%+
- Critical paths: 100%

**Run in CI:**
```yaml
- name: Run unit tests
  run: npm test -- --coverage --maxWorkers=2
```

### Integration Tests

**Framework**: Jest + Supertest (API testing)

**Focus:**
- API endpoints
- Database interactions
- External service mocks

### E2E Tests (Non-blocking)

**Framework**: Playwright or Cypress

**Why non-blocking:**
- Longer execution time (5-15 minutes)
- Potential flakiness
- Less critical for merge
- Run async, results reviewed later

**Configuration:**
```yaml
continue-on-error: true  # Non-blocking
```

## Rollback Strategy

### Vercel Rollback

1. Go to Vercel dashboard
2. Deployments tab
3. Find previous working deployment
4. Click "Promote to Production"

### Git Rollback

```bash
# Revert last commit
git revert HEAD
git push

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force  # Only if no protection rules
```

## Related Documentation

- [Local Development Runbook](./local-development.md)
- [Operations Runbook](./operations.md)
- [Architecture Overview](../architecture/overview.md)

## Future Enhancements

1. **Test Coverage Reports**: Codecov/Coveralls integration
2. **Performance Monitoring**: Lighthouse CI
3. **Security Scanning**: Snyk/Dependabot
4. **Bundle Size Tracking**: Size-limit checks
5. **Visual Regression**: Chromatic/Percy
6. **Automated Releases**: Semantic-release
7. **Canary Deployments**: Gradual rollouts
8. **Database Migrations**: Automated migration checks
