import { Bell, Lightbulb, Newspaper, Sparkles, type LucideIcon } from 'lucide-react'
import type { FeedItem, FeedKind } from '../model/feed'

const KIND: Record<FeedKind, { label: string; icon: LucideIcon; color: string }> = {
  reminder: { label: 'Напоминание', icon: Bell, color: 'bg-accent-soft text-accent-dark' },
  news: { label: 'Новость', icon: Newspaper, color: 'bg-sky-50 text-sky-700' },
  tip: { label: 'Совет', icon: Lightbulb, color: 'bg-amber-50 text-amber-800' },
  offer: { label: 'Предложение', icon: Sparkles, color: 'bg-emerald-50 text-emerald-700' },
}

const when = (daysAgo: number) => (daysAgo === 0 ? 'сегодня' : daysAgo === 1 ? 'вчера' : `${daysAgo} дн. назад`)

export function FeedItemCard({ item }: { item: FeedItem }) {
  const kind = KIND[item.kind]
  const Icon = kind.icon
  return (
    <article className="flex gap-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${kind.color}`}>
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-ink-muted">
          {kind.label} · {when(item.daysAgo)}
        </div>
        <h3 className="mt-0.5 text-sm font-semibold text-ink">{item.title}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">{item.text}</p>
        <p className="mt-1 text-xs text-ink-soft">Почему показано: {item.reason}</p>
      </div>
    </article>
  )
}
