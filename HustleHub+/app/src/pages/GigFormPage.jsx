import { useParams } from 'react-router-dom'

// Placeholder: the gig form is built in step 8
// One page for both create (/my-gigs/new) and edit (/my-gigs/:id/edit)
function GigFormPage() {
  const { id } = useParams()
  return <h1>{id ? 'Edit gig' : 'Create a gig'}</h1>
}

export default GigFormPage
