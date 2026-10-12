import { Link } from 'react-router-dom'
import { categoryLabel } from '../utils/constants.js'
import { formatRand } from '../utils/format.js'

// One gig in the browse grid
// Every value is rendered as plain text; React escapes it, so a title like <script> is shown, never run
//  backTo: the browse address (with the search), so the gig page can link back to the same results
function GigCard({ gig, backTo = '/gigs' }) {
  return (
    <article className="card gig-card">
      <p className="gig-category">{categoryLabel(gig.category)}</p>
      <h2 className="gig-title">{gig.title}</h2>
      <p className="gig-description">{gig.description}</p>
      <p className="gig-meta">
        <strong>{formatRand(gig.price)}</strong>
        <span className="muted">by {gig.freelancer?.name ?? 'Unknown freelancer'}</span>
      </p>
      <Link to={`/gigs/${gig._id}`} state={{ backTo }} className="btn btn-secondary">
        View gig<span className="sr-only">: {gig.title}</span>
      </Link>
    </article>
  )
}

export default GigCard
