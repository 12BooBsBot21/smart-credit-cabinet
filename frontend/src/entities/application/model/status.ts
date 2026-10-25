import type { Tone } from '@/shared/ui'
import type { ApplicationStatus } from './types'

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Отправлена',
  VALIDATION: 'Проверка данных',
  NEEDS_INFO: 'Нужны уточнения',
  ENRICHMENT: 'Сбор сведений',
  SCORING: 'Оценка риска',
  DECISION: 'Принятие решения',
  MANUAL_REVIEW: 'Ручная проверка',
  APPROVED: 'Одобрено',
  COUNTER_OFFER: 'Иные условия',
  REJECTED: 'Отказ',
  SIGNING: 'Подписание',
  ISSUED: 'Выдано',
  WITHDRAWN: 'Отозвана',
  OFFER_DECLINED: 'Условия отклонены',
}

export const STATUS_TONE: Record<ApplicationStatus, Tone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'progress',
  VALIDATION: 'progress',
  NEEDS_INFO: 'warning',
  ENRICHMENT: 'progress',
  SCORING: 'progress',
  DECISION: 'progress',
  MANUAL_REVIEW: 'warning',
  APPROVED: 'success',
  COUNTER_OFFER: 'success',
  REJECTED: 'danger',
  SIGNING: 'success',
  ISSUED: 'success',
  WITHDRAWN: 'neutral',
  OFFER_DECLINED: 'neutral',
}

/** Пока заявка в этих статусах, клиент ждёт банк — страницу стоит обновлять */
const AWAITING_BANK: ApplicationStatus[] = ['SUBMITTED', 'VALIDATION', 'ENRICHMENT', 'SCORING', 'DECISION', 'MANUAL_REVIEW']

export const isAwaitingBank = (status: ApplicationStatus) => AWAITING_BANK.includes(status)

/** Этапы, которые видит клиент. Внутренние статусы банка сворачиваются в понятные шаги */
export const CLIENT_STAGES = [
  'Заявка отправлена',
  'Проверка данных',
  'Сбор сведений',
  'Оценка риска',
  'Решение',
  'Подписание',
  'Выдача',
] as const

const STAGE_OF_STATUS: Record<ApplicationStatus, number> = {
  DRAFT: -1,
  SUBMITTED: 0,
  VALIDATION: 1,
  NEEDS_INFO: 1,
  ENRICHMENT: 2,
  SCORING: 3,
  DECISION: 4,
  MANUAL_REVIEW: 4,
  APPROVED: 4,
  COUNTER_OFFER: 4,
  REJECTED: 4,
  OFFER_DECLINED: 4,
  WITHDRAWN: 1,
  SIGNING: 5,
  ISSUED: 6,
}

export const stageOf = (status: ApplicationStatus) => STAGE_OF_STATUS[status]
