import { useQuery } from '@tanstack/react-query'
import { http, type Schemas } from '@/shared/api'

export type Company = Schemas['CompanyOut']

/** Компания текущего клиента — эти данные банк уже знает */
export function useMyCompany() {
  return useQuery({
    queryKey: ['company', 'me'],
    queryFn: () => http.get<Company>('/api/companies/me'),
  })
}
