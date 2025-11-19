# Performance Optimizations

This directory contains documentation for performance optimization strategies implemented across the platform.

## Quick Start

### Analyzing Bundle Size

To analyze the bundle size and identify optimization opportunities:

```bash
# From the root of the monorepo
npm run analyze

# Or from the web app directory
cd apps/web
npm run analyze
```

This will build the application with bundle analysis enabled and open interactive reports showing:
- Bundle size breakdown by route
- Chunk composition and dependencies
- Largest modules and packages
- Duplicate code detection

### Using Performance Utilities

The platform includes development-only performance monitoring utilities:

```tsx
import { measurePerformance, measurePerformanceAsync } from '@/lib/utils/performance'
import { PerformanceProfiler } from '@/components/common/PerformanceProfiler'

// Measure synchronous operations
const result = measurePerformance('data-processing', () => {
  return processData(input)
}, 10) // threshold in ms

// Measure async operations
const data = await measurePerformanceAsync('api-fetch', async () => {
  return await fetchFromAPI()
}, 100) // threshold in ms

// Profile component renders
function MyPage() {
  return (
    <PerformanceProfiler id="MyPage">
      <ExpensiveComponent />
    </PerformanceProfiler>
  )
}
```

## Documentation

See [performance-playbook.md](./performance-playbook.md) for:
- Detailed optimization strategies
- Code patterns and best practices
- Checklist for future PRs
- Monitoring and metrics guidelines
- Troubleshooting tips

## Current Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| First Load JS | < 100KB | 87.6KB | ✅ |
| Monaco Editor | Lazy Loaded | Lazy Loaded | ✅ |
| Quill Editor | Lazy Loaded | Lazy Loaded | ✅ |
| Static Asset Cache | Immutable | Immutable | ✅ |

## Key Optimizations Implemented

1. **Code Splitting**
   - Heavy editors (Monaco, Quill) dynamically imported
   - Improved loading states with spinners
   - SSR disabled for client-only components

2. **Memoization**
   - React.memo on frequently re-rendered components
   - useMemo/useCallback for expensive calculations
   - Stable object references to prevent re-renders

3. **Asset Optimization**
   - Modern image formats (AVIF, WebP)
   - Aggressive static asset caching
   - next/image for automatic optimization

4. **Monitoring**
   - Bundle analyzer integration
   - Performance profiling utilities
   - Development-only logging

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Standard production build |
| `npm run analyze` | Build with bundle analysis |
| `npm run type-check` | TypeScript validation |
| `npm run lint` | ESLint checks |

## Contributing

When adding new features or components, please:

1. Check bundle impact with `npm run analyze`
2. Use React.memo for frequently re-rendered components
3. Lazy load heavy dependencies (> 50KB)
4. Profile render performance in development
5. Update this documentation as needed

See the [performance playbook](./performance-playbook.md) for detailed guidelines.
