import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Badge, Card } from '@/shared/ui'
import { OWNER_LABEL, TASKS, type Owner, type TaskStatus } from '@/shared/config'
import { homePathFor, useSession } from '@/entities/session'

const STATUS: Record<TaskStatus, { title: string; hint: string; tone: 'success' | 'warning' | 'neutral' }> = {
  ready: { title: 'Готово', hint: 'Работает на настоящих данных', tone: 'success' },
  mock: { title: 'Макет', hint: 'Интерфейс есть, данные фиктивные — нужна реализация', tone: 'warning' },
  todo: { title: 'Не начато', hint: 'В интерфейсе не видно, но нужно для сдачи', tone: 'neutral' },
}

const OWNERS: Owner[] = ['FE', 'BE', 'ML']

/** Карта задач: все блоки финальной версии — что готово, что макет и кто доводит. Для созвона команды */
export function TaskMapPage() {
  const user = useSession((s) => s.user)
  const { hash } = useLocation()
  const [owner, setOwner] = useState<Owner | null>(null)
  const visible = TASKS.filter((t) => !owner || t.owners.includes(owner))

  // Переход с метки на экране ведёт к нужной карточке
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [hash])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to={user ? homePathFor(user.role) : '/login'}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> {user ? 'В кабинет' : 'Ко входу'}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Карта задач</h1>
      <p className="mt-1 max-w-3xl text-sm text-ink-muted">
        Все блоки финальной версии продукта: что уже работает, что пока макет, кто доводит и какой критерий кейса это закрывает.
        В приложении те же блоки подсвечены рамками — включите «Разметку задач» в шапке.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {OWNERS.map((o) => {
          const mine = TASKS.filter((t) => t.status !== 'ready' && t.todo.some((x) => x.owner === o))
          return (
            <Card key={o} className="!p-4">
              <div className="text-sm font-semibold text-ink">{OWNER_LABEL[o]}</div>
              <div className="text-xs text-ink-muted">задач с работой: {mine.length}</div>
            </Card>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[null, ...OWNERS].map((o) => (
          <button
            key={o ?? 'all'}
            type="button"
            onClick={() => setOwner(o)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              owner === o ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-muted hover:text-ink'
            }`}
          >
            {o ? OWNER_LABEL[o] : 'Все'}
          </button>
        ))}
      </div>

      {(['mock', 'todo', 'ready'] as TaskStatus[]).map((status) => {
        const tasks = visible.filter((t) => t.status === status)
        if (!tasks.length) return null
        return (
          <section key={status} className="mt-8">
            <div className="mb-3 flex items-baseline gap-2">
              <h2 className="text-lg font-semibold text-ink">{STATUS[status].title}</h2>
              <span className="text-sm text-ink-muted">{STATUS[status].hint}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {tasks.map((task) => (
                <Card key={task.id} className={hash === `#${task.id}` ? 'ring-2 ring-accent-ring' : ''}>
                  <div id={task.id} className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-ink">{task.title}</h3>
                    <Badge tone={STATUS[status].tone}>{STATUS[status].title}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-muted">{task.summary}</p>
                  <p className="mt-2 text-xs text-ink-soft">{task.criteria}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {task.owners.map((o) => (
                      <span key={o} className="rounded-lg bg-canvas px-2 py-1 text-xs font-medium text-ink">
                        {OWNER_LABEL[o]}
                      </span>
                    ))}
                  </div>
                  {task.todo.length > 0 && (
                    <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
                      {task.todo
                        .filter((x) => !owner || x.owner === owner)
                        .map((x) => (
                          <li key={x.text} className="flex gap-2">
                            <span className="w-16 shrink-0 text-xs font-semibold text-ink-muted">{OWNER_LABEL[x.owner]}</span>
                            <span className="text-ink">{x.text}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                  {task.where && (
                    <Link
                      to={task.where.path}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                    >
                      {task.where.label} <ArrowUpRight size={14} />
                    </Link>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
