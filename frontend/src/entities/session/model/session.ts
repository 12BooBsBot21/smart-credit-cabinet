import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient, tokenStorage, type Schemas } from '@/shared/api'

export type User = Schemas['UserOut']
export type Role = Schemas['Role']

interface SessionState {
  user: User | null
  signIn: (token: string, user: User) => void
  signOut: () => void
}

/** Текущий пользователь. Токен хранится отдельно (shared/api/token) — его читает http-клиент */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (token, user) => {
        tokenStorage.set(token)
        set({ user })
      },
      signOut: () => {
        tokenStorage.clear()
        queryClient.clear() // данные одного пользователя не должны достаться другому
        set({ user: null })
      },
    }),
    { name: 'credit-conveyor.session' },
  ),
)

/** Стартовая страница для роли */
export function homePathFor(role: Role) {
  return role === 'UNDERWRITER' ? '/bank' : '/client'
}
