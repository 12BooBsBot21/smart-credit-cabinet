import { useQuery } from '@tanstack/react-query'
import { http, type Schemas } from '@/shared/api'

export type Product = Schemas['ProductOut']

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => http.get<Product[]>('/api/products'),
    staleTime: Infinity, // каталог не меняется во время сессии
  })
}
