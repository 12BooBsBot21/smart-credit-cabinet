import { Navigate, Outlet } from 'react-router-dom'
import { homePathFor, useSession, type Role } from '@/entities/session'

/** Пускает на вложенные маршруты только пользователя с нужной ролью. Права всё равно проверяет бэкенд */
export function RequireRole({ role }: { role: Role }) {
  const user = useSession((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={homePathFor(user.role)} replace />
  return <Outlet />
}

/** «/» ведёт на стартовую страницу роли или на вход */
export function HomeRedirect() {
  const user = useSession((s) => s.user)
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />
}
