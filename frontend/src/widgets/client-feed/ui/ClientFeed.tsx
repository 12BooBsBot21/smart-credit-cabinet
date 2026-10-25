import { MockFrame, Section, Spinner } from '@/shared/ui'
import { useClientApplications } from '@/entities/application'
import { useMyCompany } from '@/entities/company'
import { FeedItemCard, useFeed } from '@/entities/feed'

/** Персональная лента клиента: подборка зависит от вида деятельности, региона, счёта и статусов заявок */
export function ClientFeed() {
  const company = useMyCompany()
  const applications = useClientApplications()
  const profile =
    company.data && applications.data
      ? {
          okved: company.data.okved,
          region: company.data.region,
          legalForm: company.data.legal_form,
          isBankClient: company.data.is_bank_client,
          statuses: applications.data.map((a) => a.status),
        }
      : null
  const feed = useFeed(profile)

  return (
    <MockFrame taskId="client-feed">
      <Section title="Лента для вас">
        {feed.isPending ? (
          <Spinner />
        ) : (
          <div className="space-y-4">
            {feed.data?.map((item) => <FeedItemCard key={item.id} item={item} />)}
          </div>
        )}
      </Section>
    </MockFrame>
  )
}
