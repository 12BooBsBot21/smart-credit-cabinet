import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/shared/api'
import { POLL_INTERVAL_MS } from '@/shared/config'
import { isAwaitingBank } from '../model/status'
import type {
  ApplicationCreate,
  ApplicationDetail,
  ApplicationStatus,
  ApplicationSummary,
  BankApplicationDetail,
  InfoResponse,
  UnderwriterDecision,
} from '../model/types'

export const applicationKeys = {
  clientList: ['applications', 'client'] as const,
  client: (id: number) => ['applications', 'client', id] as const,
  bankList: (status: ApplicationStatus | null) => ['applications', 'bank', 'list', status] as const,
  bank: (id: number) => ['applications', 'bank', id] as const,
}

// --- Запросы клиента ---

export const clientApplicationApi = {
  list: () => http.get<ApplicationSummary[]>('/api/applications'),
  get: (id: number) => http.get<ApplicationDetail>(`/api/applications/${id}`),
  create: (data: ApplicationCreate) => http.post<ApplicationDetail>('/api/applications', data),
  submit: (id: number) => http.post<ApplicationDetail>(`/api/applications/${id}/submit`),
  withdraw: (id: number) => http.post<ApplicationDetail>(`/api/applications/${id}/withdraw`),
  answerInfoRequest: (id: number, data: InfoResponse) =>
    http.post<ApplicationDetail>(`/api/applications/${id}/info-response`, data),
  acceptOffer: (id: number, offerId: number) =>
    http.post<ApplicationDetail>(`/api/applications/${id}/offers/${offerId}/accept`),
  declineOffer: (id: number) => http.post<ApplicationDetail>(`/api/applications/${id}/decline-offer`),
  sign: (id: number, code: string) => http.post<ApplicationDetail>(`/api/applications/${id}/sign`, { code }),
}

export function useClientApplications() {
  return useQuery({
    queryKey: applicationKeys.clientList,
    queryFn: clientApplicationApi.list,
    refetchInterval: (query) =>
      query.state.data?.some((a) => isAwaitingBank(a.status)) ? POLL_INTERVAL_MS : false,
  })
}

export function useClientApplication(id: number) {
  return useQuery({
    queryKey: applicationKeys.client(id),
    queryFn: () => clientApplicationApi.get(id),
    // Пока заявку обрабатывает банк, опрашиваем сервер — статус меняется на глазах
    refetchInterval: (query) => (query.state.data && isAwaitingBank(query.state.data.status) ? POLL_INTERVAL_MS : false),
  })
}

/**
 * Мутация над заявкой клиента: после ответа сервера кладём свежую заявку в кэш
 * и обновляем список. Используется во всех features клиента.
 */
export function useClientApplicationAction<TVariables = void>(
  id: number,
  action: (variables: TVariables) => Promise<ApplicationDetail>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: action,
    onSuccess: (application) => {
      queryClient.setQueryData(applicationKeys.client(id), application)
      queryClient.invalidateQueries({ queryKey: applicationKeys.clientList })
    },
  })
}

// --- Запросы андеррайтера ---

export const bankApplicationApi = {
  list: (status: ApplicationStatus | null) =>
    http.get<ApplicationSummary[]>(`/api/bank/applications${status ? `?status=${status}` : ''}`),
  get: (id: number) => http.get<BankApplicationDetail>(`/api/bank/applications/${id}`),
  decide: (id: number, data: UnderwriterDecision) =>
    http.post<BankApplicationDetail>(`/api/bank/applications/${id}/decision`, data),
}

export function useBankApplications(status: ApplicationStatus | null) {
  return useQuery({
    queryKey: applicationKeys.bankList(status),
    queryFn: () => bankApplicationApi.list(status),
    refetchInterval: 5_000, // новые заявки появляются в очереди без перезагрузки
  })
}

export function useBankApplication(id: number) {
  return useQuery({
    queryKey: applicationKeys.bank(id),
    queryFn: () => bankApplicationApi.get(id),
    refetchInterval: (query) => (query.state.data && isAwaitingBank(query.state.data.status) ? POLL_INTERVAL_MS : false),
  })
}
