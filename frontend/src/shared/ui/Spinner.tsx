import { Loader2 } from 'lucide-react'

export function Spinner({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-ink-muted">
      <Loader2 size={18} className="animate-spin" /> {label}
    </div>
  )
}
