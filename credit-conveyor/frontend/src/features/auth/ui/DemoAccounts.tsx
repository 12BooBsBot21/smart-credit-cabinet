import { Briefcase, Building2 } from 'lucide-react'
import { Button, Spinner } from '@/shared/ui'
import { useDemoAccounts, useLogin } from '../model/useLogin'

/** Быстрый вход под тестовыми учётками — чтобы жюри прошло сценарий без README */
export function DemoAccounts() {
  const accounts = useDemoAccounts()
  const login = useLogin()

  if (accounts.isPending) return <Spinner />
  if (!accounts.data?.length) return null

  return (
    <ul className="space-y-2">
      {accounts.data.map((account) => (
        <li key={account.login} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-ink-muted">
            {account.role === 'UNDERWRITER' ? <Briefcase size={17} /> : <Building2 size={17} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">
              {account.company_name ?? account.full_name}
              <span className="ml-2 font-normal text-ink-soft">{account.login}</span>
            </div>
            <div className="text-xs text-ink-muted">{account.hint}</div>
          </div>
          <Button
            variant="secondary"
            className="shrink-0 px-3 py-1.5 text-xs"
            loading={login.isPending && login.variables?.login === account.login}
            onClick={() => login.mutate({ login: account.login, password: account.password })}
          >
            Войти
          </Button>
        </li>
      ))}
    </ul>
  )
}
