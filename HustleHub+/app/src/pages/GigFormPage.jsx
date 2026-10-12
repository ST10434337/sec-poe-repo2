import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createGig, getGig, updateGig } from '../api/gigs.js'
import { useAuth } from '../auth/AuthContext.js'
import { useApi } from '../hooks/useApi.js'
import Alert from '../components/Alert.jsx'
import FormField from '../components/FormField.jsx'
import { CATEGORIES } from '../utils/constants.js'
import { hasErrors, validateGig } from '../utils/validation.js'

const EMPTY_GIG = { title: '', description: '', category: '', price: '' }

// The form itself; it starts with the values it is given (empty for a new gig)
function GigForm({ initial, onSave, saveLabel }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)

  // Update the field, and clear its error once the user starts fixing it
  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validateGig(values)
    setErrors(found)
    if (hasErrors(found)) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }

    setSaving(true)
    setServerError('')
    try {
      // Trimmed text, and the price as a number: the API rejects a price sent as text
      await onSave({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        price: Number(values.price),
      })
    } catch (err) {
      setServerError(err.message)
      setSaving(false)
    }
  }

  return (
    <form className="card form-medium" onSubmit={handleSubmit} noValidate>
      <Alert type="error">{serverError}</Alert>
      <FormField
        id="title"
        label="Title"
        maxLength={100}
        counter
        hint="3 to 100 characters, e.g. 'Logo design for small businesses'."
        value={values.title}
        onChange={handleChange}
        error={errors.title}
      />
      <FormField
        id="description"
        label="Description"
        as="textarea"
        rows={6}
        maxLength={2000}
        counter
        hint="10 to 2000 characters. Say what the client gets and how long it takes."
        value={values.description}
        onChange={handleChange}
        error={errors.description}
      />
      <FormField
        id="category"
        label="Category"
        as="select"
        value={values.category}
        onChange={handleChange}
        error={errors.category}
      >
        <option value="">Choose a category</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </FormField>
      <FormField
        id="price"
        label="Price (R)"
        type="number"
        inputMode="numeric"
        min={1}
        max={1000000}
        step={1}
        hint="A whole number of rand, from 1 to 1,000,000."
        value={values.price}
        onChange={handleChange}
        error={errors.price}
      />
      <div className="form-actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Saving…' : saveLabel}
        </button>
        <Link to="/my-gigs">Cancel</Link>
      </div>
    </form>
  )
}

// One page for both create (/my-gigs/new) and edit (/my-gigs/:id/edit)
function GigFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  // Editing loads the gig first; creating has nothing to load
  const { data, error, errorStatus, loading } = useApi(() => (editing ? getGig(id) : Promise.resolve(null)), [id])

  const done = (message) => navigate('/my-gigs', { state: { message, type: 'success' } })
  const backLink = (
    <p>
      <Link to="/my-gigs">← Back to my gigs</Link>
    </p>
  )

  if (!editing) {
    return (
      <>
        {backLink}
        <h1>Create a gig</h1>
        <GigForm
          initial={EMPTY_GIG}
          saveLabel="Create gig"
          onSave={async (gig) => {
            await createGig(gig)
            done('Gig created.')
          }}
        />
      </>
    )
  }

  if (loading) return <p className="muted">Loading gig…</p>

  if (error) {
    // 400 = not a valid id, 404 = missing or deleted; a deleted gig cannot be edited
    const notFound = errorStatus === 400 || errorStatus === 404
    return (
      <>
        {backLink}
        <h1>{notFound ? "This gig can't be edited" : 'Could not load this gig'}</h1>
        <Alert type="error">{notFound ? 'It does not exist or has been deleted.' : error}</Alert>
      </>
    )
  }

  const { gig } = data

  // The API also checks this (403), but there is no point showing a form that cannot be saved
  if (user.id && gig.freelancer?._id && gig.freelancer._id !== user.id) {
    return (
      <>
        {backLink}
        <h1>This gig can't be edited</h1>
        <Alert type="error">You can only change your own gigs.</Alert>
      </>
    )
  }

  return (
    <>
      {backLink}
      <h1>Edit gig</h1>
      <GigForm
        initial={{ title: gig.title, description: gig.description, category: gig.category, price: String(gig.price) }}
        saveLabel="Save changes"
        onSave={async (changes) => {
          await updateGig(gig._id, changes)
          done('Gig updated.')
        }}
      />
    </>
  )
}

export default GigFormPage
