import { Section } from '@/shared/ui'
import { formatDateTime } from '@/shared/lib'
import { OfferTerms, StatusBadge, type BankApplicationDetail } from '@/entities/application'

/** Все решения по заявке — системы и людей — с причинами и версией правил */
export function DecisionHistory({ decisions }: { decisions: BankApplicationDetail['decisions'] }) {
  if (decisions.length === 0) return null
  return (
    <Section title="Решения">
      <ol className="space-y-4">
        {[...decisions].reverse().map((decision) => (
          <li key={decision.id} className="rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={decision.outcome} />
              <span className="text-xs text-ink-muted">
                {decision.decided_by === 'SYSTEM' ? 'Система' : decision.user_name} · {decision.rules_version} ·{' '}
                {formatDateTime(decision.created_at)}
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {decision.reasons.map((reason) => (
                <li key={reason.code} className="text-ink">
                  <span className="mr-2 font-mono text-xs text-ink-soft">{reason.code}</span>
                  {reason.bank_text}
                </li>
              ))}
            </ul>
            {decision.recommendation && (
              <div className="mt-3 rounded-lg bg-canvas p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink-muted">
                  Рекомендация системы: <StatusBadge status={decision.recommendation.outcome} />
                </div>
                <div className="space-y-3">
                  {decision.recommendation.offers.map((offer, index) => (
                    <OfferTerms key={index} offer={offer} />
                  ))}
                  {decision.recommendation.reasons.map((reason) => (
                    <p key={reason.code} className="text-xs text-ink-muted">
                      {reason.code}: {reason.bank_text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </Section>
  )
}
