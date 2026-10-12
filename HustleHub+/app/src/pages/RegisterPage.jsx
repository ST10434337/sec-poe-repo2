import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { register } from '../api/auth.js'
import { useAuth } from '../auth/AuthContext.js'
import Alert from '../components/Alert.jsx'
import FormField from '../components/FormField.jsx'
import { HOME_BY_ROLE, ROLES } from '../utils/constants.js'
import { PASSWORD_RULE, hasErrors, validateRegister } from '../utils/validation.js'

const EMAIL_TAKEN = 'This email is already registered.'

// Only client and freelancer can be chosen; admins are created by the create-admin script
const ROLE_CHOICES = [
  { value: ROLES.CLIENT, title: 'Hire freelancers', text: 'Browse gigs and book them.' },
  { value: ROLES.FREELANCER, title: 'Offer my services', text: 'Create gigs and get booked by clients.' },
]

// Register form ~> (The IIE, 2026)
// The API logs the new user in straight away by returning a token
function RegisterPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ROLES.CLIENT,
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in: nothing to do here
  if (user) return <Navigate to={HOME_BY_ROLE[user.role] ?? '/gigs'} replace />

  // Update the field, and clear its error once the user starts fixing it
  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validateRegister(values)
    setErrors(found)
    if (hasErrors(found)) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }

    setSubmitting(true)
    setServerError('')
    try {
      // confirmPassword is only checked here; register() never sends it
      const data = await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
      })
      login(data)
      navigate(HOME_BY_ROLE[data.user.role] ?? '/gigs', {
        replace: true,
        state: { message: `Welcome, ${data.user.name}!`, type: 'success' },
      })
    } catch (err) {
      setServerError(err.status === 409 ? EMAIL_TAKEN : err.message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Create an account</h1>
      <form className="card form-narrow" onSubmit={handleSubmit} noValidate>
        <Alert type="error">
          {serverError}
          {serverError === EMAIL_TAKEN && (
            <>
              {' '}
              <Link to="/login">Log in instead</Link>
            </>
          )}
        </Alert>

        <FormField
          id="name"
          label="Name"
          autoComplete="name"
          maxLength={100}
          value={values.name}
          onChange={handleChange}
          error={errors.name}
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          maxLength={254}
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint={PASSWORD_RULE}
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <fieldset className="fieldset">
          <legend>I want to:</legend>
          {ROLE_CHOICES.map((choice) => (
            <label key={choice.value} className="choice">
              <input
                type="radio"
                name="role"
                value={choice.value}
                checked={values.role === choice.value}
                onChange={handleChange}
              />
              <span>
                <strong>{choice.title}</strong>
                <br />
                <span className="muted">{choice.text}</span>
              </span>
            </label>
          ))}
          {errors.role && <small className="field-error">{errors.role}</small>}
        </fieldset>

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </>
  )
}

export default RegisterPage

// The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
