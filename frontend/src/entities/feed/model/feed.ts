// Лента под клиента — МАКЕТ. Новости синтетические, подбор идёт по правилам прямо во фронтенде.
// Позже то же самое делает бэкенд в GET /api/feed: правила и тексты переезжают туда.

export type FeedKind = 'news' | 'tip' | 'offer' | 'reminder'

export interface FeedItem {
  id: string
  kind: FeedKind
  title: string
  text: string
  /** Почему пункт показан именно этому клиенту — главное отличие персональной ленты */
  reason: string
  daysAgo: number
}

/** Что известно о клиенте для подбора ленты */
export interface FeedProfile {
  okved: string
  region: string
  legalForm: string
  isBankClient: boolean
  statuses: string[]
}

interface FeedRule extends Omit<FeedItem, 'reason'> {
  /** Возвращает причину показа или null, если клиенту не подходит */
  match: (p: FeedProfile) => string | null
}

const okvedIs = (prefix: string, label: string) => (p: FeedProfile) =>
  p.okved.startsWith(prefix) ? `Ваш вид деятельности — ${label} (ОКВЭД ${p.okved})` : null

const RULES: FeedRule[] = [
  {
    id: 'remind-offer',
    kind: 'reminder',
    title: 'У вас есть предложение банка — оно действует 30 дней',
    text: 'Посмотрите условия в заявке и примите их, если подходят. Подписать договор можно прямо в кабинете.',
    daysAgo: 0,
    match: (p) => (p.statuses.some((s) => s === 'APPROVED' || s === 'COUNTER_OFFER') ? 'По вашей заявке принято решение' : null),
  },
  {
    id: 'remind-info',
    kind: 'reminder',
    title: 'Банк ждёт ваш ответ по заявке',
    text: 'Чтобы заявка вернулась в работу, ответьте на запрос — обычно это пара минут.',
    daysAgo: 0,
    match: (p) => (p.statuses.includes('NEEDS_INFO') ? 'Заявка ждёт уточнений' : null),
  },
  {
    id: 'tip-rejected',
    kind: 'tip',
    title: 'Как повысить шансы на одобрение',
    text: 'Закройте текущие просрочки, уменьшите сумму или добавьте залог. Новую заявку можно подать в любой момент — данные компании заполнятся сами.',
    daysAgo: 1,
    match: (p) => (p.statuses.includes('REJECTED') ? 'По одной из ваших заявок был отказ' : null),
  },
  {
    id: 'news-retail-prices',
    kind: 'news',
    title: 'Поставщики сезонных товаров поднимают цены с октября',
    text: 'К Новому году закупочные цены на декор и подарки вырастут на 8–12%. Закупку выгоднее зафиксировать заранее.',
    daysAgo: 1,
    match: okvedIs('47', 'розничная торговля'),
  },
  {
    id: 'tip-retail-season',
    kind: 'tip',
    title: 'Пик продаж в декабре? Откройте кредитную линию заранее',
    text: 'Лимит открывается один раз, а деньги берёте частями, когда пришёл счёт поставщика. Проценты — только за дни пользования.',
    daysAgo: 2,
    match: (p) => (p.okved.startsWith('47') ? 'Розничная торговля часто зависит от сезона' : null),
  },
  {
    id: 'news-flour',
    kind: 'news',
    title: 'Мука подорожала на 6% за квартал',
    text: 'Пекарни переходят на годовые контракты с мельницами: цена фиксируется, но нужны оборотные средства на предоплату.',
    daysAgo: 1,
    match: okvedIs('10', 'производство хлеба и выпечки'),
  },
  {
    id: 'news-construction',
    kind: 'news',
    title: 'Заказчики чаще требуют банковское сопровождение контрактов',
    text: 'Подрядчикам с прозрачными оборотами по счёту проще пройти отбор и получить аванс.',
    daysAgo: 2,
    match: okvedIs('43', 'строительно-монтажные работы'),
  },
  {
    id: 'news-autoparts',
    kind: 'news',
    title: 'Запчасти дорожают — автосервисы увеличивают складской запас',
    text: 'Закупка «впрок» на квартал снижает себестоимость ремонта, но временно замораживает деньги.',
    daysAgo: 1,
    match: okvedIs('45', 'ремонт автомобилей'),
  },
  {
    id: 'news-warehouses',
    kind: 'news',
    title: 'Спрос на складские площади в Подмосковье вырос',
    text: 'Владельцы складов расширяются: под залог существующих помещений банки дают крупные суммы на долгий срок.',
    daysAgo: 1,
    match: okvedIs('52', 'складирование и хранение'),
  },
  {
    id: 'news-it',
    kind: 'news',
    title: 'ИТ-компаниям с подтверждённой выручкой проще получить грант',
    text: 'Фонды смотрят на обороты по счёту и налоговую отчётность — держите их в порядке заранее.',
    daysAgo: 2,
    match: okvedIs('62', 'разработка программного обеспечения'),
  },
  {
    id: 'news-region-leasing',
    kind: 'news',
    title: 'Региональная программа льготного лизинга для МСП',
    text: 'Часть авансового платежа по лизингу оборудования компенсирует регион.',
    daysAgo: 3,
    match: (p) => (p.region.includes('Моск') ? `Ваш регион — ${p.region}` : null),
  },
  {
    id: 'news-ip',
    kind: 'news',
    title: 'ИП на упрощёнке: что изменится в отчётности в следующем году',
    text: 'Коротко о новых сроках и порогах — без канцелярита.',
    daysAgo: 4,
    match: (p) => (p.legalForm === 'IP' ? 'Вы — индивидуальный предприниматель' : null),
  },
  {
    id: 'offer-account',
    kind: 'offer',
    title: 'Откройте расчётный счёт — решения по кредитам станут быстрее',
    text: 'Банк будет видеть обороты сам: не придётся указывать выручку и прикладывать выписку.',
    daysAgo: 2,
    match: (p) => (!p.isBankClient ? 'У вашей компании нет счёта в банке' : null),
  },
  {
    id: 'tip-bank-client',
    kind: 'tip',
    title: 'Банк уже видит ваши обороты — анкета заполнится сама',
    text: 'Выписку и реквизиты прикладывать не нужно: решение по типовой заявке занимает минуты.',
    daysAgo: 5,
    match: (p) => (p.isBankClient ? 'У вас есть расчётный счёт в банке' : null),
  },
]

export function buildFeed(profile: FeedProfile, limit = 5): FeedItem[] {
  const items: FeedItem[] = []
  for (const { match, ...item } of RULES) {
    const reason = match(profile)
    if (reason) items.push({ ...item, reason })
  }
  return items.slice(0, limit)
}
