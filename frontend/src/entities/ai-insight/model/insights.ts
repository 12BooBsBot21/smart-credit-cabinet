// ИИ и ML — МАКЕТ. Тексты собираются шаблонами из настоящих данных заявки,
// «второе мнение» считается формулой поверх скоринга. Задачи ML-инженера:
//   - заменить шаблоны на LLM с открытыми весами (шаблоны остаются запасным вариантом);
//   - заменить формулу на обученную модель (логистическая регрессия) с настоящими вкладами признаков.
// Типы описаны минимально: сюда подходит и заявка клиента, и карточка банка.

import { money, moneyShort, months, pct } from '@/shared/lib'

interface OfferLike {
  amount: number
  term_months: number
  monthly_payment: number
  status: string
  product_name: string
}

export interface ClientExplanationInput {
  status: string
  amount: number
  term_months: number
  product_name: string
  offers: OfferLike[]
  decision: { reasons: string[] } | null
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** Объяснение решения клиенту простыми словами. null — объяснять пока нечего */
export function buildClientExplanation(app: ClientExplanationInput): string | null {
  const proposed = app.offers.filter((o) => o.status === 'PROPOSED')
  const reason = app.decision?.reasons[0]

  switch (app.status) {
    case 'APPROVED': {
      const offer = proposed[0]
      if (!offer) return null
      return `Банк одобрил ${money(offer.amount)} на ${months(offer.term_months)}. Платёж — около ${money(offer.monthly_payment)} в месяц: по оборотам вашего бизнеса он посилен. Осталось принять условия и подписать договор прямо здесь — ехать в офис не нужно.`
    }
    case 'COUNTER_OFFER': {
      const longer = proposed.find((o) => o.amount === app.amount && o.term_months > app.term_months)
      const smaller = proposed.find((o) => o.amount < app.amount && o.product_name === app.product_name)
      const other = proposed.find((o) => o.product_name !== app.product_name)
      const parts = [
        `Банк готов выдать кредит, но не совсем на тех условиях, что вы просили: платёж за ${months(app.term_months)} занял бы слишком большую долю выручки.`,
      ]
      if (longer) parts.push(`Если растянуть срок до ${months(longer.term_months)}, сумма останется той же, а платёж снизится до ${money(longer.monthly_payment)} в месяц.`)
      if (smaller) parts.push(`Если важен короткий срок — банк даст ${money(smaller.amount)} на ${months(smaller.term_months)}.`)
      if (other) parts.push(`Ещё вариант — «${other.product_name}»: ${money(other.amount)} на ${months(other.term_months)}.`)
      parts.push('Выберите то, что удобнее бизнесу.')
      return parts.join(' ')
    }
    case 'REJECTED':
      return `Сейчас банк не может выдать кредит. Главная причина: ${reason ? lowerFirst(reason) : 'финансовые показатели'}. Это не навсегда: когда ситуация изменится, подайте новую заявку — данные компании заполнятся сами.`
    case 'NEEDS_INFO':
      return `Банку не хватает сведений, чтобы принять решение${reason ? `: ${lowerFirst(reason)}` : ''}. Ответьте на запрос ниже — заявка вернётся в работу автоматически.`
    case 'MANUAL_REVIEW':
      return 'Заявку смотрит специалист банка — так бывает с крупными суммами или когда данные нужно перепроверить вручную. Решение появится здесь, следить отдельно не нужно.'
    default:
      return null
  }
}

export interface UnderwriterSummaryInput {
  company_name: string
  product_name: string
  amount: number
  term_months: number
  collateral_description: string | null
  collateral_value: number | null
  facts: {
    business_age_months: number
    avg_monthly_revenue: number
    revenue_source: string
    revenue_volatility: number | null
    revenue_mismatch: number | null
    current_overdue_days: number
    max_overdue_days_24m: number
    current_monthly_payments: number
    has_tax_debt: boolean
    mass_registration: boolean
    bki_available: boolean
  }
  score: { score: number; grade: string } | null
  decisions: { recommendation: { outcome: string } | null }[]
}

const RECOMMENDATION_TEXT: Record<string, string> = {
  APPROVED: 'одобрить на запрошенных условиях',
  COUNTER_OFFER: 'предложить иные условия',
  NEEDS_INFO: 'запросить информацию',
  REJECTED: 'отказать',
}

/** Резюме для андеррайтера: «что важно» и «на что обратить внимание» */
export function buildUnderwriterSummary(app: UnderwriterSummaryInput): { highlights: string[]; attention: string[] } {
  const f = app.facts
  const age = `${Math.floor(f.business_age_months / 12)} г. ${f.business_age_months % 12} мес.`
  const volatility =
    f.revenue_volatility === null ? '' : f.revenue_volatility < 0.3 ? ', стабильная' : f.revenue_volatility >= 0.7 ? ', сильно колеблется — похоже на сезонность' : ''
  const highlights = [
    `${app.company_name}: бизнесу ${age}, выручка около ${moneyShort(f.avg_monthly_revenue)} в месяц (${
      f.revenue_source === 'ACCOUNT' ? 'по счёту в банке' : 'со слов клиента'
    }${volatility}).`,
    `Запрошено ${money(app.amount)} на ${months(app.term_months)}, «${app.product_name}»${
      app.collateral_description
        ? `, залог — ${app.collateral_description}${app.collateral_value ? ` (LTV ${pct(Math.round((app.amount / app.collateral_value) * 100))})` : ''}`
        : ''
    }.`,
    app.score ? `Скоринг: ${app.score.score} баллов, грейд ${app.score.grade}.` : 'Скоринг не проводился — не хватило данных из внешних источников.',
    f.current_overdue_days === 0 && f.max_overdue_days_24m === 0
      ? 'Кредитная история без просрочек.'
      : `Просрочки: сейчас ${f.current_overdue_days} дн., максимум за 2 года — ${f.max_overdue_days_24m} дн.`,
  ]
  const recommendation = [...app.decisions].reverse().find((d) => d.recommendation)?.recommendation
  if (recommendation) highlights.push(`Система рекомендует ${RECOMMENDATION_TEXT[recommendation.outcome] ?? recommendation.outcome}.`)

  const attention: string[] = []
  if (f.mass_registration) attention.push('Массовый адрес или руководитель по данным ФНС — проверьте фактическое присутствие бизнеса.')
  if (f.has_tax_debt) attention.push('Есть недоимка по налогам.')
  if (f.revenue_mismatch !== null && f.revenue_mismatch > 0.3)
    attention.push(`Заявленная выручка расходится с оборотами по счёту на ${pct(Math.round(f.revenue_mismatch * 100))}.`)
  if (!f.bki_available) attention.push('Бюро кредитных историй не ответило — история неизвестна, запросите справку у клиента.')
  if (f.current_monthly_payments > 0) attention.push(`Уже платит по кредитам ${moneyShort(f.current_monthly_payments)} в месяц.`)
  if (app.amount > 5_000_000) attention.push('Сумма выше лимита автоматического решения.')
  if (attention.length === 0) attention.push('Существенных рисков не видно.')
  return { highlights, attention }
}

export interface SecondOpinionInput {
  score: { score: number; grade: string; factors: { name: string; points: number }[] } | null
  facts: { mass_registration: boolean; revenue_volatility: number | null }
}

export interface SecondOpinion {
  pd: number // вероятность дефолта, 0..1
  band: string // грейд, которому соответствует вероятность
  agrees: boolean // совпадает ли с грейдом балльной карты
  contributions: { name: string; impact: number }[] // >0 — повышает риск
}

const bandFor = (pd: number) => (pd < 0.01 ? 'A' : pd < 0.03 ? 'B' : pd < 0.1 ? 'C' : pd < 0.25 ? 'D' : 'E')

/** «Второе мнение» ML-модели. На решение не влияет — подсвечивает расхождения с балльной картой */
export function buildSecondOpinion({ score, facts }: SecondOpinionInput): SecondOpinion | null {
  if (!score) return null
  let pd = 1 / (1 + Math.exp((score.score - 520) / 40))
  const contributions = score.factors
    .filter((f) => f.points !== 0)
    .map((f) => ({ name: f.name, impact: -f.points / 10 }))
  // Нелинейные эффекты, которых нет в балльной карте, — то, ради чего нужна вторая модель
  if (facts.mass_registration) {
    pd *= 1.8
    contributions.push({ name: 'Массовая регистрация вместе с крупной суммой', impact: 4 })
  }
  if (facts.revenue_volatility !== null && facts.revenue_volatility >= 0.7) {
    pd *= 0.75
    contributions.push({ name: 'Сезонность регулярная — выручка возвращается каждый год', impact: -2 })
  }
  pd = Math.min(0.95, Math.max(0.001, pd))
  contributions.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
  const band = bandFor(pd)
  return { pd, band, agrees: band === score.grade, contributions: contributions.slice(0, 6) }
}
