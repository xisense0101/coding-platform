# API Documentation Guide

## Overview

This document provides guidelines for the Coding Platform API. The API follows RESTful principles and uses JSON for request and response bodies.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Versioning

The API uses URL-based versioning:

```
Current version: /api/v1/
Legacy (redirects to v1): /api/
```

## Authentication

Most endpoints require authentication using Supabase Auth. Include the authentication token in requests:

```http
Authorization: Bearer <your-access-token>
```

### User Roles

The platform supports the following roles:
- `student` - Regular student users
- `teacher` - Teaching staff
- `admin` - Organization administrators
- `super_admin` - System administrators

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "errors": {
      "field": ["Validation error message"]
    }
  }
}
```

## HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service degraded

## Rate Limiting

API endpoints are protected by rate limiting to prevent abuse and ensure fair usage.

For detailed documentation, see [CHANGELOG.md](../CHANGELOG.md) for API changes.
