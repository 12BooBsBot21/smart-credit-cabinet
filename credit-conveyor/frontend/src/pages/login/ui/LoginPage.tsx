import { Card } from '@/shared/ui'
import { DemoAccounts, LoginForm } from '@/features/auth'

export function LoginPage() {
  return (
    <div className="mx-auto grid min-h-screen max-w-5xl content-center gap-6 px-4 py-10 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-lg font-bold text-white">К</span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Кредитный конвейер</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Кабинет предпринимателя и рабочее место банка в одном продукте. Прототип для хакатона.
          </p>
        </div>
        <Card>
          <LoginForm />
        </Card>
      </div>
      <div>
        <h2 className="mb-1 text-base font-semibold text-ink">Тестовые учётки</h2>
        <p className="mb-3 text-sm text-ink-muted">Пароль у всех — demo. В подписи — что показывает каждый клиент.</p>
        <DemoAccounts />
      </div>
    </div>
  )
}
