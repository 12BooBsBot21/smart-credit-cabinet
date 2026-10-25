import { Badge, Section, type Tone } from '@/shared/ui'
import type { BankApplicationDetail } from '@/entities/application'

const GRADE_TONE: Record<string, Tone> = { A: 'success', B: 'success', C: 'warning', D: 'warning', E: 'danger' }

/** Разбор скоринга: какой признак сколько баллов добавил или снял */
export function ScoreBreakdown({ score }: { score: BankApplicationDetail['score'] }) {
  if (!score) {
    return (
      <Section title="Скоринг">
        <p className="text-sm text-ink-muted">Скоринг не проводился — заявка не дошла до этого шага.</p>
      </Section>
    )
  }
  return (
    <Section
      title="Скоринг"
      aside={
        <span className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-ink">{score.score} баллов</span>
          <Badge tone={GRADE_TONE[score.grade] ?? 'neutral'}>Грейд {score.grade}</Badge>
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs text-ink-muted">
            <tr>
              <th className="pb-2 font-medium">Признак</th>
              <th className="pb-2 font-medium">Значение</th>
              <th className="pb-2 text-right font-medium">Баллы</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {score.factors.map((factor) => (
              <tr key={factor.code}>
                <td className="py-2 pr-3">
                  <div className="text-ink">{factor.name}</div>
                  <div className="text-xs text-ink-muted">{factor.comment}</div>
                </td>
                <td className="py-2 pr-3 text-ink">{factor.value}</td>
                <td
                  className={`py-2 text-right font-semibold ${
                    factor.points > 0 ? 'text-emerald-700' : factor.points < 0 ? 'text-red-700' : 'text-ink-soft'
                  }`}
                >
                  {factor.points > 0 ? `+${factor.points}` : factor.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-soft">Модель {score.model_version} · база 600 баллов · A ≥ 700, B ≥ 650, C ≥ 600, D ≥ 550</p>
    </Section>
  )
}
