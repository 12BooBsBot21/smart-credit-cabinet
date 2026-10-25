import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Alert, Card, Spinner } from '@/shared/ui'
import { ApplicationTable, useClientApplications } from '@/entities/application'
import { CompanyCard, useMyCompany } from '@/entities/company'
import { ClientFeed } from '@/widgets/client-feed'

export function ClientHomePage() {
  const applications = useClientApplications()
  const company = useMyCompany()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Мои заявки</h1>
          <p className="mt-1 text-sm text-ink-muted">Статус обновляется сам — следить за заявкой можно прямо здесь.</p>
        </div>
        <Link to="/client/applications/new" className="btn-primary">
          <Plus size={16} /> Новая заявка
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {applications.isPending && <Spinner />}
          {applications.error && <Alert tone="danger">{applications.error.message}</Alert>}
          {applications.data?.length === 0 && (
            <Card>
              <p className="text-sm text-ink-muted">Заявок пока нет. Подберите продукт и отправьте первую заявку.</p>
            </Card>
          )}
          {applications.data && applications.data.length > 0 && (
            <ApplicationTable applications={applications.data} hrefFor={(a) => `/client/applications/${a.id}`} />
          )}
          {company.data && <CompanyCard company={company.data} title="Данные компании, которые банк уже знает" />}
        </div>
        <ClientFeed />
      </div>
    </div>
  )
}
