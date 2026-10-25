import { useState } from 'react'
import { Alert, Card, Spinner } from '@/shared/ui'
import {
  ApplicationTable,
  STATUS_LABEL,
  useBankApplications,
  type ApplicationStatus,
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

export function BankQueuePage() {
  const [status, setStatus] = useState<ApplicationStatus | null>('MANUAL_REVIEW')
  const applications = useBankApplications(status)

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
        <ApplicationTable applications={applications.data} hrefFor={(a) => `/bank/applications/${a.id}`} showCompany />
      )}
    </div>
  )
}
