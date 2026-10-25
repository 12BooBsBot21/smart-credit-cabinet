import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, MockFrame, Section, Spinner } from '@/shared/ui'
import { pct } from '@/shared/lib'
import { useBankApplications } from '@/entities/application'
import { useConveyorStats } from '@/entities/conveyor-stats'

/** Дашборд конвейера: как работает процесс в целом — банк управляет им, а не только разбирает заявки */
export function BankDashboardPage() {
  const stats = useConveyorStats()
  const queue = useBankApplications('MANUAL_REVIEW')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Дашборд конвейера</h1>
        <p className="mt-1 text-sm text-ink-muted">Последние 30 дней: сколько заявок, как быстро решаем, почему отказываем.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-xs text-ink-muted">В очереди ручной проверки сейчас</div>
          <div className="mt-1 text-3xl font-bold text-ink">{queue.data?.length ?? '…'}</div>
          <Link to="/bank" className="mt-1 inline-block text-xs font-medium text-accent hover:underline">
            Открыть очередь · настоящие данные
          </Link>
        </Card>
        <MockFrame taskId="bank-dashboard" className="sm:col-span-1 lg:col-span-3">
          {stats.data && (
            <div className="grid h-full gap-4 sm:grid-cols-1 lg:grid-cols-3">
              <Tile label="Заявок за 30 дней" value={String(stats.data.received)} />
              <Tile label="Решено автоматически" value={pct(Math.round(stats.data.autoDecisionShare * 100))} />
              <Tile
                label="Медиана времени решения"
                value={`${stats.data.medianAutoMinutes} мин`}
                hint={`вручную — ${String(stats.data.medianManualHours).replace('.', ',')} ч · SLA ${pct(Math.round(stats.data.slaCompliance * 100))}`}
              />
            </div>
          )}
        </MockFrame>
      </div>

      <MockFrame taskId="bank-dashboard">
        {stats.isPending || !stats.data ? (
          <Spinner />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Воронка конвейера">
              <Bars items={stats.data.funnel.map((f) => ({ label: f.stage, value: f.count }))} max={stats.data.received} />
            </Section>
            <Section title="Исходы решений">
              <ul className="space-y-2.5">
                {stats.data.outcomes.map((o) => (
                  <li key={o.label} className="flex items-center justify-between gap-3 text-sm">
                    <Badge tone={o.tone}>{o.label}</Badge>
                    <span className="font-semibold text-ink">{o.count}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Главные причины отказов и иных условий">
              <Bars items={stats.data.topReasons.map((r) => ({ label: `${r.code} · ${r.text}`, value: Math.round(r.share * 100), suffix: '%' }))} max={100} />
            </Section>
            <Section title="Заявки по дням">
              <div className="flex h-32 items-end gap-1">
                {stats.data.daily.map((count, i) => (
                  <div key={i} className="flex h-full flex-1 items-end" title={`${count} заявок`}>
                    <div className="w-full rounded-t bg-sky-400/80" style={{ height: `${(count / Math.max(...stats.data.daily)) * 100}%` }} />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-muted">30 дней, от старых к новым</p>
            </Section>
          </div>
        )}
      </MockFrame>
    </div>
  )
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: ReactNode }) {
  return (
    <Card>
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </Card>
  )
}

function Bars({ items, max }: { items: { label: string; value: number; suffix?: string }[]; max: number }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-ink">{item.label}</span>
            <span className="font-semibold text-ink">
              {item.value}
              {item.suffix}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-accent/80" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
