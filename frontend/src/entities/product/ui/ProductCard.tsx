import { AlertTriangle, Check } from 'lucide-react'
import { Badge } from '@/shared/ui'
import { moneyShort, pct } from '@/shared/lib'
import type { Product } from '../api/productApi'

/** Насколько продукт подходит под задачу клиента — считает features/pick-product */
export interface ProductMatch {
  score: number
  reasons: string[]
  warnings: string[]
}

interface Props {
  product: Product
  selected?: boolean
  onSelect?: () => void
  match?: ProductMatch
  best?: boolean
}

export function ProductCard({ product, selected = false, onSelect, match, best = false }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`card relative flex h-full w-full flex-col p-5 text-left transition hover:border-slate-300 ${
        selected ? 'border-accent ring-2 ring-accent-ring' : ''
      }`}
    >
      {best && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-white">
          Лучший вариант
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink">{product.name}</h3>
        {selected ? (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-white">
            <Check size={14} strokeWidth={3} />
          </span>
        ) : (
          match && <Badge tone={match.score >= 75 ? 'success' : match.score >= 50 ? 'warning' : 'neutral'}>{match.score}% подходит</Badge>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{product.plain_name}</p>

      {match && (match.reasons.length > 0 || match.warnings.length > 0) && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {match.reasons.slice(0, 2).map((r) => (
            <li key={r} className="flex gap-2 text-ink">
              <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={2.5} /> {r}
            </li>
          ))}
          {match.warnings.slice(0, 1).map((w) => (
            <li key={w} className="flex gap-2 text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" /> {w}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-4 text-xs text-ink">
        <span className="rounded-lg bg-canvas px-2 py-1">
          {moneyShort(product.amount_min)} — {moneyShort(product.amount_max)}
        </span>
        <span className="rounded-lg bg-canvas px-2 py-1">
          {product.term_min}–{product.term_max} мес.
        </span>
        <span className="rounded-lg bg-canvas px-2 py-1">от {pct(product.base_rate)} годовых</span>
        {product.collateral_required && <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-800">нужен залог</span>}
        {product.requires_bank_account && (
          <span className="rounded-lg bg-sky-50 px-2 py-1 text-sky-800">для клиентов со счётом</span>
        )}
      </div>
    </button>
  )
}
