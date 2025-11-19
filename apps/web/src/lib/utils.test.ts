import { describe, it, expect } from 'vitest'
import {
  formatBytes,
  formatDuration,
  capitalize,
  truncate,
  getInitials,
  validateEmail,
  calculateProgress,
  getGradeLetter,
} from './utils'

describe('formatBytes', () => {
  it('formats 0 bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
  })

  it('formats bytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
  })

  it('formats with custom decimal places', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB')
  })
})

describe('formatDuration', () => {
  it('formats minutes less than 60', () => {
    expect(formatDuration(45)).toBe('45m')
  })

  it('formats hours without minutes', () => {
    expect(formatDuration(120)).toBe('2h')
  })

  it('formats hours with minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m')
  })
})

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello')
  })

  it('handles already capitalized string', () => {
    expect(capitalize('Hello')).toBe('Hello')
  })

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A')
  })
})

describe('truncate', () => {
  it('does not truncate string shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates string longer than limit', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('handles exact length match', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})

describe('getInitials', () => {
  it('gets initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('gets initials from single name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('limits to 2 characters', () => {
    expect(getInitials('John Paul Smith')).toBe('JP')
  })
})

describe('validateEmail', () => {
  it('validates correct email', () => {
    expect(validateEmail('test@example.com')).toBe(true)
  })

  it('rejects email without @', () => {
    expect(validateEmail('testexample.com')).toBe(false)
  })

  it('rejects email without domain', () => {
    expect(validateEmail('test@')).toBe(false)
  })

  it('rejects email with spaces', () => {
    expect(validateEmail('test @example.com')).toBe(false)
  })
})

describe('calculateProgress', () => {
  it('calculates percentage correctly', () => {
    expect(calculateProgress(5, 10)).toBe(50)
  })

  it('handles zero total', () => {
    expect(calculateProgress(5, 0)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    expect(calculateProgress(1, 3)).toBe(33)
  })

  it('handles 100% completion', () => {
    expect(calculateProgress(10, 10)).toBe(100)
  })
})

describe('getGradeLetter', () => {
  it('returns A+ for 97 or above', () => {
    expect(getGradeLetter(97)).toBe('A+')
    expect(getGradeLetter(100)).toBe('A+')
  })

  it('returns A for 93-96', () => {
    expect(getGradeLetter(93)).toBe('A')
    expect(getGradeLetter(95)).toBe('A')
  })

  it('returns F for below 65', () => {
    expect(getGradeLetter(50)).toBe('F')
  })

  it('returns B for 83-86', () => {
    expect(getGradeLetter(85)).toBe('B')
  })
})
