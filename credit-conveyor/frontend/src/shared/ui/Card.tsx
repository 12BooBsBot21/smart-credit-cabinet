import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card p-5 sm:p-6 ${className}`}>{children}</section>
}

/** Карточка с заголовком и необязательным блоком справа (кнопка, бейдж) */
export function Section({
  title,
  aside,
  children,
  className = '',
}: {
  title: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </Card>
  )
}

/** Список «название — значение» */
export function Definitions({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([term, value], i) => (
        <div key={i}>
          <dt className="text-xs text-ink-muted">{term}</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
