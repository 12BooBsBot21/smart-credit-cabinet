import { Alert, Button } from '@/shared/ui'
import {
  clientApplicationApi,
  OfferTerms,
  useClientApplicationAction,
  type Offer,
} from '@/entities/application'

/** Выбор одного из предложений банка или отказ от всех */
export function OfferChoice({ applicationId, offers }: { applicationId: number; offers: Offer[] }) {
  const accept = useClientApplicationAction(applicationId, (offerId: number) =>
    clientApplicationApi.acceptOffer(applicationId, offerId),
  )
  const decline = useClientApplicationAction(applicationId, () => clientApplicationApi.declineOffer(applicationId))
  const proposed = offers.filter((o) => o.status === 'PROPOSED')

  return (
    <div className="space-y-3">
      {proposed.map((offer, index) => (
        <div key={offer.id} className="rounded-xl border border-line p-4">
          {proposed.length > 1 && <div className="label mb-2">Вариант {index + 1}</div>}
          <OfferTerms offer={offer} />
          <Button
            className="mt-4"
            loading={accept.isPending && accept.variables === offer.id}
            disabled={accept.isPending}
            onClick={() => accept.mutate(offer.id)}
          >
            Принять {proposed.length > 1 ? 'этот вариант' : 'условия'}
          </Button>
        </div>
      ))}
      {(accept.error || decline.error) && <Alert tone="danger">{(accept.error ?? decline.error)?.message}</Alert>}
      <Button
        variant="ghost"
        loading={decline.isPending}
        onClick={() => {
          if (window.confirm('Отказаться от предложения банка?')) decline.mutate()
        }}
      >
        Отказаться
      </Button>
    </div>
  )
}
