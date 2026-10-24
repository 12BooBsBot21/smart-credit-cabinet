import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { http, type Schemas } from '@/shared/api'
import { homePathFor, useSession } from '@/entities/session'

type LoginInput = Schemas['LoginIn']
type DemoAccount = Schemas['DemoAccountOut']

export function useLogin() {
  const signIn = useSession((s) => s.signIn)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: LoginInput) => http.post<Schemas['TokenOut']>('/api/auth/login', data),
    onSuccess: ({ access_token, user }) => {
      signIn(access_token, user)
      navigate(homePathFor(user.role), { replace: true })
    },
  })
}

/** Тестовые учётки — бэкенд отдаёт их только в демо-режиме */
export function useDemoAccounts() {
  return useQuery({
    queryKey: ['auth', 'demo-accounts'],
    queryFn: () => http.get<DemoAccount[]>('/api/auth/demo-accounts'),
    staleTime: Infinity,
  })
}
