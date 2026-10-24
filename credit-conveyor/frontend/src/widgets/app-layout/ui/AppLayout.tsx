import { Link, NavLink, Outlet } from 'react-router-dom'
import { LogoutButton } from '@/features/auth'
import { homePathFor, useSession } from '@/entities/session'

const NAV: Record<string, { to: string; label: string }[]> = {
  CLIENT: [
    { to: '/client', label: 'Мои заявки' },
    { to: '/client/applications/new', label: 'Новая заявка' },
  ],
  UNDERWRITER: [{ to: '/bank', label: 'Очередь заявок' }],
}

export function AppLayout() {
  const user = useSession((s) => s.user)
  if (!user) return null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to={homePathFor(user.role)} className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-sm font-bold text-white">К</span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-[15px] font-bold text-ink">Кредитный конвейер</span>
                <span className="block text-[11px] text-ink-soft">
                  {user.role === 'UNDERWRITER' ? 'рабочее место банка' : 'кабинет предпринимателя'} · прототип
                </span>
              </span>
            </Link>
            <nav className="flex gap-1">
              {NAV[user.role].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-right leading-tight md:block">
              <span className="block text-sm font-semibold text-ink">{user.full_name}</span>
              <span className="block text-xs text-ink-muted">{user.company_name ?? 'Андеррайтер'}</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-ink-soft sm:px-6">
        Прототип для хакатона. Все данные синтетические, внешние сервисы — моки, реальных операций нет.
      </footer>
    </div>
  )
}
