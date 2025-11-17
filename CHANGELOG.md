# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ESLint configuration with strict TypeScript rules
- Prettier configuration for consistent code formatting
- Husky pre-commit hooks with lint-staged
- Jest test infrastructure with example tests
- Comprehensive TypeScript strict mode configuration
- Core infrastructure modules:
  - Custom error classes hierarchy (AppError, ValidationError, etc.)
  - API response utilities with consistent format
  - Winston-based structured logging with correlation IDs
  - Rate limiting middleware (in-memory, Redis-ready)
  - Authentication and authorization middleware
  - Input validation and sanitization utilities
  - Environment variable validation with Zod
- Health check endpoints (`/api/health`, `/api/v1/health`)
- API versioning structure (v1)
- Comprehensive README with setup and architecture documentation
- Example refactored API route demonstrating best practices (`/api/v1/users`)
- User validation schemas with Zod
- Pagination utilities
- Security enhancements:
  - Rate limiting on API routes
  - Input validation with Zod schemas
  - Input sanitization for XSS prevention
  - Type-safe error handling

### Changed
- Upgraded TypeScript configuration with stricter type checking
- Enhanced package.json with new scripts for testing, linting, and formatting
- Updated .gitignore to exclude test artifacts and logs

### Dependencies
- Added: winston (structured logging)
- Added: @testing-library/react, @testing-library/jest-dom (testing)
- Added: jest, jest-environment-jsdom (testing framework)
- Added: husky, lint-staged (git hooks)

## [1.0.0] - 2024-11-17

### Initial Release
- Basic MVP coding platform with Next.js 14
- Supabase authentication and database
- Course and exam management
- Coding environment with Monaco editor
- Judge0 integration for code execution
- Organization management
- Redis caching support

[Unreleased]: https://github.com/xisense0101/coding-platform/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/xisense0101/coding-platform/releases/tag/v1.0.0
