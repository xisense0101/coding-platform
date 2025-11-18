# Performance Playbook

This document outlines the performance optimization strategies implemented across the Next.js monorepo and provides guidelines for maintaining and improving performance in future PRs.

## Table of Contents

1. [Overview](#overview)
2. [Current Optimizations](#current-optimizations)
3. [Bundle Analysis](#bundle-analysis)
4. [Performance Patterns](#performance-patterns)
5. [Checklist for Future PRs](#checklist-for-future-prs)
6. [Monitoring & Metrics](#monitoring--metrics)

## Overview

This platform implements a comprehensive set of performance optimizations designed to:
- Reduce initial bundle size and improve Time to Interactive (TTI)
- Minimize Largest Contentful Paint (LCP) through code splitting
- Reduce unnecessary re-renders with memoization
- Optimize asset delivery with modern formats and caching

All optimizations are designed to be **incremental, safe, and reversible** without breaking existing functionality.

## Current Optimizations

### 1. Code Splitting & Lazy Loading

Heavy UI components are dynamically loaded to reduce the initial bundle size:

#### Monaco Editor (Code Editor)
**Location**: `src/components/editors/CodeEditor.tsx`

```tsx
const Editor = dynamic(
  () => import('@monaco-editor/react'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <div className="text-sm text-gray-600">Loading code editor...</div>
        </div>
      </div>
    )
  }
)
```

**Why**: Monaco Editor is ~3MB and only needed on coding problem pages. Lazy loading reduces initial bundle by ~80% on non-coding pages.

#### Quill Rich Text Editor
**Location**: `src/components/editors/RichTextEditor.tsx`

```tsx
const ReactQuill = dynamic(
  () => import('react-quill'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-40 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
          <div className="text-xs text-gray-600">Loading text editor...</div>
        </div>
      </div>
    )
  }
)
```

**Why**: Quill is ~500KB and only needed for rich text editing. Loading on-demand improves initial page load.

### 2. Image Optimization

**Configuration**: `next.config.js`

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  // ... domain configuration
}
```

**Usage**: Replace `<img>` with `<Image>` from `next/image`:

```tsx
import Image from 'next/image'

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority // Add for above-the-fold images
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 3. Static Asset Caching

**Configuration**: `next.config.js`

Aggressive caching for static assets:

```javascript
{
  source: '/_next/static/:path*',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    },
  ],
}
```

### 4. Module Import Optimization

**Configuration**: `next.config.js`

Tree-shaking for icon libraries:

```javascript
modularizeImports: {
  'lucide-react': {
    transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
  },
}
```

**Impact**: Imports only the icons used, not the entire library (~500KB savings).

### 5. Performance Utilities

**Locations**: 
- `src/lib/utils/performance.ts` - Utility functions for measuring performance
- `src/components/common/PerformanceProfiler.tsx` - React Profiler wrapper component

#### Measuring Function Performance

```tsx
import { measurePerformance, measurePerformanceAsync } from '@/lib/utils/performance'

// Synchronous functions
const result = measurePerformance('expensive-calculation', () => {
  return calculateSomething()
}, 10) // threshold in ms

// Async functions
const data = await measurePerformanceAsync('api-call', async () => {
  return await fetchData()
}, 100) // threshold in ms
```

#### Profiling Component Renders

```tsx
import { PerformanceProfiler } from '@/components/common/PerformanceProfiler'

export function MyPage() {
  return (
    <PerformanceProfiler id="MyPage">
      <ExpensiveComponent />
    </PerformanceProfiler>
  )
}
```

**Note**: Performance utilities only run in development mode and are automatically disabled in production.

## Bundle Analysis

### Running Bundle Analyzer

To analyze the bundle size and composition:

```bash
# From the root of the monorepo
npm run analyze

# Or directly in the web app
cd apps/web
npm run analyze
```

This will:
1. Build the application with bundle analysis enabled
2. Generate interactive HTML reports for client and server bundles
3. Open reports in your default browser
4. Show visual treemap of bundle composition

### Interpreting Results

Look for:
- **Large chunks**: Modules > 200KB that could be code-split
- **Duplicate code**: Same library imported in multiple chunks
- **Unused code**: Libraries included but not used
- **Heavy dependencies**: Third-party packages that could be replaced

### Target Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| First Load JS (main) | < 100KB | ~87KB | ✅ |
| Monaco Editor chunk | Lazy loaded | Lazy loaded | ✅ |
| Quill Editor chunk | Lazy loaded | Lazy loaded | ✅ |
| Total JS (initial) | < 200KB | ~180KB | ✅ |

## Performance Patterns

### Pattern 1: Lazy Load Heavy Components

**When to use**: Components that:
- Are > 50KB in size
- Are not needed on initial render
- Are used only in specific user flows

**Implementation**:

```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  {
    loading: () => <Skeleton />,
    ssr: false // if SSR is not needed
  }
)
```

### Pattern 2: React.memo for Pure Components

**When to use**: Components that:
- Re-render frequently
- Have stable props
- Are pure (same props → same output)

**Implementation**:

```tsx
import { memo } from 'react'

const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* ... */}</div>
})
```

**Example use cases**:
- List items that don't change often
- Visualization components
- Forms with many fields

### Pattern 3: useMemo for Expensive Calculations

**When to use**:
- Calculations that take > 5ms
- Filtering/sorting large arrays
- Complex data transformations

**Implementation**:

```tsx
import { useMemo } from 'react'

const filteredData = useMemo(() => {
  return data.filter(item => item.active).sort((a, b) => a.date - b.date)
}, [data]) // Only recalculate when data changes
```

### Pattern 4: useCallback for Stable Functions

**When to use**:
- Callbacks passed to child components
- Functions used as dependencies in useEffect
- Event handlers passed to memoized children

**Implementation**:

```tsx
import { useCallback } from 'react'

const handleClick = useCallback((id) => {
  // Handle click
}, []) // Dependencies array
```

### Pattern 5: Suspense Boundaries

**When to use**:
- Async data loading
- Code-split routes
- Progressive content loading

**Implementation**:

```tsx
import { Suspense } from 'react'

<Suspense fallback={<LoadingSkeleton />}>
  <AsyncComponent />
</Suspense>
```

## Checklist for Future PRs

Use this checklist when adding new features or components:

### Before Implementation

- [ ] Identify if new dependencies are needed
- [ ] Check dependency size (use [bundlephobia.com](https://bundlephobia.com))
- [ ] Consider lighter alternatives
- [ ] Plan for code splitting if dependency > 50KB

### During Implementation

- [ ] Use `next/image` for images (not `<img>`)
- [ ] Add `priority` prop to above-the-fold images
- [ ] Lazy load heavy components with `next/dynamic`
- [ ] Use `React.memo` for frequently re-rendering components
- [ ] Use `useMemo` for expensive calculations
- [ ] Use `useCallback` for stable function references
- [ ] Avoid inline object/array creation in render

### Before PR Submission

- [ ] Run `npm run analyze` to check bundle impact
- [ ] Verify no bundle size increase > 10% without justification
- [ ] Run `npm run build` to ensure no build errors
- [ ] Run `npm run type-check` to verify types
- [ ] Test on slow 3G network (Chrome DevTools)
- [ ] Verify no layout shifts (CLS)
- [ ] Check Lighthouse score (aim for 90+)

### Code Review Focus

- [ ] Are there any large synchronous imports?
- [ ] Are expensive operations memoized?
- [ ] Are event handlers causing unnecessary re-renders?
- [ ] Is data fetching optimized?
- [ ] Are there any prop drilling anti-patterns?

## Monitoring & Metrics

### Development Monitoring

During development, monitor:
- Build time (should stay < 60s for full build)
- Hot reload time (should be < 1s for most changes)
- Type-check time (should be < 15s)

### Production Metrics

Key metrics to track:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTI (Time to Interactive)**: < 3.5s
- **Bundle Size**: < 200KB initial JS

### Tools

1. **Chrome DevTools**
   - Performance tab for profiling
   - Lighthouse for audits
   - Network tab for asset sizes

2. **Next.js Bundle Analyzer**
   ```bash
   npm run analyze
   ```

3. **Lighthouse CI** (future)
   - Automated performance testing in CI/CD
   - Performance budgets
   - Regression detection

### Performance Budget

| Asset Type | Budget | Current |
|------------|--------|---------|
| JavaScript (initial) | 200KB | ~180KB |
| JavaScript (total) | 800KB | ~600KB |
| CSS | 50KB | ~30KB |
| Images (per page) | 500KB | ~200KB |
| Fonts | 100KB | ~0KB (system fonts) |

## Best Practices Summary

1. **Code Splitting**
   - Use dynamic imports for routes and heavy components
   - Leverage Next.js automatic code splitting
   - Monitor chunk sizes with bundle analyzer

2. **Asset Optimization**
   - Use `next/image` for automatic optimization
   - Prefer modern formats (AVIF, WebP)
   - Add proper caching headers

3. **Rendering Optimization**
   - Memoize expensive computations
   - Use React.memo for pure components
   - Avoid unnecessary re-renders

4. **Data Fetching**
   - Use SWR or React Query for caching
   - Implement request deduplication
   - Add proper loading states

5. **Third-Party Scripts**
   - Use `next/script` with appropriate strategy
   - Lazy load analytics and tracking
   - Minimize third-party dependencies

## Resources

- [Next.js Performance Docs](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Bundle Size Optimization](https://web.dev/reduce-javascript-payloads-with-code-splitting/)

## Troubleshooting

### Bundle Size Increased Unexpectedly

1. Run bundle analyzer: `npm run analyze`
2. Compare with previous build
3. Check for new dependencies
4. Verify tree-shaking is working
5. Look for duplicate code

### Page Load Slow

1. Check Network tab for large assets
2. Verify images are optimized
3. Check for render-blocking resources
4. Profile with React DevTools
5. Check for expensive operations in render

### Build Time Increased

1. Check for new heavy dependencies
2. Verify TypeScript compilation time
3. Check for circular dependencies
4. Review webpack configuration
5. Consider incremental builds

---

**Last Updated**: November 2025
**Maintainer**: Development Team
