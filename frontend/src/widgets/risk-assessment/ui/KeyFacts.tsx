import { Definitions, Section } from '@/shared/ui'
import { moneyShort, pct } from '@/shared/lib'
import type { BankApplicationDetail } from '@/entities/application'

/** Ключевые показатели: то, на что андеррайтер смотрит в первую очередь */
export function KeyFacts({ facts }: { facts: BankApplicationDetail['facts'] }) {
  const age = facts.business_age_months
  return (
    <Section title="Ключевые показатели">
      <Definitions
        items={[
          ['Статус в ЕГРЮЛ', facts.company_status],
          ['Срок бизнеса', `${Math.floor(age / 12)} г. ${age % 12} мес.`],
          [
            'Среднемесячная выручка',
            `${moneyShort(facts.avg_monthly_revenue)} · ${facts.revenue_source === 'ACCOUNT' ? 'по счёту в банке' : 'со слов клиента'}`,
          ],
          ['Колебания выручки', facts.revenue_volatility === null ? 'нет данных' : `коэф. вариации ${facts.revenue_volatility.toFixed(2)}`],
          [
            'Расхождение с оборотами',
            facts.revenue_mismatch === null ? '—' : pct(Math.round(facts.revenue_mismatch * 100)),
          ],
          ['Текущие платежи по кредитам', moneyShort(facts.current_monthly_payments)],
          ['Просрочка сейчас / макс. за 2 года', `${facts.current_overdue_days} / ${facts.max_overdue_days_24m} дн.`],
          ['Запросы в бюро за 30 дней', String(facts.inquiries_30d)],
          ['Недоимка по налогам', facts.has_tax_debt ? 'есть' : 'нет'],
          ['Массовый адрес или руководитель', facts.mass_registration ? 'да' : 'нет'],
        ]}
      />
      {!facts.bki_available && <p className="mt-3 text-xs text-amber-700">Бюро кредитных историй не ответило — данные о просрочках неполные.</p>}
    </Section>
  )
}
