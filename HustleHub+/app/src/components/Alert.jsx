// A coloured message box: type is 'error', 'success' or 'info'
// Errors use role="alert", so screen readers read them out straight away;
// other messages use role="status", which waits until the reader is idle 
function Alert({ type = 'info', children }) {
  if (!children) return null

  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

export default Alert

