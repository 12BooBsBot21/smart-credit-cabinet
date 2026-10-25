import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'

type Tone = 'info' | 'success' | 'warning' | 'danger'

const STYLE: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: 'border-sky-200 bg-sky-50 text-sky-900', icon: <Info size={18} className="text-sky-600" /> },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: <CheckCircle2 size={18} className="text-emerald-600" />,
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: <AlertTriangle size={18} className="text-amber-600" />,
  },
  danger: { box: 'border-red-200 bg-red-50 text-red-900', icon: <XCircle size={18} className="text-red-600" /> },
}

export function Alert({ tone = 'info', title, children }: { tone?: Tone; title?: ReactNode; children?: ReactNode }) {
  const style = STYLE[tone]
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${style.box}`}>
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="min-w-0 space-y-1">
        {title && <div className="font-semibold">{title}</div>}
        {children}
      </div>
    </div>
  )
}
