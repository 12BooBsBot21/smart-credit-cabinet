import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './http'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      // 4xx повторять бессмысленно — это ошибка запроса, а не сети
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
})
