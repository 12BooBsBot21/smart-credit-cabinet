import { Badge, Section } from '@/shared/ui'
import { formatDateTime } from '@/shared/lib'
import type { BankApplicationDetail } from '@/entities/application'

/** Ответы внешних источников: статус, число попыток и сырой ответ (снимок хранится в БД) */
export function ExternalChecks({ checks }: { checks: BankApplicationDetail['external_checks'] }) {
  return (
    <Section title="Внешние источники">
      {checks.length === 0 ? (
        <p className="text-sm text-ink-muted">Запросы ещё не отправлялись.</p>
      ) : (
        <ul className="divide-y divide-line">
          {checks.map((check) => (
            <li key={check.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{check.source_name}</span>
                <span className="flex items-center gap-2 text-xs text-ink-muted">
                  {formatDateTime(check.created_at)} · попыток: {check.attempts}
                  <Badge tone={check.status === 'OK' ? 'success' : 'danger'}>
                    {check.status === 'OK' ? 'ответ получен' : 'недоступен'}
                  </Badge>
                </span>
              </div>
              {check.error && <p className="mt-1 text-xs text-red-700">{check.error}</p>}
              {check.response && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">Ответ источника</summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-canvas p-3 text-xs text-ink">
                    {JSON.stringify(check.response, null, 2)}
                  </pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
