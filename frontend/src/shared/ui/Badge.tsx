import type { ReactNode } from 'react'

export type Tone = 'neutral' | 'progress' | 'success' | 'warning' | 'danger'

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-ink-muted',
  progress: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  )
}
