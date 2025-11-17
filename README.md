# Enterprise Coding Platform

A production-ready, enterprise-grade online coding platform built with Next.js 14, TypeScript, and Supabase.

## 🚀 Features

- **Authentication & Authorization**: Secure user management with role-based access control
- **Coding Environment**: Integrated Monaco editor with multi-language support
- **Course Management**: Create and manage coding courses, sections, and questions
- **Exam System**: Conduct online coding exams with proctoring capabilities
- **Real-time Code Execution**: Powered by Judge0 API
- **Organization Management**: Multi-tenancy support for educational institutions
- **Monitoring & Observability**: Health checks, structured logging, and error tracking

## 📋 Prerequisites

- Node.js >= 18.17.0
- npm >= 9.0.0
- Supabase account
- Judge0 API access (optional, for code execution)
- Redis instance (Upstash recommended, optional for caching)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd coding-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and fill in your credentials:

```bash
cd apps/web
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_database_url

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

See `.env.example` for all available configuration options.

### 4. Set up the database

Run the database migrations in Supabase:

```bash
# Execute SQL files in database_schema/ directory in your Supabase project
```

### 5. Run the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── v1/           # Versioned API endpoints
│   │   │   └── health/       # Health check endpoints
│   │   └── ...               # Pages and layouts
│   ├── components/            # React components
│   │   ├── coding/           # Coding-related components
│   │   ├── common/           # Shared components
│   │   ├── forms/            # Form components
│   │   └── ui/               # UI primitives
│   ├── core/                  # Core business logic
│   │   ├── config/           # Configuration and environment
│   │   ├── errors/           # Custom error classes
│   │   ├── middleware/       # API middleware (auth, rate limiting)
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   └── validators/       # Validation schemas
│   ├── lib/                   # External service integrations
│   │   ├── auth/             # Authentication utilities
│   │   ├── database/         # Database clients and services
│   │   ├── email/            # Email service integration
│   │   └── redis/            # Redis client
│   ├── hooks/                 # Custom React hooks
│   └── __tests__/            # Test files
├── .eslintrc.json            # ESLint configuration
├── .prettierrc.json          # Prettier configuration
├── jest.config.ts            # Jest configuration
├── jest.setup.ts             # Jest setup file
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run type-check      # Run TypeScript type checking

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

### Code Style

This project uses:
- **ESLint** for linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **lint-staged** for running linters on staged files

Code is automatically formatted and linted before each commit.

## 🏗️ Architecture

### Layered Architecture

The application follows a clean, layered architecture:

1. **Presentation Layer** (`components/`, `app/`): UI components and pages
2. **API Layer** (`app/api/`): RESTful API endpoints
3. **Business Logic Layer** (`core/`): Core application logic
4. **Data Access Layer** (`lib/database/`): Database services and repositories

### Key Architectural Decisions

- **Feature-based organization**: Code is organized by feature, not by type
- **Dependency injection**: Services are loosely coupled and testable
- **Error handling**: Custom error classes with proper HTTP status codes
- **Type safety**: Comprehensive TypeScript types throughout
- **Validation**: Zod schemas for runtime validation
- **Security**: Rate limiting, input sanitization, and authentication middleware

## 🔒 Security

### Implemented Security Measures

- **Rate Limiting**: Prevents API abuse with configurable limits
- **Input Validation**: All inputs validated with Zod schemas
- **Input Sanitization**: XSS prevention through sanitization
- **Authentication**: Secure session management with Supabase Auth
- **Authorization**: Role-based access control (RBAC)
- **Security Headers**: Helmet-style security headers configured
- **CSRF Protection**: Built-in Next.js CSRF protection
- **Environment Validation**: Runtime validation of environment variables

### Rate Limiting

Rate limits are applied to API endpoints:

```typescript
import { rateLimit, RATE_LIMITS } from '@/core/middleware'

// Apply rate limiting
export const POST = rateLimit(RATE_LIMITS.strict)(handler)
```

Available rate limit presets:
- `strict`: 10 requests/minute
- `standard`: 60 requests/minute
- `lenient`: 100 requests/minute
- `api`: 100 requests/15 minutes

## 📊 Monitoring

### Health Checks

Health check endpoints are available at:

- `/api/health` - Basic health status
- `/api/v1/health` - Detailed health status with metrics

Example response:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 3600,
    "services": {
      "database": "healthy",
      "redis": "healthy"
    }
  }
}
```

### Logging

Structured logging with Winston:

```typescript
import { logger } from '@/core/utils'

logger.info('User logged in', { userId: '123' })
logger.error('Database error', error)
logger.debug('Processing request', { data })
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

Tests are located in `src/__tests__/` and follow this naming convention:
- `*.test.ts` - Unit tests
- `*.spec.ts` - Integration tests

### Writing Tests

```typescript
import { AppError } from '@/core/errors'

describe('AppError', () => {
  it('should create error with message', () => {
    const error = new AppError('Test error', 400)
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(400)
  })
})
```

## 🚀 Deployment

### Building for Production

```bash
npm run build
npm run start
```

### Environment Variables

Ensure all required environment variables are set in your production environment:

- Supabase credentials
- Database URL
- Redis URL (if using)
- Judge0 API credentials (if using)
- App URLs (for redirects and emails)

### Recommended Hosting

- **Vercel**: Optimized for Next.js applications
- **AWS**: Using ECS or Lambda
- **Google Cloud**: Using Cloud Run
- **Self-hosted**: Using Docker

## 📚 API Documentation

### API Versioning

The API uses versioning for backward compatibility:

- Current version: `v1`
- Base path: `/api/v1/`
- Legacy support: `/api/` (redirects to v1)

### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "errors": { ... }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Quality Standards

- All code must pass TypeScript type checking
- All code must pass ESLint checks
- All code must be formatted with Prettier
- All new features must include tests
- Maintain test coverage above 50%

## 📝 License

This project is proprietary and confidential.

## 👥 Support

For support, please contact the development team or open an issue in the repository.

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes in each version.

---

Built with ❤️ using Next.js, TypeScript, and Supabase
