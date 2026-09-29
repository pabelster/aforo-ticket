import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}

export function Field({ label, hint, error, id, name, ...props }: FieldProps) {
  const inputId = id ?? name
  return (
    <label className="field" htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} name={name} className="input" {...props} />
      {hint ? <small className="faint">{hint}</small> : null}
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  )
}

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hint?: string
  error?: string
}

export function TextArea({ label, hint, error, id, name, ...props }: AreaProps) {
  const inputId = id ?? name
  return (
    <label className="field" htmlFor={inputId}>
      <span>{label}</span>
      <textarea id={inputId} name={name} className="textarea" {...props} />
      {hint ? <small className="faint">{hint}</small> : null}
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  )
}

type SelectProps = {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}

export function SelectField({ label, name, value, onChange, children }: SelectProps) {
  return (
    <label className="field" htmlFor={name}>
      <span>{label}</span>
      <select
        id={name}
        name={name}
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  )
}
