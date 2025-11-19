# Local Development Runbook

## Prerequisites

### Required Software

#### 1. Node.js (LTS)
- **Version**: >= 18.17.0
- **Recommended**: 18.x or 20.x LTS
- **Check version**: `node --version`

**Installation:**
- **macOS**: `brew install node@18` or use [nvm](https://github.com/nvm-sh/nvm)
- **Windows**: Download from [nodejs.org](https://nodejs.org)
- **Linux**: Use nvm or package manager

#### 2. npm
- **Version**: >= 9.0.0
- **Check version**: `npm --version`
- **Update**: `npm install -g npm@latest`

#### 3. Git
- **Check version**: `git --version`
- **Installation**: [git-scm.com](https://git-scm.com)

### Recommended Tools

- **VS Code**: With extensions for ESLint, Prettier, Tailwind CSS IntelliSense
- **Browser**: Chrome/Edge with React DevTools
- **Database Client**: [Supabase Studio](https://supabase.com/docs/guides/platform/studio) or pgAdmin

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/xisense0101/coding-platform.git
cd coding-platform
```

### 2. Install Dependencies

```bash
# Install all dependencies (root + workspaces)
npm install
```

**What this does:**
- Installs Turbo and root dependencies
- Installs dependencies for `apps/web`
- Creates `node_modules` directories
- Generates `package-lock.json`

**Expected output:**
```
added 534 packages, and audited 536 packages in 26s
```

### 3. Environment Variables

#### Copy Environment Template

```bash
cd apps/web
cp .env.example .env.local
```

#### Required Variables

Edit `apps/web/.env.local` with your values:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application URL (Required)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Redis (Optional - for caching)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Email Service (Optional - for notifications)
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_API_SECRET=your_mailjet_api_secret
FROM_EMAIL=noreply@yourplatform.com
FROM_NAME=Coding Platform

# Judge0 API (Optional - for code execution)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_judge0_api_key

# Development
NODE_ENV=development
```

#### Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

#### Optional Services

**Redis (Upstash)**:
1. Create account at [Upstash](https://upstash.com)
2. Create Redis database
3. Copy REST URL and token
4. App will work without Redis (caching disabled)

**Mailjet**:
1. Create account at [Mailjet](https://mailjet.com)
2. Get API key and secret
3. Only needed for email features

**Judge0**:
1. Get API key from [RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce/)
2. Only needed for code execution features

### 4. Database Setup

#### Run Migrations (if any)

```bash
# Check if migrations exist
ls apps/web/database_schema/

# Apply schema via Supabase Studio or SQL editor
# Or use migration tool if configured
```

#### Verify Database

Check that these tables exist:
- `users`
- `organizations`
- `courses`
- `exams`
- `submissions`

### 5. Verify Installation

```bash
# From root directory
npm run type-check
```

Expected output:
```
• Packages in scope: @enterprise-edu/web
• Running type-check in 1 packages
Tasks: 1 successful, 1 total
```

## Development Workflow

### Start Development Server

```bash
# From root directory
npm run dev
```

**What this does:**
- Starts Next.js dev server
- Hot reloads on file changes
- Runs on http://localhost:3000

**Output:**
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Ready in 2.1s
```

**Access the app:**
- Open browser to http://localhost:3000
- You should see the landing page

### Common Development Tasks

#### Run Type Check

```bash
npm run type-check
```

**When to run:**
- After TypeScript changes
- Before committing
- To catch type errors

#### Run Linter

```bash
npm run lint
```

**What it checks:**
- ESLint rules
- Next.js best practices
- Code style issues

**Fix auto-fixable issues:**
```bash
cd apps/web
npm run lint -- --fix
```

#### Build for Production

```bash
npm run build
```

**What this does:**
- Type checks the code
- Builds Next.js app
- Optimizes for production
- Creates `.next` directory

**Expected time:** 30-60 seconds

#### Start Production Server

```bash
cd apps/web
npm run start
```

**Note:** Requires `npm run build` first

### File Watching

The dev server automatically watches:
- `apps/web/src/**/*.{ts,tsx}`
- `apps/web/app/**/*.{ts,tsx}`
- `apps/web/components/**/*.{ts,tsx}`
- `apps/web/lib/**/*.{ts,tsx}`

Changes trigger:
- Fast Refresh (React)
- Hot Module Replacement (HMR)
- Automatic rebuild

## Project Structure Navigation

```
coding-platform/
├── apps/web/src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Auth pages
│   │   ├── (dashboard)/    # Dashboard pages
│   │   ├── (public)/       # Public pages
│   │   ├── api/            # API routes
│   │   └── layout.tsx      # Root layout
│   ├── components/
│   │   ├── ui/             # UI components (Radix)
│   │   ├── forms/          # Form components
│   │   ├── layouts/        # Layout components
│   │   └── ...             # Feature components
│   ├── lib/
│   │   ├── auth/           # Auth utilities
│   │   ├── database/       # Database clients
│   │   ├── redis/          # Redis client
│   │   └── utils/          # Helper functions
│   └── middleware.ts       # Next.js middleware
```

### Key Files

- **`package.json`**: Root dependencies and scripts
- **`turbo.json`**: Turbo configuration
- **`apps/web/next.config.js`**: Next.js configuration
- **`apps/web/tailwind.config.js`**: Tailwind configuration
- **`apps/web/tsconfig.json`**: TypeScript configuration

## Common Development Tasks

### Create New Page

```bash
# Example: Create a settings page
cd apps/web/src/app
mkdir -p (dashboard)/student/settings
touch (dashboard)/student/settings/page.tsx
```

**Template:**
```typescript
export default function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
    </div>
  )
}
```

### Create New API Route

```bash
# Example: Create a settings API route
cd apps/web/src/app/api
mkdir -p student/settings
touch student/settings/route.ts
```

**Template:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Implementation
    return NextResponse.json({ data: {} })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Create New Component

```bash
# Create UI component
touch apps/web/src/components/ui/my-component.tsx
```

**Template:**
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  // Props
}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("base-styles", className)}
        {...props}
      />
    )
  }
)
MyComponent.displayName = "MyComponent"

export { MyComponent }
```

### Add New Dependency

```bash
# Add to web app
cd apps/web
npm install package-name

# Add dev dependency
npm install -D package-name

# Add to root
cd ../..
npm install -w @enterprise-edu/web package-name
```

## Testing (Future)

### Unit Tests (Not yet configured)

```bash
# Will be: npm run test
# Will be: npm run test:watch
```

### E2E Tests (Not yet configured)

```bash
# Will be: npm run e2e
# Will be: npm run e2e:ui
```

### Integration Tests (Not yet configured)

```bash
# Will be: npm run test:integration
```

## Performance Analysis

### Bundle Analyzer

**Setup** (if needed):
```bash
cd apps/web
npm install -D @next/bundle-analyzer
```

**Run:**
```bash
# Add to package.json scripts:
"analyze": "ANALYZE=true next build"

# Then run:
npm run analyze
```

This will:
- Build the app
- Generate bundle analysis
- Open visualization in browser

### Lighthouse

1. Build production: `npm run build`
2. Start production: `cd apps/web && npm start`
3. Open Chrome DevTools
4. Run Lighthouse audit

## Troubleshooting

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solutions:**
```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

### Module Not Found

**Error:** `Module not found: Can't resolve '@/lib/...'`

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules apps/web/node_modules
rm package-lock.json apps/web/package-lock.json
npm install

# Clear Next.js cache
rm -rf apps/web/.next
```

### TypeScript Errors

**Error:** `Cannot find module or its type declarations`

**Solutions:**
```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Or regenerate types
npm run type-check
```

### Supabase Connection Failed

**Error:** `Failed to connect to Supabase`

**Solutions:**
1. Check `.env.local` has correct values
2. Verify Supabase project is running
3. Check API keys haven't expired
4. Restart dev server

### Redis Connection Failed

**Error:** `Redis not configured`

**This is OK:** App will work without Redis
- Caching will be disabled
- Data fetched directly from database
- Performance may be slightly slower

**To fix:**
1. Get Upstash Redis credentials
2. Add to `.env.local`
3. Restart server

### Build Errors

**Error:** `Build failed`

**Solutions:**
```bash
# Clean build artifacts
rm -rf apps/web/.next
rm -rf .turbo

# Reinstall dependencies
rm -rf node_modules apps/web/node_modules
npm install

# Try build again
npm run build
```

### Hot Reload Not Working

**Solutions:**
1. Restart dev server
2. Check file is in watched directory
3. Clear browser cache
4. Check WSL file watching (Windows)

### Environment Variables Not Loading

**Solutions:**
1. Restart dev server (required after .env changes)
2. Check file name is `.env.local` not `.env`
3. Check variables start with `NEXT_PUBLIC_` for client access
4. Clear `.next` cache

## VS Code Setup

### Recommended Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "dsznajder.es7-react-js-snippets"
  ]
}
```

### Settings

**`.vscode/settings.json`:**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Git Workflow

### Branch Naming

```bash
feature/description
bugfix/description
refactor/description
docs/description
```

### Commit Messages

```bash
git commit -m "feat: add user settings page"
git commit -m "fix: resolve authentication error"
git commit -m "refactor: improve API error handling"
git commit -m "docs: update setup instructions"
```

### Before Committing

```bash
# Run checks
npm run type-check
npm run lint

# Fix lint issues
cd apps/web
npm run lint -- --fix
```

## Tips & Best Practices

### Performance

1. **Use Server Components** when possible
2. **Dynamic imports** for heavy components
3. **Image optimization** with Next.js Image
4. **Lazy load** off-screen content

### Code Quality

1. **Type everything** - avoid `any`
2. **Use Zod schemas** for validation
3. **Follow error handling patterns**
4. **Add JSDoc comments** for complex functions

### Development Speed

1. **Use React DevTools** for debugging
2. **Browser DevTools** for network/performance
3. **Component props** with TypeScript intellisense
4. **Tailwind IntelliSense** for CSS classes

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run type-check       # TypeScript check
npm run lint             # Lint code

# Workspace
cd apps/web              # Navigate to web app
npm install <package>    # Add dependency

# Git
git status               # Check status
git add .                # Stage changes
git commit -m "message"  # Commit
git push                 # Push to remote
```

### Important URLs

- **App**: http://localhost:3000
- **Supabase Studio**: https://supabase.com/dashboard/project/_/editor
- **Upstash Console**: https://console.upstash.com
- **Docs**: See `/docs` directory

## Getting Help

### Resources

- **Architecture**: See [Architecture Overview](../architecture/overview.md)
- **ADRs**: See [ADR Directory](../adr/)
- **Operations**: See [Operations Runbook](./operations.md)

### Common Issues

Check [Troubleshooting](#troubleshooting) section above

### Support

- Check documentation first
- Search closed issues on GitHub
- Ask team members
- Create issue with reproduction steps

## Related Documentation

- [CI/CD Documentation](./ci.md)
- [Operations Runbook](./operations.md)
- [Architecture Overview](../architecture/overview.md)
