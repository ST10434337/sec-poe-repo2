import { describe, expect, it } from 'vitest'
import {
  EMAIL_RE,
  PASSWORD_RE,
  hasErrors,
  validateGig,
  validateLogin,
  validateRegister,
} from './validation.js'

// These rules must match the API, so these tests use the same edge cases the API rejects ~> (Vitest, n.d.)

describe('PASSWORD_RE', () => {
  it('accepts a password that meets every rule', () => {
    expect(PASSWORD_RE.test('Passw0rd!')).toBe(true)
    expect(PASSWORD_RE.test('Abcdef1@')).toBe(true)
  })

  it.each([
    ['Passw0rd#', 'a symbol the API does not allow'],
    ['Pass w0rd!', 'a space'],
    ['Pa1!', 'fewer than 8 characters'],
    ['password1!', 'no upper case letter'],
    ['PASSWORD1!', 'no lower case letter'],
    ['Password!', 'no number'],
    ['Password1', 'no special character'],
  ])('rejects %s (%s)', (password) => {
    expect(PASSWORD_RE.test(password)).toBe(false)
  })
})

describe('EMAIL_RE', () => {
  it('accepts a normal email address', () => {
    expect(EMAIL_RE.test('thandi.m@example.co.za')).toBe(true)
  })

  it.each(['no-at-sign.com', 'name@domain', 'name@domain.c', 'name @example.com'])('rejects %s', (email) => {
    expect(EMAIL_RE.test(email)).toBe(false)
  })
})

describe('validateLogin', () => {
  it('asks for both fields when they are empty', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Enter your email.',
      password: 'Enter your password.',
    })
  })

  it('treats spaces only as empty', () => {
    expect(hasErrors(validateLogin({ email: '   ', password: '   ' }))).toBe(true)
  })

  it('passes when both fields are filled in', () => {
    expect(validateLogin({ email: 'a@example.com', password: 'anything' })).toEqual({})
  })
})

describe('validateRegister', () => {
  const valid = {
    name: 'Thandi',
    email: 'thandi@example.com',
    password: 'Passw0rd!',
    confirmPassword: 'Passw0rd!',
    role: 'client',
  }

  it('passes a valid client or freelancer registration', () => {
    expect(validateRegister(valid)).toEqual({})
    expect(validateRegister({ ...valid, role: 'freelancer' })).toEqual({})
  })

  it('never allows admin to be chosen', () => {
    expect(validateRegister({ ...valid, role: 'admin' })).toHaveProperty('role')
  })

  it('rejects a name longer than 100 characters', () => {
    expect(validateRegister({ ...valid, name: 'a'.repeat(101) })).toHaveProperty('name')
    expect(validateRegister({ ...valid, name: 'a'.repeat(100) })).toEqual({})
  })

  it('rejects a weak password and a confirm box that does not match', () => {
    const errors = validateRegister({ ...valid, password: 'password', confirmPassword: 'other' })
    expect(errors).toHaveProperty('password')
    expect(errors).toHaveProperty('confirmPassword')
  })

  it('rejects an invalid email', () => {
    expect(validateRegister({ ...valid, email: 'not-an-email' }).email).toBe('Enter a valid email address.')
  })
})

describe('validateGig', () => {
  const valid = {
    title: 'Logo design',
    description: 'A clean, modern logo for your business.',
    category: 'creative-design',
    price: '500',
  }

  it('passes a valid gig', () => {
    expect(validateGig(valid)).toEqual({})
  })

  it.each(['0', '1.5', 'abc', '', '-5', '1000001'])('rejects the price "%s"', (price) => {
    expect(validateGig({ ...valid, price })).toHaveProperty('price')
  })

  it('accepts the smallest and largest prices', () => {
    expect(validateGig({ ...valid, price: '1' })).toEqual({})
    expect(validateGig({ ...valid, price: 1000000 })).toEqual({})
  })

  it('checks the title length after trimming spaces', () => {
    expect(validateGig({ ...valid, title: '  ab  ' })).toHaveProperty('title')
    expect(validateGig({ ...valid, title: '  abc  ' })).toEqual({})
    expect(validateGig({ ...valid, title: 'a'.repeat(101) })).toHaveProperty('title')
  })

  it('rejects a short description and an unknown category', () => {
    const errors = validateGig({ ...valid, description: 'Too short', category: 'bogus' })
    expect(errors).toHaveProperty('description')
    expect(errors).toHaveProperty('category')
  })
})

// Vitest. n.d. Test API Reference. Available at: https://vitest.dev/api/test (Accessed: 12 October 2026).
// Vitest. n.d. Expect API Reference. Available at: https://vitest.dev/api/expect (Accessed: 12 October 2026).
