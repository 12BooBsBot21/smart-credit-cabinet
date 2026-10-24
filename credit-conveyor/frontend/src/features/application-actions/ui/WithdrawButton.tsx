import { Button } from '@/shared/ui'
import { clientApplicationApi, useClientApplicationAction } from '@/entities/application'

/** Отозвать заявку — доступно, пока банк не принял решение */
export function WithdrawButton({ applicationId }: { applicationId: number }) {
  const withdraw = useClientApplicationAction(applicationId, () => clientApplicationApi.withdraw(applicationId))
  return (
    <Button
      variant="ghost"
      loading={withdraw.isPending}
      onClick={() => {
        if (window.confirm('Отозвать заявку? Её нельзя будет вернуть в работу.')) withdraw.mutate()
      }}
    >
      Отозвать заявку
    </Button>
  )
}
