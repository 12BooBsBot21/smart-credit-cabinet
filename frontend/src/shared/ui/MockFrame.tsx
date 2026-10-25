import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { OWNER_LABEL, taskById, type TaskStatus } from '@/shared/config'
import { useMockupMarkup } from '@/shared/lib'

const STYLE: Record<TaskStatus, { frame: string; label: string; title: string }> = {
  ready: { frame: 'outline-emerald-400', label: 'bg-emerald-600', title: 'Готово' },
  mock: { frame: 'outline-dashed outline-amber-400', label: 'bg-amber-500', title: 'Макет' },
  todo: { frame: 'outline-dashed outline-slate-400', label: 'bg-slate-500', title: 'Не начато' },
}

/**
 * Рамка задачи для режима разметки. Выключенная разметка — просто children, без следов макета.
 * Описание задачи берётся из реестра shared/config/tasks.ts по taskId.
 */
export function MockFrame({ taskId, children, className = '' }: { taskId: string; children: ReactNode; className?: string }) {
  const enabled = useMockupMarkup((s) => s.enabled)
  const task = taskById(taskId)
  // Без разметки обёртка остаётся только ради className (например, место в сетке)
  if (!enabled || !task) return className ? <div className={className}>{children}</div> : <>{children}</>

  const style = STYLE[task.status]
  return (
    <div className={`relative rounded-2xl outline outline-2 outline-offset-4 ${style.frame} ${className}`}>
      <Link
        to={`/map#${task.id}`}
        className={`absolute -top-3 left-3 z-20 max-w-[calc(100%-1.5rem)] truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow ${style.label}`}
        title={task.summary}
      >
        {style.title} · {task.owners.map((o) => OWNER_LABEL[o]).join(', ')} · {task.title}
      </Link>
      {children}
    </div>
  )
}
