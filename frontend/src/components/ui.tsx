import type { ButtonHTMLAttributes, ReactNode } from 'react'

export const inputCls =
  'w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm text-fg placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25'

export function Logo({ size = 24 }: { size?: number }) {
  const dot = Math.round(size * 0.34)
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-[7px] shadow-lg shadow-brand/30"
      style={{
        width: size,
        height: size,
        backgroundImage: 'linear-gradient(135deg, #5e6ad2, #7170ff)',
      }}
    >
      <span className="rounded-full bg-white/95" style={{ width: dot, height: dot }} />
    </span>
  )
}

type Variant = 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/25 active:scale-[0.98]',
  ghost: 'text-muted hover:text-fg hover:bg-white/5',
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
