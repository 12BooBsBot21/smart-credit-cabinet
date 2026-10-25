import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Field, Input, Textarea } from '@/shared/ui'
import {
  applicationKeys,
  bankApplicationApi,
  type BankApplicationDetail,
  type UnderwriterDecision,
} from '@/entities/application'

type Outcome = UnderwriterDecision['outcome']

const OUTCOMES: { value: Outcome; label: string; hint: string }[] = [
  { value: 'APPROVED', label: 'Одобрить', hint: 'На запрошенных клиентом условиях' },
  { value: 'COUNTER_OFFER', label: 'Иные условия', hint: 'Другая сумма или срок' },
  { value: 'NEEDS_INFO', label: 'Запросить информацию', hint: 'Заявка вернётся клиенту' },
  { value: 'REJECTED', label: 'Отказать', hint: 'Клиент увидит общую причину' },
]

/** Решение андеррайтера по заявке на ручной проверке */
export function UnderwriterDecisionForm({ application }: { application: BankApplicationDetail }) {
  const queryClient = useQueryClient()
  const decide = useMutation({
    mutationFn: (data: UnderwriterDecision) => bankApplicationApi.decide(application.id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(applicationKeys.bank(application.id), updated)
      queryClient.invalidateQueries({ queryKey: ['applications', 'bank', 'list'] })
    },
  })

  // Если система посчитала иные условия — подставим их как отправную точку
  const recommended = application.decisions.at(-1)?.recommendation?.offers[0]
  const [outcome, setOutcome] = useState<Outcome>('APPROVED')
  const [form, setForm] = useState({
    comment: '',
    amount: String(recommended?.amount ?? application.amount),
    termMonths: String(recommended?.term_months ?? application.term_months),
    infoText: '',
  })
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    decide.mutate({
      outcome,
      comment: form.comment,
      amount: outcome === 'COUNTER_OFFER' ? Number(form.amount) : undefined,
      term_months: outcome === 'COUNTER_OFFER' ? Number(form.termMonths) : undefined,
      info_text: outcome === 'NEEDS_INFO' ? form.infoText : undefined,
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {OUTCOMES.map((o) => (
          <label
            key={o.value}
            className={`cursor-pointer rounded-xl border p-3 transition ${
              outcome === o.value ? 'border-accent bg-accent-soft/40' : 'border-line hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="outcome"
              className="sr-only"
              checked={outcome === o.value}
              onChange={() => setOutcome(o.value)}
            />
            <div className="text-sm font-semibold text-ink">{o.label}</div>
            <div className="text-xs text-ink-muted">{o.hint}</div>
          </label>
        ))}
      </div>

      {outcome === 'COUNTER_OFFER' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Сумма, ₽">
            <Input inputMode="numeric" value={form.amount} onChange={(e) => set('amount')(e.target.value)} required />
          </Field>
          <Field label="Срок, месяцев">
            <Input type="number" value={form.termMonths} onChange={(e) => set('termMonths')(e.target.value)} required />
          </Field>
        </div>
      )}

      {outcome === 'NEEDS_INFO' && (
        <Field label="Что запросить у клиента" hint="Клиент увидит этот текст">
          <Textarea value={form.infoText} onChange={(e) => set('infoText')(e.target.value)} required />
        </Field>
      )}

      <Field label="Обоснование решения" hint="Попадает в журнал заявки, клиент его не видит">
        <Textarea value={form.comment} onChange={(e) => set('comment')(e.target.value)} required minLength={3} />
      </Field>

      {decide.error && <Alert tone="danger">{decide.error.message}</Alert>}
      <Button type="submit" loading={decide.isPending}>
        Принять решение
      </Button>
    </form>
  )
}
