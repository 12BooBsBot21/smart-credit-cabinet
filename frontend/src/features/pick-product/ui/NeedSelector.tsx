import { Building2, Package, Truck, Wallet, type LucideIcon } from 'lucide-react'
import { Segmented } from '@/shared/ui'
import { GOALS, type Goal, type NeedAnswers } from '../model/recommend'

const GOAL_ICON: Record<Goal, LucideIcon> = { stock: Package, gap: Wallet, equipment: Truck, expansion: Building2 }

const yesNo = (value: boolean | null) => (value === null ? null : value ? 'yes' : 'no')

/** «Что нужно бизнесу?» — задача и два уточнения. Из прототипа (NeedSelector) */
export function NeedSelector({ value, onChange }: { value: NeedAnswers; onChange: (value: NeedAnswers) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {GOALS.map(({ value: goal, label }) => {
          const Icon = GOAL_ICON[goal]
          const active = value.goal === goal
          return (
            <button
              key={goal}
              type="button"
              onClick={() => onChange({ ...value, goal })}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                active ? 'border-accent bg-accent-soft text-accent-dark' : 'border-line bg-white text-ink hover:border-slate-300'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          )
        })}
      </div>
      {value.goal && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-sm font-medium text-ink">Такая потребность повторяется?</div>
            <Segmented
              value={yesNo(value.regular)}
              options={[
                { value: 'yes', label: 'Да, регулярно' },
                { value: 'no', label: 'Нет, разово' },
              ]}
              onChange={(v) => onChange({ ...value, regular: v === 'yes' })}
            />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-medium text-ink">Есть что оставить в залог?</div>
            <Segmented
              value={yesNo(value.hasPledge)}
              options={[
                { value: 'yes', label: 'Есть' },
                { value: 'no', label: 'Нет' },
              ]}
              onChange={(v) => onChange({ ...value, hasPledge: v === 'yes' })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
