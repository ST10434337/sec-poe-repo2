import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteGig, getMyGigs } from '../api/gigs.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import Pagination from '../components/Pagination.jsx'
import { categoryLabel } from '../utils/constants.js'
import { formatDate, formatRand } from '../utils/format.js'

// The freelancer's own gigs, including deleted ones, with edit and delete
function MyGigsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const { data, error, loading, reload } = useApi(() => getMyGigs(page), [page])

  async function handleDelete(gig) {
    const sure = window.confirm(
      `Delete "${gig.title}"?\n\nClients will no longer see it. Bookings already made on it are kept.`,
    )
    if (!sure) return

    setDeletingId(gig._id)
    setDeleteError('')
    try {
      await deleteGig(gig._id)
      // Show the message the same way as other pages, then load the list again
      navigate('/my-gigs', { replace: true, state: { message: 'Gig deleted.', type: 'success' } })
      reload()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>My gigs</h1>
        <Link to="/my-gigs/new" className="btn">Create a gig</Link>
      </div>

      <Alert type="error">{deleteError}</Alert>
      {loading && <p className="muted">Loading your gigs…</p>}
      {!loading && error && <Alert type="error">{error}</Alert>}

      {!loading && data && data.gigs.length === 0 && (
        <p className="card">You have no gigs yet. Press Create a gig to add one, so clients can book you.</p>
      )}

      {!loading && data && data.gigs.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.gigs.map((gig) => (
                  <tr key={gig._id} className={gig.isActive ? undefined : 'row-muted'}>
                    <td>
                      {/* Deleted gigs have no public page any more */}
                      {gig.isActive ? <Link to={`/gigs/${gig._id}`}>{gig.title}</Link> : gig.title}
                    </td>
                    <td>{categoryLabel(gig.category)}</td>
                    <td>{formatRand(gig.price)}</td>
                    <td>
                      {gig.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-muted">Deleted</span>
                      )}
                    </td>
                    <td>{formatDate(gig.createdAt)}</td>
                    <td>
                      {gig.isActive && (
                        <div className="actions">
                          <Link to={`/my-gigs/${gig._id}/edit`} className="btn btn-secondary btn-small">
                            Edit<span className="sr-only">: {gig.title}</span>
                          </Link>
                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            disabled={deletingId === gig._id}
                            onClick={() => handleDelete(gig)}
                          >
                            {deletingId === gig._id ? 'Deleting…' : 'Delete'}
                            <span className="sr-only">: {gig.title}</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  )
}

export default MyGigsPage
