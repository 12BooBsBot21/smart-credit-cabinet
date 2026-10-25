import { FileText } from 'lucide-react'
import { MockFrame } from '@/shared/ui'
import { formatDate, money, months, pct } from '@/shared/lib'
import type { Offer } from '@/entities/application'

/** Текст договора из принятого предложения — клиент видит, что подписывает. В проде — PDF с сервера */
export function ContractPreview({ number, companyName, offer }: { number: string; companyName: string; offer: Offer }) {
  return (
    <MockFrame taskId="contract-preview">
      <details className="rounded-xl border border-line bg-white p-4">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <FileText size={16} /> Посмотреть договор
        </summary>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink">
          <p className="font-semibold">
            Кредитный договор № {number} от {formatDate(new Date().toISOString())}
          </p>
          <p>
            Банк предоставляет заёмщику — {companyName} — кредит «{offer.product_name}» в сумме {money(offer.amount)} на срок{' '}
            {months(offer.term_months)} под {pct(offer.rate)} годовых.
          </p>
          <p>
            Погашение — ежемесячными равными платежами около {money(offer.monthly_payment)}. Досрочное погашение без комиссии.
            {offer.collateral && ` Обеспечение: ${offer.collateral}.`}
          </p>
          <p className="text-xs text-ink-muted">Демонстрационный текст: синтетические данные, юридической силы не имеет.</p>
        </div>
      </details>
    </MockFrame>
  )
}
