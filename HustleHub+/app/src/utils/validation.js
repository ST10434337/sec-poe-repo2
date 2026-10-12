import { CATEGORIES, ROLES } from './constants.js'

// Browser-side checks that copy the API's rules, so users get instant, clear messages
// The API checks everything again; these only stop obviously bad input early ~> (The IIE, 2026)
// Each validate function returns an errors object, e.g. { email: 'Enter your email.' }
// An empty object means the form is valid

// Same patterns as the API's authController.js ~> (GeeksforGeeks, 2026a; 2026b)
export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Also shown as the hint under the password box, so the rules are known before typing
export const PASSWORD_RULE =
  'At least 8 characters, with upper and lower case letters, a number, and one of @ $ ! % * ? &. No other symbols or spaces.'

export const hasErrors = (errors) => Object.keys(errors).length > 0

// Login only checks that both boxes are filled in; the API checks the password itself
export function validateLogin({ email = '', password = '' }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Enter your email.'
  if (!password.trim()) errors.password = 'Enter your password.'
  return errors
}

export function validateRegister({ name = '', email = '', password = '', confirmPassword = '', role = '' }) {
  const errors = {}
  const cleanName = name.trim()
  const cleanEmail = email.trim()

  if (!cleanName || cleanName.length > 100) errors.name = 'Enter your name (up to 100 characters).'

  if (!cleanEmail) errors.email = 'Enter your email.'
  else if (!EMAIL_RE.test(cleanEmail)) errors.email = 'Enter a valid email address.'

  // The password is not trimmed, because the API does not trim it either
  // The full rule is already shown as the hint above the error, so the error stays short
  if (!password) errors.password = 'Enter a password.'
  else if (!PASSWORD_RE.test(password)) errors.password = 'Password does not meet the rules above.'

  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.'

  // Admin can never be chosen at registration
  if (role !== ROLES.CLIENT && role !== ROLES.FREELANCER) errors.role = 'Choose how you will use HustleHub+.'

  return errors
}

// Same limits as the API's gigController.js and Gig model
export function validateGig({ title = '', description = '', category = '', price = '' }) {
  const errors = {}
  const cleanTitle = title.trim()
  const cleanDescription = description.trim()
  // The API only accepts a whole number (not text), from 1 to 1,000,000
  const amount = Number(price)

  if (cleanTitle.length < 3 || cleanTitle.length > 100) errors.title = 'Title must be 3 to 100 characters.'
  if (cleanDescription.length < 10 || cleanDescription.length > 2000)
    errors.description = 'Description must be 10 to 2000 characters.'
  if (!CATEGORIES.some((c) => c.value === category)) errors.category = 'Choose a category.'
  if (!Number.isInteger(amount) || amount < 1 || amount > 1000000)
    errors.price = 'Enter a whole number of rand from 1 to 1,000,000.'

  return errors
}

// GeeksforGeeks (2026a) How to Validate Email Address using RegExp in JavaScript. Available at: https://www.geeksforgeeks.org/javascript/how-to-validate-email-address-using-regexp-in-javascript/ (Accessed: 12 October 2026).
// GeeksforGeeks (2026b) JavaScript - Validate Password in JS. Available at: https://www.geeksforgeeks.org/javascript/javascript-program-to-validate-password-using-regular-expressions/ (Accessed: 12 October 2026).
// The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): Module manual. LU4, p.120-123. The Independent Institute of Education (Pty) Ltd.
