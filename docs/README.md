# Coding Platform Documentation

Welcome to the Coding Platform documentation. This documentation provides comprehensive information about the architecture, decisions, and operational procedures for the platform.

## 📚 Documentation Structure

### Architecture Documentation

Detailed technical architecture and design documents:

- **[Architecture Overview](./architecture/overview.md)**  
  High-level system architecture, major components, technology decisions, and directory structure. Start here for a complete system understanding.

- **[Frontend Architecture](./architecture/frontend.md)**  
  Next.js 14 App Router, React components, state management, UI system, styling approach, and frontend best practices.

- **[Backend Architecture](./architecture/backend.md)**  
  API route handlers, validation, error handling, caching strategy, security implementation, and database access patterns.

### Architecture Decision Records (ADRs)

Documents explaining key architectural and technical decisions:

- **[ADR 0001: State Management](./adr/0001-state-management.md)**  
  Decision to use React Context API for authentication state, with future plans for Zustand and React Query. Includes rationale, alternatives considered, and migration path.

- **[ADR 0002: Backend Hardening](./adr/0002-backend-hardening.md)**  
  Standardization of backend patterns including validation (Zod), error handling, logging, security headers, rate limiting, and caching strategies.

- **[ADR 0003: UI System](./adr/0003-ui-system.md)**  
  Selection of Radix UI + Tailwind CSS for the component library. Covers accessibility, styling approach, component patterns, and design system.

### Runbooks

Operational guides for development, deployment, and maintenance:

- **[Local Development](./runbooks/local-development.md)**  
  Complete guide to setting up and running the application locally. Includes prerequisites, installation steps, common development tasks, and troubleshooting.

- **[CI/CD](./runbooks/ci.md)**  
  Continuous Integration and Deployment strategy. Covers recommended workflows, testing approach, deployment procedures, and build optimization.

- **[Operations](./runbooks/operations.md)**  
  Production operations guide including environment management, monitoring, logging, incident response, and performance optimization.

## 🚀 Quick Start

### For New Developers

1. Read [Architecture Overview](./architecture/overview.md) - Understand the system
2. Follow [Local Development](./runbooks/local-development.md) - Set up your environment
3. Review [Frontend Architecture](./architecture/frontend.md) - Learn the frontend patterns
4. Review [Backend Architecture](./architecture/backend.md) - Learn the API patterns
5. Check [ADRs](./adr/) - Understand key decisions

### For DevOps/SRE

1. Read [Operations Runbook](./runbooks/operations.md) - Production operations
2. Review [CI/CD Documentation](./runbooks/ci.md) - Build and deployment
3. Check [Architecture Overview](./architecture/overview.md) - System architecture
4. Review [Backend Architecture](./architecture/backend.md) - API and data layer

### For Product/Project Managers

1. Read [Architecture Overview](./architecture/overview.md) - System capabilities
2. Review [ADRs](./adr/) - Understand technical decisions
3. Check [Operations](./runbooks/operations.md) - Production readiness

## 🏗️ System Overview

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18 (Server Components)
- TypeScript
- Tailwind CSS + Radix UI

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Auth)
- Redis (Upstash) for caching
- Node.js runtime

**Infrastructure:**
- Vercel (deployment)
- Turbo (monorepo)
- GitHub (source control)

### Key Features

- 🔐 **Authentication & Authorization**: Role-based access (Admin, Teacher, Student)
- 📚 **Course Management**: Create and manage courses
- 📝 **Exam System**: Online exams with multiple question types
- 💻 **Code Execution**: Integrated Judge0 for running code
- 📊 **Analytics**: Course and student statistics
- 🎨 **Accessible UI**: WCAG 2.1 AA compliant components
- ⚡ **Performance**: Redis caching, optimized builds
- 🛡️ **Security**: Rate limiting, input validation, security headers

## 📖 Documentation Conventions

### Code Examples

Code examples are provided in TypeScript with syntax highlighting:

```typescript
// Example code
function example() {
  return "Hello, World!"
}
```

### File Paths

File paths are relative to repository root:
- ✅ `apps/web/src/app/page.tsx`
- ❌ `src/app/page.tsx`

### Commands

Shell commands are shown with bash syntax:

```bash
# This is a comment
npm install
npm run dev
```

### Notes and Warnings

Important information is highlighted:

**Note**: This is informational
**Warning**: This is a warning
**Important**: This requires attention

## 🔍 Finding Information

### By Topic

**State Management** → [ADR 0001](./adr/0001-state-management.md), [Frontend Architecture](./architecture/frontend.md)

**API Development** → [Backend Architecture](./architecture/backend.md), [ADR 0002](./adr/0002-backend-hardening.md)

**UI Components** → [Frontend Architecture](./architecture/frontend.md), [ADR 0003](./adr/0003-ui-system.md)

**Deployment** → [CI/CD](./runbooks/ci.md), [Operations](./runbooks/operations.md)

**Troubleshooting** → [Local Development](./runbooks/local-development.md#troubleshooting), [Operations](./runbooks/operations.md#incident-response)

### By Role

**Frontend Developer:**
- [Frontend Architecture](./architecture/frontend.md)
- [ADR 0001: State Management](./adr/0001-state-management.md)
- [ADR 0003: UI System](./adr/0003-ui-system.md)
- [Local Development](./runbooks/local-development.md)

**Backend Developer:**
- [Backend Architecture](./architecture/backend.md)
- [ADR 0002: Backend Hardening](./adr/0002-backend-hardening.md)
- [Operations](./runbooks/operations.md)
- [Local Development](./runbooks/local-development.md)

**Full-Stack Developer:**
- [Architecture Overview](./architecture/overview.md)
- [Frontend Architecture](./architecture/frontend.md)
- [Backend Architecture](./architecture/backend.md)
- All ADRs
- [Local Development](./runbooks/local-development.md)

**DevOps Engineer:**
- [CI/CD](./runbooks/ci.md)
- [Operations](./runbooks/operations.md)
- [Architecture Overview](./architecture/overview.md)

**Team Lead/Architect:**
- [Architecture Overview](./architecture/overview.md)
- All ADRs
- [CI/CD](./runbooks/ci.md)
- [Operations](./runbooks/operations.md)

## 🤝 Contributing to Documentation

### Adding New Documentation

1. **Architecture docs**: Place in `docs/architecture/`
2. **ADRs**: Use numbering sequence in `docs/adr/`
3. **Runbooks**: Place in `docs/runbooks/`
4. Update this README with links

### ADR Template

```markdown
# ADR XXXX: Title

**Status**: Proposed | Accepted | Deprecated | Superseded

**Date**: YYYY-MM-DD

**Context**: Brief description

## Decision

What was decided

## Context and Problem Statement

Detailed problem description

## Considered Options

- Option 1
- Option 2

## Decision Drivers

- Driver 1
- Driver 2

## Consequences

### Positive
- Pro 1

### Negative
- Con 1

## Related ADRs

- [ADR XXXX](./xxxx.md)
```

### Documentation Standards

**Writing Style:**
- Use clear, concise language
- Provide examples
- Include code samples
- Link to related documentation

**Code Examples:**
- Complete, runnable examples
- Include necessary imports
- Add comments for clarity
- Show both good and bad patterns

**File Organization:**
- One topic per file
- Use descriptive filenames
- Keep related content together
- Update index when adding files

## 📋 Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| Architecture Overview | ✅ Complete | 2024-11-18 |
| Frontend Architecture | ✅ Complete | 2024-11-18 |
| Backend Architecture | ✅ Complete | 2024-11-18 |
| ADR 0001: State Management | ✅ Complete | 2024-11-18 |
| ADR 0002: Backend Hardening | ✅ Complete | 2024-11-18 |
| ADR 0003: UI System | ✅ Complete | 2024-11-18 |
| Local Development | ✅ Complete | 2024-11-18 |
| CI/CD | ✅ Complete | 2024-11-18 |
| Operations | ✅ Complete | 2024-11-18 |

## 🔄 Documentation Updates

This documentation should be updated when:

- **Architecture changes**: Update architecture docs and create ADR
- **New decisions**: Create new ADR
- **Operational changes**: Update runbooks
- **New features**: Update relevant sections
- **Bug fixes**: Update troubleshooting sections

### Review Schedule

- **Monthly**: Review for accuracy
- **Quarterly**: Major updates
- **After releases**: Update as needed
- **On incidents**: Update runbooks

## 📞 Getting Help

### For Questions

1. **Check documentation first**: Search this documentation
2. **Check ADRs**: Understand decisions made
3. **Ask team**: Reach out to team members
4. **Create issue**: If documentation is unclear or missing

### For Issues

1. **Troubleshooting sections**: Check runbooks
2. **Common issues**: Review FAQ sections
3. **Team support**: Contact team lead
4. **Create incident**: For production issues

## 🎯 Goals

This documentation aims to:

1. **Onboard new team members** quickly and effectively
2. **Standardize practices** across the team
3. **Document decisions** for future reference
4. **Enable self-service** for common tasks
5. **Reduce knowledge silos** through shared documentation
6. **Maintain system knowledge** as team changes
7. **Support operations** with clear runbooks

## 📚 Additional Resources

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Turbo Documentation](https://turbo.build/repo/docs)

### Tools & Services

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Upstash Console](https://console.upstash.com)
- [GitHub Repository](https://github.com/xisense0101/coding-platform)

## 📝 Changelog

### 2024-11-18 - Initial Documentation

- Created comprehensive documentation structure
- Added architecture documentation (overview, frontend, backend)
- Added 3 ADRs (state management, backend hardening, UI system)
- Added 3 runbooks (local development, CI/CD, operations)
- Created documentation index

---

**Last Updated**: 2024-11-18  
**Version**: 1.0.0  
**Maintainer**: Development Team
