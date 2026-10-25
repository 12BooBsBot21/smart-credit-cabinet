import { money, months, pct } from '@/shared/lib'

/** Условия предложения. Подходит и для предложения клиенту, и для рекомендации системы андеррайтеру */
export interface OfferTermsData {
  amount: number
  term_months: number
  rate: number
  monthly_payment: number
  collateral?: string | null
  product_name?: string
}

export function OfferTerms({ offer }: { offer: OfferTermsData }) {
  return (
    <div>
      {offer.product_name && <div className="mb-2 text-sm font-semibold text-ink">{offer.product_name}</div>}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <Term label="Сумма" value={money(offer.amount)} />
        <Term label="Срок" value={months(offer.term_months)} />
        <Term label="Ставка" value={`${pct(offer.rate)} годовых`} />
        <Term label="Платёж в месяц" value={money(offer.monthly_payment)} />
      </dl>
      {offer.collateral && <p className="mt-2 text-xs text-ink-muted">Залог: {offer.collateral}</p>}
    </div>
  )
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  )
}
