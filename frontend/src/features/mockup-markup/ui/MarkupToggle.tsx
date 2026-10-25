import { Tags } from 'lucide-react'
import { useMockupMarkup } from '@/shared/lib'

/** Включить или скрыть метки задач на экранах. Для демо жюри — выключить */
export function MarkupToggle() {
  const { enabled, toggle } = useMockupMarkup()
  return (
    <button
      type="button"
      onClick={toggle}
      title="Показать, какие блоки готовы, а какие — макет, и чья это задача"
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
        enabled ? 'bg-amber-100 text-amber-900' : 'text-ink-muted hover:bg-slate-100 hover:text-ink'
      }`}
    >
      <Tags size={15} /> <span className="hidden sm:inline">Разметка задач</span>
    </button>
  )
}
