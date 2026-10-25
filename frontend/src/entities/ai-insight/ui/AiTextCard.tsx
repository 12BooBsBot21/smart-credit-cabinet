import type { ReactNode } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

/** Блок текста от ИИ с явной пометкой — пользователь должен видеть, что текст сгенерирован */
export function AiTextCard({ title, loading, children }: { title: string; loading?: boolean; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-800">
        <Sparkles size={14} /> {title}
        <span className="ml-auto font-normal text-violet-600">сгенерировано ИИ · проверяйте важное</span>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-violet-700">
          <Loader2 size={15} className="animate-spin" /> Формулирую…
        </div>
      ) : (
        <div className="text-sm leading-relaxed text-ink">{children}</div>
      )}
    </div>
  )
}
