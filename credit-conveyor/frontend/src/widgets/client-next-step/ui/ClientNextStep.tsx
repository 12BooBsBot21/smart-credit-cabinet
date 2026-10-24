import { Loader2 } from 'lucide-react'
import { Alert, Section } from '@/shared/ui'
import type { ApplicationDetail, ApplicationStatus } from '@/entities/application'
import {
  AnswerInfoRequestForm,
  OfferChoice,
  SignContractForm,
  SubmitButton,
  WithdrawButton,
} from '@/features/application-actions'

// Причины решения показываем, пока клиенту нужно на них реагировать
const REASON_STATUSES: ApplicationStatus[] = ['APPROVED', 'COUNTER_OFFER', 'NEEDS_INFO', 'REJECTED']

/** «Что дальше» для клиента: по статусу заявки показываем нужное действие или пояснение */
export function ClientNextStep({ application }: { application: ApplicationDetail }) {
  const { id, status, available_actions: actions, decision } = application
  const showReasons = decision && REASON_STATUSES.includes(status) && decision.reasons.length > 0

  return (
    <Section title="Что дальше">
      <div className="space-y-4">
        <StepContent application={application} />
        {showReasons && (
          <div className="text-sm text-ink-muted">
            <div className="label mb-1">Почему такое решение</div>
            <ul className="list-disc space-y-1 pl-4">
              {decision.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
        {actions.includes('SUBMIT') && <SubmitButton applicationId={id} />}
        {actions.includes('WITHDRAW') && <WithdrawButton applicationId={id} />}
      </div>
    </Section>
  )
}

function StepContent({ application }: { application: ApplicationDetail }) {
  const { id, status, info_request: request, offers, sign_code: signCode } = application

  switch (status) {
    case 'DRAFT':
      return <Alert>Заявка сохранена как черновик и ещё не отправлена в банк.</Alert>
    case 'SUBMITTED':
    case 'VALIDATION':
    case 'ENRICHMENT':
    case 'SCORING':
    case 'DECISION':
      return (
        <div className="flex items-center gap-3 text-sm text-ink">
          <Loader2 size={18} className="animate-spin text-accent" />
          Банк обрабатывает заявку — статус обновится автоматически, страницу можно не перезагружать.
        </div>
      )
    case 'MANUAL_REVIEW':
      return (
        <Alert title="Заявку проверяет специалист банка">
          Так бывает, когда нужно посмотреть заявку внимательнее. Как только будет решение, оно появится здесь.
        </Alert>
      )
    case 'NEEDS_INFO':
      return request ? <AnswerInfoRequestForm applicationId={id} request={request} /> : null
    case 'APPROVED':
    case 'COUNTER_OFFER':
      return (
        <div className="space-y-3">
          <Alert tone="success" title={status === 'APPROVED' ? 'Кредит одобрен' : 'Банк предлагает другие условия'}>
            {status === 'APPROVED'
              ? 'Проверьте условия и примите предложение.'
              : 'Выберите подходящий вариант — или откажитесь, если условия не подходят.'}
          </Alert>
          <OfferChoice applicationId={id} offers={offers} />
        </div>
      )
    case 'SIGNING':
      return <SignContractForm applicationId={id} signCode={signCode} />
    case 'ISSUED':
      return (
        <Alert tone="success" title="Деньги на счёте">
          Договор подписан, средства зачислены на расчётный счёт. В прототипе это симуляция — реальных операций нет.
        </Alert>
      )
    case 'REJECTED':
      return <Alert tone="danger" title="Банк не может выдать кредит" />
    case 'WITHDRAWN':
      return <Alert>Заявка отозвана.</Alert>
    case 'OFFER_DECLINED':
      return <Alert>Вы отказались от условий банка. Можно подать новую заявку с другими параметрами.</Alert>
  }
}
