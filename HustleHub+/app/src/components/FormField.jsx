// Shared form field wrapper used by input, textarea and select controls.
// Extra props are passed to the rendered control, while hint/error text is
// linked with aria-describedby so assistive technologies can announce it (MDN Web Docs, n.d.).
function FormField({ id, label, hint, error, counter = false, as: Tag = 'input', children, ...props }) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Tag id={id} name={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props}>
        {children}
      </Tag>
      {hint && <small id={hintId} className="hint">{hint}</small>}
      {counter && props.maxLength && (
        <small className="hint counter">
          {String(props.value ?? '').length} / {props.maxLength}
        </small>
      )}
      {error && <small id={errorId} className="field-error">{error}</small>}
    </div>
  )
}

export default FormField

// MDN Web Docs n.d. aria-describedby. [online] Available at: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby (Accessed: 12 October 2026).
