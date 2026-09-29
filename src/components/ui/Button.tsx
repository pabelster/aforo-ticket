import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
  block?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  block = false,
  className = '',
  children,
  type = 'button',
  ...props
}: Props) {
  const classes = ['btn', `btn-${variant}`, block ? 'btn-block' : '', className].filter(Boolean).join(' ')
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
