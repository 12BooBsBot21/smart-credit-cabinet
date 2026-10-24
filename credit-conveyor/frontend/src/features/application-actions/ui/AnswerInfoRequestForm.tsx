import { useState, type FormEvent } from 'react'
import { Alert, Button, Field, Input, Textarea } from '@/shared/ui'
import {
  clientApplicationApi,
  useClientApplicationAction,
  type InfoRequest,
  type InfoResponse,
} from '@/entities/application'

const toNumber = (value: string) => (value.trim() ? Number(value.replace(/\s/g, '')) : undefined)

/**
 * Ответ на запрос банка. Набор полей зависит от кодов в запросе:
 * REVENUE / REVENUE_CONFIRM — выручка, COLLATERAL — залог, всегда — комментарий.
 */
export function AnswerInfoRequestForm({ applicationId, request }: { applicationId: number; request: InfoRequest }) {
  const answer = useClientApplicationAction(applicationId, (data: InfoResponse) =>
    clientApplicationApi.answerInfoRequest(applicationId, data),
  )
  const codes = new Set(request.items.map((item) => item.code))
  const [form, setForm] = useState({ comment: '', revenue: '', collateralDescription: '', collateralValue: '' })
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    answer.mutate({
      comment: form.comment,
      declared_revenue_12m: toNumber(form.revenue),
      collateral_description: form.collateralDescription || undefined,
      collateral_value: toNumber(form.collateralValue),
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Alert tone="warning" title="Банку нужны уточнения">
        <ul className="list-disc space-y-1 pl-4">
          {request.items.map((item) => (
            <li key={item.code}>{item.text}</li>
          ))}
        </ul>
      </Alert>

      {(codes.has('REVENUE') || codes.has('REVENUE_CONFIRM')) && (
        <Field
          label="Выручка за последние 12 месяцев, ₽"
          hint={codes.has('REVENUE_CONFIRM') ? 'Оставьте пустым, если сумма в заявке верна, и поясните расхождение в комментарии' : undefined}
        >
          <Input
            inputMode="numeric"
            value={form.revenue}
            onChange={(e) => set('revenue')(e.target.value)}
            required={codes.has('REVENUE')}
          />
        </Field>
      )}

      {codes.has('COLLATERAL') && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Что в залоге">
            <Input value={form.collateralDescription} onChange={(e) => set('collateralDescription')(e.target.value)} required />
          </Field>
          <Field label="Примерная стоимость залога, ₽">
            <Input inputMode="numeric" value={form.collateralValue} onChange={(e) => set('collateralValue')(e.target.value)} required />
          </Field>
        </div>
      )}

      <Field label="Комментарий для банка">
        <Textarea value={form.comment} onChange={(e) => set('comment')(e.target.value)} required />
      </Field>

      {answer.error && <Alert tone="danger">{answer.error.message}</Alert>}
      <Button type="submit" loading={answer.isPending}>
        Отправить ответ
      </Button>
    </form>
  )
}
