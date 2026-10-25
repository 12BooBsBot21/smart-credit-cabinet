import { RouterProvider } from 'react-router-dom'
import { setUnauthorizedHandler } from '@/shared/api'
import { useSession } from '@/entities/session'
import { QueryProvider } from './providers/QueryProvider'
import { router } from './router'

// Токен истёк или недействителен → сбрасываем сессию и ведём на вход
setUnauthorizedHandler(() => {
  if (!useSession.getState().user) return
  useSession.getState().signOut()
  router.navigate('/login', { replace: true })
})

export function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </QueryProvider>
  )
}
