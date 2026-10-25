import { Section } from '@/shared/ui'
import { moneyShort } from '@/shared/lib'
import type { BankApplicationDetail } from '@/entities/application'

/** Поступления на расчётный счёт по месяцам — внутренние данные банка */
export function TurnoverChart({ turnovers }: { turnovers: BankApplicationDetail['turnovers'] }) {
  if (turnovers.length === 0) {
    return (
      <Section title="Обороты по счёту">
        <p className="text-sm text-ink-muted">У клиента нет счёта в банке — выручка известна только со слов клиента.</p>
      </Section>
    )
  }
  const max = Math.max(...turnovers.map((t) => t.inflow))
  return (
    <Section title="Обороты по счёту">
      <div className="flex h-36 items-end gap-1.5">
        {turnovers.map((t) => (
          <div key={t.month} className="flex h-full flex-1 flex-col items-center gap-1" title={`${t.month}: ${moneyShort(t.inflow)}`}>
            <div className="flex w-full flex-1 items-end">
              <div className="w-full rounded-t bg-sky-400/80" style={{ height: `${(t.inflow / max) * 100}%` }} />
            </div>
            <span className="text-[10px] text-ink-soft">{t.month.slice(5)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-muted">Поступления за 12 месяцев, максимум — {moneyShort(max)} в месяц</p>
    </Section>
  )
}
