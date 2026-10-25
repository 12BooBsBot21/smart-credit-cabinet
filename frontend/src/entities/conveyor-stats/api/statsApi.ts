import { useQuery } from '@tanstack/react-query'
import { mockRequest } from '@/shared/lib'
import { STATS_FIXTURE } from '../model/stats'

/** МАКЕТ: после реализации — http.get<ConveyorStats>('/api/bank/stats?days=30') */
export function useConveyorStats() {
  return useQuery({
    queryKey: ['bank', 'stats'],
    queryFn: () => mockRequest(STATS_FIXTURE),
  })
}
