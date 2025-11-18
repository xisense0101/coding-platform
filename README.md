# Coding Platform

An enterprise educational platform built with Next.js 14, providing a comprehensive learning management system for educational institutions.

## Features

- 🔐 **Role-Based Access Control**: Admin, Teacher, and Student roles with appropriate permissions
- 📚 **Course Management**: Create, manage, and enroll in courses
- 📝 **Exam System**: Online exams with multiple question types
- 💻 **Code Execution**: Integrated Judge0 API for running and testing code
- 📊 **Analytics & Reporting**: Track student progress and course statistics
- 🎨 **Accessible UI**: WCAG 2.1 AA compliant interface with Radix UI
- ⚡ **High Performance**: Redis caching and optimized builds
- 🛡️ **Security**: Rate limiting, input validation, and security headers

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with Server Components
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Supabase** - PostgreSQL database with built-in auth
- **Redis (Upstash)** - Caching layer for performance
- **Zod** - Runtime validation
- **Judge0** - Code execution engine

### Infrastructure
- **Turbo** - Monorepo build system
- **Vercel** - Deployment and hosting
- **GitHub** - Version control

## Quick Start

### Prerequisites

- Node.js >= 18.17.0 (LTS recommended)
- npm >= 9.0.0
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/xisense0101/coding-platform.git
cd coding-platform

# Install dependencies
npm install

# Set up environment variables
cd apps/web
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Return to root
cd ../..

# Start development server
npm run dev
```

The application will be available at http://localhost:3000

### Environment Variables

Key environment variables required:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional: Redis, Email, Code Execution
# See .env.example for complete list
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run type-check       # Run TypeScript checks
npm run lint             # Run ESLint

# Package-specific (from root)
npm run dev -w @enterprise-edu/web
npm run build -w @enterprise-edu/web
```

### Project Structure

```
coding-platform/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/           # App Router (pages, layouts, API)
│       │   ├── components/    # React components
│       │   ├── lib/           # Utilities and services
│       │   └── middleware.ts  # Next.js middleware
│       └── public/            # Static assets
├── docs/                      # Documentation
│   ├── architecture/          # Architecture docs
│   ├── adr/                   # Decision records
│   └── runbooks/              # Operational guides
├── package.json               # Root dependencies
└── turbo.json                 # Turbo configuration
```

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs) directory:

### 📚 [Complete Documentation Index](./docs/README.md)

**Quick Links:**

- **[Architecture Overview](./docs/architecture/overview.md)** - System architecture and components
- **[Local Development Guide](./docs/runbooks/local-development.md)** - Setup and development workflow
- **[Frontend Architecture](./docs/architecture/frontend.md)** - React, Next.js, and UI patterns
- **[Backend Architecture](./docs/architecture/backend.md)** - API routes, validation, and security
- **[CI/CD](./docs/runbooks/ci.md)** - Build and deployment processes
- **[Operations](./docs/runbooks/operations.md)** - Production operations and monitoring

**Architecture Decision Records (ADRs):**

- [ADR 0001: State Management](./docs/adr/0001-state-management.md)
- [ADR 0002: Backend Hardening](./docs/adr/0002-backend-hardening.md)
- [ADR 0003: UI System](./docs/adr/0003-ui-system.md)

## Key Features

### User Roles

- **Super Admin**: Full system access, organization management
- **Admin**: Organization-level management
- **Teacher**: Course and exam management
- **Student**: Access courses, take exams, submit assignments

### Course Management

- Create and publish courses
- Add course materials and resources
- Enroll students
- Track progress and completion

### Exam System

- Multiple question types (MCQ, coding, text)
- Time limits and deadlines
- Automatic grading for MCQ and coding
- Manual grading for text responses
- Exam analytics and insights

### Code Execution

- Support for multiple programming languages
- Real-time code execution via Judge0
- Test case validation
- Syntax highlighting with Monaco Editor

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

See [CI/CD Documentation](./docs/runbooks/ci.md) for details.

### Manual Deployment

```bash
# Build production bundle
npm run build

# Start production server
cd apps/web
npm start
```

## Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schemas for all inputs
- **Rate Limiting**: Upstash Redis rate limiter
- **Security Headers**: OWASP recommended headers
- **HTTPS**: Enforced in production
- **SQL Injection**: Prevented by Supabase prepared statements

See [Backend Architecture](./docs/architecture/backend.md) for security details.

## Performance

- **Server Components**: Reduce client bundle size
- **Redis Caching**: 5-15 minute TTL for database queries
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Edge Network**: Vercel edge functions

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Focus indicators on all interactive elements

See [UI System ADR](./docs/adr/0003-ui-system.md) for accessibility details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [Local Development Guide](./docs/runbooks/local-development.md) for development setup.

## Troubleshooting

Common issues and solutions are documented in:
- [Local Development - Troubleshooting](./docs/runbooks/local-development.md#troubleshooting)
- [Operations - Incident Response](./docs/runbooks/operations.md#incident-response)

## Support

- **Documentation**: Check the [docs/](./docs) directory
- **Issues**: Create a GitHub issue
- **Questions**: Contact the development team

## License

[Add your license here]

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Supabase](https://supabase.com)
- [Radix UI](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Turbo](https://turbo.build)

---

**Version**: 1.0.0  
**Last Updated**: 2024-11-18
