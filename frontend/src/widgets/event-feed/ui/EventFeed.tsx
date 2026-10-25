import { EyeOff } from 'lucide-react'
import { Section } from '@/shared/ui'
import { formatDateTime } from '@/shared/lib'
import type { ApplicationEvent } from '@/entities/application'

const ACTOR_LABEL: Record<ApplicationEvent['actor'], string> = {
  CLIENT: 'Клиент',
  SYSTEM: 'Система',
  UNDERWRITER: 'Андеррайтер',
}

/**
 * Лента событий заявки. Клиенту — уведомления внутри продукта (без email и SMS),
 * банку — журнал аудита: кто, когда и что сделал, включая внутренние события.
 */
export function EventFeed({ events, title = 'Лента событий' }: { events: ApplicationEvent[]; title?: string }) {
  return (
    <Section title={title}>
      <ol className="space-y-3">
        {[...events].reverse().map((event) => (
          <li key={event.id} className="flex gap-3 text-sm">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
            <div className="min-w-0">
              <div className="text-ink">{event.message}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                <span>{formatDateTime(event.created_at)}</span>
                <span>· {event.actor_name ?? ACTOR_LABEL[event.actor]}</span>
                {!event.visible_to_client && (
                  <span className="inline-flex items-center gap-1 text-ink-soft">
                    · <EyeOff size={12} /> не видно клиенту
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
