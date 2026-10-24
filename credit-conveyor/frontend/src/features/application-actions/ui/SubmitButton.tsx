import { Send } from 'lucide-react'
import { Alert, Button } from '@/shared/ui'
import { clientApplicationApi, useClientApplicationAction } from '@/entities/application'

/** Отправить черновик в банк */
export function SubmitButton({ applicationId }: { applicationId: number }) {
  const submit = useClientApplicationAction(applicationId, () => clientApplicationApi.submit(applicationId))
  return (
    <div className="space-y-3">
      <Button loading={submit.isPending} onClick={() => submit.mutate()}>
        <Send size={16} /> Отправить в банк
      </Button>
      {submit.error && <Alert tone="danger">{submit.error.message}</Alert>}
    </div>
  )
}
