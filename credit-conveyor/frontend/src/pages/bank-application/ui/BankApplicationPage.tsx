import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Alert, Definitions, Section, Spinner } from '@/shared/ui'
import { money, months } from '@/shared/lib'
import { STATUS_LABEL, StatusBadge, useBankApplication } from '@/entities/application'
import { CompanyCard } from '@/entities/company'
import { UnderwriterDecisionForm } from '@/features/underwriter-decision'
import { EventFeed } from '@/widgets/event-feed'
import { DecisionHistory, ExternalChecks, KeyFacts, ScoreBreakdown, TurnoverChart } from '@/widgets/risk-assessment'

export function BankApplicationPage() {
  const id = Number(useParams().id)
  const { data: application, isPending, error } = useBankApplication(id)

  if (isPending) return <Spinner />
  if (error) return <Alert tone="danger">{error.message}</Alert>

  const canDecide = application.available_actions.includes('DECIDE')

  return (
    <div className="space-y-6">
      <div>
        <Link to="/bank" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Очередь заявок
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {application.number} · {application.company_name}
          </h1>
          <StatusBadge status={application.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="space-y-6">
          <Section title="Запрос клиента">
            <Definitions
              items={[
                ['Продукт', application.product_name],
                ['Сумма и срок', `${money(application.amount)} · ${months(application.term_months)}`],
                ['Цель', application.purpose],
                [
                  'Заявленная выручка за 12 мес.',
                  application.declared_revenue_12m ? money(application.declared_revenue_12m) : 'не указана',
                ],
                [
                  'Залог',
                  application.collateral_description
                    ? `${application.collateral_description}${application.collateral_value ? `, ${money(application.collateral_value)}` : ''}`
                    : 'нет',
                ],
                [
                  'Имущество, известное банку',
                  application.company_assets.length
                    ? application.company_assets.map((a) => `${a.name} (${money(a.value)})`).join('; ')
                    : 'нет данных',
                ],
              ]}
            />
          </Section>
          <KeyFacts facts={application.facts} />
          <ScoreBreakdown score={application.score} />
          <ExternalChecks checks={application.external_checks} />
          <TurnoverChart turnovers={application.turnovers} />
          <CompanyCard company={application.company} />
        </div>

        <div className="space-y-6 lg:sticky lg:top-20">
          {canDecide ? (
            <Section title="Решение андеррайтера">
              <UnderwriterDecisionForm application={application} />
            </Section>
          ) : (
            <Alert title={`Статус: ${STATUS_LABEL[application.status]}`}>
              Решение по заявке сейчас не требуется — она не на ручной проверке.
            </Alert>
          )}
          <DecisionHistory decisions={application.decisions} />
          <EventFeed events={application.events} title="Журнал заявки" />
        </div>
      </div>
    </div>
  )
}
