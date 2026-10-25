import { useQuery } from '@tanstack/react-query'
import { mockRequest } from '@/shared/lib'
import { buildFeed, type FeedProfile } from '../model/feed'

/** МАКЕТ: когда появится GET /api/feed, здесь будет http.get<FeedItem[]>('/api/feed') */
export function useFeed(profile: FeedProfile | null) {
  return useQuery({
    queryKey: ['feed', profile],
    queryFn: () => mockRequest(buildFeed(profile!)),
    enabled: profile !== null,
  })
}
