import { Badge } from '@/shared/ui'
import { STATUS_LABEL, STATUS_TONE } from '../model/status'
import type { ApplicationStatus } from '../model/types'

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
}
