import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime, moneyShort, months } from '@/shared/lib'
import type { ApplicationSummary } from '../model/types'
import { StatusBadge } from './StatusBadge'

interface Props {
  applications: ApplicationSummary[]
  hrefFor: (application: ApplicationSummary) => string
  showCompany?: boolean
  /** Дополнительные колонки справа — например, SLA и ответственный в очереди банка */
  extraColumns?: { header: string; render: (application: ApplicationSummary) => ReactNode }[]
}

export function ApplicationTable({ applications, hrefFor, showCompany = false, extraColumns = [] }: Props) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-xs text-ink-muted">
          <tr>
            <th className="px-5 py-3 font-medium">Заявка</th>
            {showCompany && <th className="px-5 py-3 font-medium">Компания</th>}
            <th className="px-5 py-3 font-medium">Продукт</th>
            <th className="px-5 py-3 font-medium">Сумма и срок</th>
            <th className="px-5 py-3 font-medium">Статус</th>
            <th className="px-5 py-3 font-medium">Обновлена</th>
            {extraColumns.map((c) => (
              <th key={c.header} className="px-5 py-3 font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {applications.map((a) => (
            <tr key={a.id} className="hover:bg-canvas">
              <td className="px-5 py-3">
                <Link to={hrefFor(a)} className="font-semibold text-ink hover:text-accent">
                  {a.number}
                </Link>
              </td>
              {showCompany && <td className="px-5 py-3 text-ink">{a.company_name}</td>}
              <td className="px-5 py-3 text-ink">{a.product_name}</td>
              <td className="px-5 py-3 text-ink">
                {moneyShort(a.amount)} · {months(a.term_months)}
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={a.status} />
              </td>
              <td className="px-5 py-3 text-ink-muted">{formatDateTime(a.updated_at)}</td>
              {extraColumns.map((c) => (
                <td key={c.header} className="px-5 py-3">
                  {c.render(a)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
