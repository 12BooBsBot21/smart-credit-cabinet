import { useState, type FormEvent, type ReactNode } from 'react'
import { Send } from 'lucide-react'
import { Alert, Button, Field, Input, Textarea } from '@/shared/ui'
import { moneyShort } from '@/shared/lib'
import type { Product } from '@/entities/product'
import type { Company } from '@/entities/company'
import { useCreateApplication } from '../model/useCreateApplication'

interface Props {
  product: Product
  company: Company
  /** Слот перед кнопкой отправки — страница кладёт сюда, например, чек-лист документов */
  beforeSubmit?: ReactNode
}

/** Числовые поля держим строками, чтобы пользователь мог стереть значение целиком */
const toNumber = (value: string) => (value.trim() ? Number(value.replace(/\s/g, '')) : undefined)

export function CreateApplicationForm({ product, company, beforeSubmit }: Props) {
  const create = useCreateApplication()
  const [form, setForm] = useState({
    amount: String(Math.min(Math.max(1_000_000, product.amount_min), product.amount_max)),
    termMonths: String(Math.max(12, product.term_min)),
    purpose: '',
    revenue: '',
    collateralDescription: '',
    collateralValue: '',
  })
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate({
      product_code: product.code,
      amount: toNumber(form.amount) ?? 0,
      term_months: toNumber(form.termMonths) ?? 0,
      purpose: form.purpose,
      declared_revenue_12m: toNumber(form.revenue),
      collateral_description: form.collateralDescription || undefined,
      collateral_value: toNumber(form.collateralValue),
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Сумма, ₽" hint={`от ${moneyShort(product.amount_min)} до ${moneyShort(product.amount_max)}`}>
          <Input
            inputMode="numeric"
            value={form.amount}
            onChange={(e) => set('amount')(e.target.value)}
            required
          />
        </Field>
        <Field label="Срок, месяцев" hint={`от ${product.term_min} до ${product.term_max}`}>
          <Input
            type="number"
            min={product.term_min}
            max={product.term_max}
            value={form.termMonths}
            onChange={(e) => set('termMonths')(e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="На что нужны деньги" hint="Своими словами: например, «закупка товара к сезону»">
        <Textarea value={form.purpose} onChange={(e) => set('purpose')(e.target.value)} required minLength={3} />
      </Field>

      <Field
        label="Выручка за последние 12 месяцев, ₽"
        hint={
          company.is_bank_client
            ? 'Необязательно: банк видит обороты по вашему счёту'
            : 'У банка нет выписки по вашему счёту — без выручки он запросит уточнение'
        }
      >
        <Input inputMode="numeric" value={form.revenue} onChange={(e) => set('revenue')(e.target.value)} />
      </Field>

      {product.collateral_required && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Что в залоге" hint="Например, «Склад 1 200 м², г. Подольск»">
            <Input
              value={form.collateralDescription}
              onChange={(e) => set('collateralDescription')(e.target.value)}
            />
          </Field>
          <Field label="Примерная стоимость залога, ₽">
            <Input
              inputMode="numeric"
              value={form.collateralValue}
              onChange={(e) => set('collateralValue')(e.target.value)}
            />
          </Field>
        </div>
      )}

      {beforeSubmit}
      {create.error && <Alert tone="danger">{create.error.message}</Alert>}
      <Button type="submit" loading={create.isPending} className="w-full py-3 sm:w-auto">
        <Send size={16} /> Отправить заявку
      </Button>
      <p className="text-xs text-ink-muted">
        Нажимая «Отправить», вы соглашаетесь на запрос кредитной истории. Данные синтетические, операции не проводятся.
      </p>
    </form>
  )
}
