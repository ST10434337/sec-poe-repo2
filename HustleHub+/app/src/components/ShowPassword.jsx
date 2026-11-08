// A "Show password" tick box, so users can check what they typed
// The page keeps the on/off value and changes its password boxes between type="password" and type="text"
// Passwords start hidden, and the pages hide them again when the form is sent
function ShowPassword({ id, checked, onChange, label = 'Show password' }) {
  return (
    <label className="show-password" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export default ShowPassword
