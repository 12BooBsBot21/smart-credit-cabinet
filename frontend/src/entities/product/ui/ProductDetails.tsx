import { Check, Minus } from 'lucide-react'
import { RichText } from '@/shared/ui'
import { PRODUCT_CONTENT } from '../model/content'
import type { Product } from '../api/productApi'

/** «Простыми словами»: описание продукта с подсказками к терминам, плюсы и минусы */
export function ProductDetails({ product }: { product: Product }) {
  const content = PRODUCT_CONTENT[product.code]
  if (!content) return null
  return (
    <div className="grid gap-4 rounded-xl bg-canvas p-4 md:grid-cols-[minmax(0,1fr)_240px]">
      <div>
        <div className="label mb-1.5">Простыми словами</div>
        <RichText text={content.description} className="text-sm leading-relaxed text-ink" />
      </div>
      <ul className="space-y-1.5 text-sm">
        {content.pros.map((x) => (
          <li key={x} className="flex gap-2 text-ink">
            <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={2.5} /> {x}
          </li>
        ))}
        {content.cons.map((x) => (
          <li key={x} className="flex gap-2 text-ink-muted">
            <Minus size={16} className="mt-0.5 shrink-0 text-ink-soft" /> {x}
          </li>
        ))}
      </ul>
    </div>
  )
}
