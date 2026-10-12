import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { login as loginRequest } from '../api/auth.js'
import { useAuth } from '../auth/AuthContext.js'
import Alert from '../components/Alert.jsx'
import FormField from '../components/FormField.jsx'
import { HOME_BY_ROLE } from '../utils/constants.js'
import { hasErrors, validateLogin } from '../utils/validation.js'

// Login form ~> (The IIE, 2026)
// After logging in, go back to the page that asked for login, or to this role's home page
function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
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
    const found = validateLogin(values)
    setErrors(found)
    if (hasErrors(found)) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }

    setSubmitting(true)
    setServerError('')
    try {
      const data = await loginRequest({ email: values.email.trim(), password: values.password })
      login(data)
      const from = location.state?.from
      navigate(from ? `${from.pathname}${from.search}` : HOME_BY_ROLE[data.user.role] ?? '/gigs', { replace: true })
    } catch (err) {
      // The same message for a wrong email or a wrong password, like the API
      if (err.status === 401) setServerError('Email or password is incorrect.')
      else if (err.status === 403) setServerError('This account is disabled.')
      else setServerError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Log in</h1>
      <form className="card form-narrow" onSubmit={handleSubmit} noValidate>
        <Alert type="error">{serverError}</Alert>
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
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </>
  )
}

export default LoginPage

// The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.
