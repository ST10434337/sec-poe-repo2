import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { becomeFreelancer, getMe } from '../api/auth.js'
import { useAuth } from '../auth/AuthContext.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import { ROLES, ROLE_LABELS } from '../utils/constants.js'

// The logged-in user's details, and the one-way upgrade from client to freelancer
function AccountPage() {
  const { user, login, updateUser } = useAuth()
  const navigate = useNavigate()
  const [upgradeError, setUpgradeError] = useState('')
  const [upgrading, setUpgrading] = useState(false)

  // /me is the only call that refreshes the saved details, in case an admin changed the role
  // It counts towards the login rate limit, so only this page calls it
  const { data: me, error } = useApi(
    () =>
      getMe().then((details) => {
        updateUser(details)
        return details
      }),
    [],
  )

  // Show the saved details straight away, then the fresh ones from /me
  const details = me ?? user

  async function handleBecomeFreelancer() {
    const sure = window.confirm(
      'Become a freelancer?\n\nYou will no longer be able to book gigs, your bookings list will be hidden, and this cannot be undone.',
    )
    if (!sure) return

    setUpgrading(true)
    setUpgradeError('')
    try {
      // The API returns a new token with the new role
      login(await becomeFreelancer())
      navigate('/my-gigs', {
        state: { message: "You're now a freelancer. Create your first gig.", type: 'success' },
      })
    } catch (err) {
      setUpgradeError(err.message)
      setUpgrading(false)
    }
  }

  return (
    <>
      <h1>My account</h1>
      <Alert type="error">{error}</Alert>

      <dl className="card details">
        <dt>Name</dt>
        <dd>{details.name}</dd>
        <dt>Email</dt>
        <dd>{details.email}</dd>
        <dt>Account type</dt>
        <dd>{ROLE_LABELS[details.role] ?? details.role}</dd>
      </dl>

      {details.role === ROLES.CLIENT && (
        <section className="card">
          <h2>Become a freelancer</h2>
          <p>As a freelancer you can create gigs and get booked by clients. Before you switch:</p>
          <ul>
            <li>You will no longer be able to book gigs.</li>
            <li>Your current bookings list will be hidden.</li>
            <li>This cannot be undone.</li>
          </ul>
          <Alert type="error">{upgradeError}</Alert>
          <button type="button" className="btn" onClick={handleBecomeFreelancer} disabled={upgrading}>
            {upgrading ? 'Switching…' : 'Become a freelancer'}
          </button>
        </section>
      )}
    </>
  )
}

export default AccountPage
