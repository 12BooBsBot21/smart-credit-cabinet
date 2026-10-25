// Какие документы нужны по продукту. Идея «уже есть у банка» — из прототипа (DOCS.bankHas):
// клиенту со счётом в банке не нужно загружать выписку и реквизиты повторно.
// Позже список должен приходить из API вместе с требованиями продукта.

export type DocumentStatus = 'BANK_HAS' | 'REQUIRED' | 'OPTIONAL'

export interface RequiredDocument {
  id: string
  name: string
  hint: string
  status: DocumentStatus
}

export function requiredDocuments(productCode: string, isBankClient: boolean): RequiredDocument[] {
  const docs: RequiredDocument[] = [
    {
      id: 'requisites',
      name: 'Реквизиты и данные компании',
      hint: 'Получены из ЕГРЮЛ автоматически',
      status: 'BANK_HAS',
    },
    {
      id: 'statement',
      name: 'Выписка по счёту за 12 месяцев',
      hint: isBankClient ? 'Банк видит обороты по вашему счёту' : 'Из банка, где открыт расчётный счёт',
      status: isBankClient ? 'BANK_HAS' : 'REQUIRED',
    },
    {
      id: 'passport',
      name: 'Паспорт руководителя',
      hint: isBankClient ? 'Проверен при открытии счёта' : 'Скан или фото разворота',
      status: isBankClient ? 'BANK_HAS' : 'REQUIRED',
    },
    { id: 'tax', name: 'Налоговая декларация за последний год', hint: 'PDF или фото', status: 'REQUIRED' },
  ]
  if (productCode === 'secured-loan') {
    docs.push({ id: 'pledge', name: 'Документы на залог', hint: 'Выписка ЕГРН, ПТС или договор на оборудование', status: 'REQUIRED' })
  } else {
    docs.push({ id: 'supplier', name: 'Договор или счёт поставщика', hint: 'Подтверждает цель кредита', status: 'OPTIONAL' })
  }
  return docs
}
