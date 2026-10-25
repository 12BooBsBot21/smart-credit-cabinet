import { useState } from 'react'
import { Alert, Badge, Button, Card, MockFrame, Spinner } from '@/shared/ui'
import {
  ApplicationTable,
  STATUS_LABEL,
  useBankApplications,
  type ApplicationStatus,
  type ApplicationSummary,
} from '@/entities/application'

const FILTERS: (ApplicationStatus | null)[] = [
  'MANUAL_REVIEW',
  null,
  'NEEDS_INFO',
  'APPROVED',
  'COUNTER_OFFER',
  'REJECTED',
  'ISSUED',
]

/** Норматив ручной проверки. МАКЕТ: в проде — настройка на бэкенде */
const SLA_HOURS = 4

function slaLabel(application: ApplicationSummary) {
  if (application.status !== 'MANUAL_REVIEW') return <span className="text-ink-soft">—</span>
  const deadline = new Date(application.updated_at).getTime() + SLA_HOURS * 3600_000
  const minutes = Math.round((deadline - Date.now()) / 60_000)
  const text = `${Math.floor(Math.abs(minutes) / 60)} ч ${Math.abs(minutes) % 60} мин`
  return minutes >= 0 ? (
    <span className="whitespace-nowrap text-ink">осталось {text}</span>
  ) : (
    <span className="whitespace-nowrap font-semibold text-red-700">просрочено на {text}</span>
  )
}

export function BankQueuePage() {
  const [status, setStatus] = useState<ApplicationStatus | null>('MANUAL_REVIEW')
  const applications = useBankApplications(status)
  // МАКЕТ «взять в работу»: ответственный хранится только в памяти страницы
  const [taken, setTaken] = useState<Record<number, boolean>>({})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Очередь заявок</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Большинство заявок система решает сама. Сюда попадают серая зона, крупные суммы и сбои внешних источников.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <button
            key={value ?? 'all'}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              status === value ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-muted hover:text-ink'
            }`}
          >
            {value ? STATUS_LABEL[value] : 'Все заявки'}
          </button>
        ))}
      </div>

      {applications.isPending && <Spinner />}
      {applications.error && <Alert tone="danger">{applications.error.message}</Alert>}
      {applications.data?.length === 0 && (
        <Card>
          <p className="text-sm text-ink-muted">Здесь пока пусто.</p>
        </Card>
      )}
      {applications.data && applications.data.length > 0 && (
        <MockFrame taskId="queue-sla">
          <ApplicationTable
            applications={applications.data}
            hrefFor={(a) => `/bank/applications/${a.id}`}
            showCompany
            extraColumns={[
              { header: `SLA ${SLA_HOURS} ч`, render: slaLabel },
              {
                header: 'Ответственный',
                render: (a) =>
                  a.status !== 'MANUAL_REVIEW' ? (
                    <span className="text-ink-soft">—</span>
                  ) : taken[a.id] ? (
                    <Badge tone="progress">Вы</Badge>
                  ) : (
                    <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setTaken({ ...taken, [a.id]: true })}>
                      Взять
                    </Button>
                  ),
              },
            ]}
          />
        </MockFrame>
      )}
    </div>
  )
}
