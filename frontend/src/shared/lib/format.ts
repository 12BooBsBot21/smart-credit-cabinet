// Форматирование чисел и дат. Часть функций — из прототипа (lib/format.ts)

const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 })

/** 1 500 000 ₽ */
export const money = (n: number) => `${nf.format(Math.round(n))} ₽`

/** 1,5 млн ₽ · 300 тыс. ₽ */
export function moneyShort(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}${nf1.format(abs / 1_000_000)} млн ₽`
  if (abs >= 1_000) return `${sign}${nf.format(abs / 1_000)} тыс. ₽`
  return `${sign}${nf.format(abs)} ₽`
}

export function plural(n: number, one: string, few: string, many: string) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return one
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few
  return many
}

/** 12 → «1 год», 18 → «18 месяцев» */
export function months(n: number) {
  if (n % 12 === 0 && n >= 12) {
    const y = n / 12
    return `${y} ${plural(y, 'год', 'года', 'лет')}`
  }
  return `${n} ${plural(n, 'месяц', 'месяца', 'месяцев')}`
}

export const pct = (n: number) => `${nf1.format(n)}%`

const dateTime = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const dateOnly = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
export const formatDate = (iso: string) => dateOnly.format(new Date(iso))
