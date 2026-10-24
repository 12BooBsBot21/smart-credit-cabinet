import { useState, type FormEvent } from 'react'
import { FileSignature } from 'lucide-react'
import { Alert, Button, Field, Input } from '@/shared/ui'
import { clientApplicationApi, useClientApplicationAction } from '@/entities/application'

/**
 * Подписание договора — мок простой электронной подписи.
 * Код показываем прямо в кабинете: по условиям кейса SMS и email в сценарии не используются.
 */
export function SignContractForm({ applicationId, signCode }: { applicationId: number; signCode: string | null }) {
  const sign = useClientApplicationAction(applicationId, (code: string) => clientApplicationApi.sign(applicationId, code))
  const [code, setCode] = useState('')

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    sign.mutate(code)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Alert tone="info" title="Договор готов к подписанию">
        Введите код подтверждения. В реальном банке он пришёл бы в мобильное приложение банка; в прототипе показываем его здесь:{' '}
        <span className="font-mono text-base font-bold">{signCode}</span>
      </Alert>
      <Field label="Код подтверждения">
        <Input
          inputMode="numeric"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="max-w-[160px] font-mono"
          required
        />
      </Field>
      {sign.error && <Alert tone="danger">{sign.error.message}</Alert>}
      <Button type="submit" loading={sign.isPending}>
        <FileSignature size={16} /> Подписать договор
      </Button>
    </form>
  )
}
