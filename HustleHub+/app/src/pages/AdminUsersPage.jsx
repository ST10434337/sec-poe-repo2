import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, setUserActive, setUserRole } from '../api/admin.js'
import { useAuth } from '../auth/AuthContext.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import Pagination from '../components/Pagination.jsx'
import { ROLES, ROLE_LABELS } from '../utils/constants.js'
import { formatDate } from '../utils/format.js'

// Admins enable or disable accounts and change roles (to freelancer or admin only)
// The admin rate limit is low (25 per 15 minutes), so after an action only that row is updated,
// instead of loading the whole list again
function AdminUsersPage() {
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const { data, error, loading, setData } = useApi(() => getUsers(page), [page])

  // Replace the changed fields in one row of the table
  const updateRow = (id, changes) =>
    setData((current) => ({
      ...current,
      users: current.users.map((row) => (row._id === id ? { ...row, ...changes } : row)),
    }))

  async function runAction(row, question, action, doneMessage) {
    if (!window.confirm(question)) return

    setBusyId(row._id)
    setActionError('')
    try {
      updateRow(row._id, await action())
      navigate('/admin/users', { replace: true, state: { message: doneMessage, type: 'success' } })
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const toggleActive = (row) =>
    runAction(
      row,
      row.isActive
        ? `Disable ${row.name}'s account?\n\nThey will be logged out and cannot log in until you enable it again.`
        : `Enable ${row.name}'s account?`,
      async () => ({ isActive: (await setUserActive(row._id, !row.isActive)).user.isActive }),
      row.isActive ? `${row.name}'s account is disabled.` : `${row.name}'s account is enabled.`,
    )

  // The role reply has "id", not "_id", so only the new role is copied into the row
  const changeRole = (row, role) =>
    runAction(
      row,
      `Make ${row.name} a ${ROLE_LABELS[role].toLowerCase()}?`,
      async () => ({ role: (await setUserRole(row._id, role)).user.role }),
      `${row.name} is now a ${ROLE_LABELS[role].toLowerCase()}.`,
    )

  return (
    <>
      <h1>Users</h1>

      <Alert type="error">{actionError}</Alert>
      {loading && <p className="muted">Loading users…</p>}
      {!loading && error && <Alert type="error">{error}</Alert>}

      {!loading && data && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((row) => {
                  // An admin cannot change their own account here (the API also blocks self-disable)
                  const isMe = row.email === me.email
                  const busy = busyId === row._id
                  return (
                    <tr key={row._id} className={row.isActive ? undefined : 'row-muted'}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{ROLE_LABELS[row.role] ?? row.role}</td>
                      <td>
                        {row.isActive ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-muted">Disabled</span>
                        )}
                      </td>
                      <td>{formatDate(row.createdAt)}</td>
                      <td>
                        {isMe ? (
                          <span className="muted">This is you</span>
                        ) : (
                          <div className="actions">
                            <button
                              type="button"
                              className={`btn btn-small ${row.isActive ? 'btn-danger' : 'btn-secondary'}`}
                              disabled={busy}
                              onClick={() => toggleActive(row)}
                            >
                              {row.isActive ? 'Disable' : 'Enable'}
                              <span className="sr-only">: {row.name}</span>
                            </button>
                            {row.role === ROLES.CLIENT && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                disabled={busy}
                                onClick={() => changeRole(row, ROLES.FREELANCER)}
                              >
                                Make freelancer<span className="sr-only">: {row.name}</span>
                              </button>
                            )}
                            {row.role !== ROLES.ADMIN && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                disabled={busy}
                                onClick={() => changeRole(row, ROLES.ADMIN)}
                              >
                                Make admin<span className="sr-only">: {row.name}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  )
}

export default AdminUsersPage
