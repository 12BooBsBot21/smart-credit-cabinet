import { BrainCircuit } from 'lucide-react'
import { Badge, Section } from '@/shared/ui'
import { pct } from '@/shared/lib'
import type { SecondOpinion } from '../model/insights'

/** Второе мнение ML-модели рядом с балльной картой. На решение не влияет */
export function SecondOpinionCard({ opinion, grade }: { opinion: SecondOpinion | null | undefined; grade: string | null }) {
  if (!opinion) {
    return (
      <Section title="Второе мнение ML-модели">
        <p className="text-sm text-ink-muted">Модель не запускалась: нет скоринга — не хватило данных из внешних источников.</p>
      </Section>
    )
  }
  const max = Math.max(...opinion.contributions.map((c) => Math.abs(c.impact)), 1)
  return (
    <Section
      title="Второе мнение ML-модели"
      aside={
        opinion.agrees ? (
          <Badge tone="success">согласна с грейдом {grade}</Badge>
        ) : (
          <Badge tone="warning">
            видит грейд {opinion.band}, а не {grade}
          </Badge>
        )
      }
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
          <BrainCircuit size={20} />
        </span>
        <div>
          <div className="text-2xl font-bold text-ink">{pct(Math.round(opinion.pd * 1000) / 10)}</div>
          <div className="text-xs text-ink-muted">вероятность дефолта за 12 месяцев</div>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {opinion.contributions.map((c) => (
          <li key={c.name} className="text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-ink">{c.name}</span>
              <span className={c.impact > 0 ? 'text-red-700' : 'text-emerald-700'}>{c.impact > 0 ? 'повышает риск' : 'снижает риск'}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${c.impact > 0 ? 'bg-red-400' : 'bg-emerald-400'}`}
                style={{ width: `${(Math.abs(c.impact) / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-soft">Модель-«претендент»: только подсвечивает расхождения, решение принимают правила и андеррайтер.</p>
    </Section>
  )
}
