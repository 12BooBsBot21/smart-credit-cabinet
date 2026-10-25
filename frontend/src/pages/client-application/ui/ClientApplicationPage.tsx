import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Alert, Card, Definitions, Section, Spinner } from '@/shared/ui'
import { money, months } from '@/shared/lib'
import { StatusBadge, useClientApplication } from '@/entities/application'
import { ApplicationProgress } from '@/widgets/application-progress'
import { ClientNextStep } from '@/widgets/client-next-step'
import { EventFeed } from '@/widgets/event-feed'

export function ClientApplicationPage() {
  const id = Number(useParams().id)
  const { data: application, isPending, error } = useClientApplication(id)

  if (isPending) return <Spinner />
  if (error) return <Alert tone="danger">{error.message}</Alert>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/client" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Все заявки
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Заявка {application.number}</h1>
          <StatusBadge status={application.status} />
        </div>
        <p className="mt-1 text-sm text-ink-muted">{application.product_name}</p>
      </div>

      <Card>
        <ApplicationProgress status={application.status} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-6">
          <ClientNextStep application={application} />
          <Section title="Параметры заявки">
            <Definitions
              items={[
                ['Сумма', money(application.amount)],
                ['Срок', months(application.term_months)],
                ['Цель', application.purpose],
                [
                  'Выручка за 12 месяцев',
                  application.declared_revenue_12m ? money(application.declared_revenue_12m) : 'не указана',
                ],
                ...(application.collateral_description
                  ? ([['Залог', application.collateral_description]] as [string, string][])
                  : []),
              ]}
            />
          </Section>
        </div>
        <EventFeed events={application.events} />
      </div>
    </div>
  )
}
