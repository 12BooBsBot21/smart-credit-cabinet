// Статистика конвейера — МАКЕТ с фиксированными числами.
// Бэкенд-задача: GET /api/bank/stats считает то же самое по журналу событий за период.

export interface ConveyorStats {
  periodDays: number
  received: number
  autoDecisionShare: number // доля решений без участия человека, 0..1
  medianAutoMinutes: number
  medianManualHours: number
  slaCompliance: number // доля ручных проверок, уложившихся в срок, 0..1
  funnel: { stage: string; count: number }[]
  outcomes: { label: string; count: number; tone: 'success' | 'warning' | 'danger' | 'neutral' }[]
  topReasons: { code: string; text: string; share: number }[]
  daily: number[] // заявок в день, от старых к новым
}

export const STATS_FIXTURE: ConveyorStats = {
  periodDays: 30,
  received: 128,
  autoDecisionShare: 0.74,
  medianAutoMinutes: 3,
  medianManualHours: 2.6,
  slaCompliance: 0.92,
  funnel: [
    { stage: 'Подано', count: 128 },
    { stage: 'Прошли проверку полноты', count: 117 },
    { stage: 'Получены данные источников', count: 115 },
    { stage: 'Скоринг', count: 112 },
    { stage: 'Решение', count: 103 },
    { stage: 'Договор подписан', count: 61 },
    { stage: 'Деньги выданы', count: 58 },
  ],
  outcomes: [
    { label: 'Одобрено', count: 41, tone: 'success' },
    { label: 'Иные условия', count: 29, tone: 'success' },
    { label: 'Запрос информации', count: 11, tone: 'warning' },
    { label: 'Отказ', count: 22, tone: 'danger' },
    { label: 'Отозваны клиентом', count: 15, tone: 'neutral' },
  ],
  topReasons: [
    { code: 'R41', text: 'Платёж велик относительно выручки', share: 0.31 },
    { code: 'R11', text: 'Просрочка по действующим кредитам', share: 0.18 },
    { code: 'R50', text: 'Выручка расходится с оборотами', share: 0.14 },
    { code: 'R20', text: 'Сумма выше лимита автоодобрения', share: 0.12 },
    { code: 'R32', text: 'Грейд ниже требований продукта', share: 0.09 },
  ],
  daily: [3, 5, 4, 2, 6, 4, 3, 5, 7, 4, 3, 2, 5, 6, 4, 5, 3, 4, 6, 5, 2, 4, 5, 7, 6, 3, 4, 5, 4, 3],
}
