import { Check } from 'lucide-react'
import { moneyShort, pct } from '@/shared/lib'
import type { Product } from '../api/productApi'

interface Props {
  product: Product
  selected?: boolean
  onSelect?: () => void
}

export function ProductCard({ product, selected = false, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`card flex h-full w-full flex-col p-5 text-left transition hover:border-slate-300 ${
        selected ? 'border-accent ring-2 ring-accent-ring' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink">{product.name}</h3>
        {selected && (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-white">
            <Check size={14} strokeWidth={3} />
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{product.plain_name}</p>
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
