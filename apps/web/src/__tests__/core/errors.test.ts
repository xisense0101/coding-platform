import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  isAppError,
  isOperationalError,
} from '@/core/errors'

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Test error', 400)
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
    })

    it('should have default status code of 500', () => {
      const error = new AppError('Test error')
      expect(error.statusCode).toBe(500)
    })

    it('should convert to JSON', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR')
      const json = error.toJSON()
      expect(json.message).toBe('Test error')
      expect(json.statusCode).toBe(400)
      expect(json.code).toBe('TEST_ERROR')
    })
  })

  describe('ValidationError', () => {
    it('should create validation error with errors object', () => {
      const errors = { email: ['Invalid email format'] }
      const error = new ValidationError('Validation failed', errors)
      expect(error.statusCode).toBe(400)
      expect(error.errors).toEqual(errors)
    })

    it('should include errors in JSON', () => {
      const errors = { email: ['Invalid email'] }
      const error = new ValidationError('Validation failed', errors)
      const json = error.toJSON()
      expect(json.errors).toEqual(errors)
    })
  })

  describe('AuthenticationError', () => {
    it('should create authentication error with default message', () => {
      const error = new AuthenticationError()
      expect(error.message).toBe('Authentication required')
      expect(error.statusCode).toBe(401)
    })

    it('should create authentication error with custom message', () => {
      const error = new AuthenticationError('Invalid token')
      expect(error.message).toBe('Invalid token')
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error with resource name', () => {
      const error = new NotFoundError('User')
      expect(error.message).toBe('User not found')
      expect(error.statusCode).toBe(404)
    })
  })

  describe('Type Guards', () => {
    it('should identify AppError instances', () => {
      const error = new AppError('Test')
      expect(isAppError(error)).toBe(true)
      expect(isAppError(new Error('Test'))).toBe(false)
      expect(isAppError('string')).toBe(false)
    })

    it('should identify operational errors', () => {
      const operationalError = new AppError('Test', 400, 'TEST', true)
      const nonOperationalError = new AppError('Test', 500, 'TEST', false)
      expect(isOperationalError(operationalError)).toBe(true)
      expect(isOperationalError(nonOperationalError)).toBe(false)
      expect(isOperationalError(new Error('Test'))).toBe(false)
    })
  })
})
