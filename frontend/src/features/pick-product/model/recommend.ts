// Подбор продукта под задачу клиента — упрощённая версия engine/recommend.ts из прототипа.
// Это не кредитное решение, а подсказка: какой продукт лучше подходит под ответы клиента.

import type { Product, ProductMatch } from '@/entities/product'

export type Goal = 'stock' | 'gap' | 'equipment' | 'expansion'

export interface NeedAnswers {
  goal: Goal | null
  regular: boolean | null // потребность повторяется (сезон, каждый месяц)?
  hasPledge: boolean | null // есть что оставить в залог?
}

export const GOALS: { value: Goal; label: string }[] = [
  { value: 'stock', label: 'Закупить товар' },
  { value: 'gap', label: 'Закрыть кассовый разрыв' },
  { value: 'equipment', label: 'Купить технику или авто' },
  { value: 'expansion', label: 'Расширить бизнес' },
]

const clamp = (v: number) => Math.round(Math.min(97, Math.max(5, v)))

export function rankProducts(
  products: Product[],
  answers: NeedAnswers,
  company: { is_bank_client: boolean },
): { product: Product; match: ProductMatch }[] {
  const { goal, regular, hasPledge } = answers
  const shortTermGoal = goal === 'stock' || goal === 'gap'
  const capitalGoal = goal === 'equipment' || goal === 'expansion'

  return products
    .map((product) => {
      let score = 50
      const reasons: string[] = []
      const warnings: string[] = []

      if (product.code === 'credit-line') {
        if (shortTermGoal) {
          score += 25
          reasons.push('Подходит для закупок и кассовых разрывов: берёте деньги частями')
        }
        if (capitalGoal) score -= 20
        if (regular === true) {
          score += 20
          reasons.push('Нужда повторяется — лимит можно брать снова без новой заявки')
        }
        if (regular === false) score -= 10
        if (!company.is_bank_client) {
          score -= 40
          warnings.push('Доступна только клиентам с расчётным счётом в банке')
        }
      }

      if (product.code === 'working-capital') {
        reasons.push('Без залога и поручителей — решение по оборотам бизнеса')
        if (shortTermGoal && regular !== true) score += 20
        if (regular === true) {
          score -= 10
          warnings.push('К следующему сезону придётся оформлять новый кредит')
        }
        if (capitalGoal) score += 5
      }

      if (product.code === 'secured-loan') {
        if (capitalGoal) {
          score += 25
          reasons.push('Крупная сумма на долгий срок — под технику или помещение')
        }
        if (shortTermGoal) score -= 15
        if (hasPledge === true) {
          score += 20
          reasons.push(`Залог снижает ставку: от ${product.base_rate}% годовых`)
        }
        if (hasPledge === false) {
          score -= 35
          warnings.push('Нужен залог: недвижимость, транспорт или оборудование')
        }
      }

      return { product, match: { score: clamp(score), reasons, warnings } }
    })
    .sort((a, b) => b.match.score - a.match.score)
}
