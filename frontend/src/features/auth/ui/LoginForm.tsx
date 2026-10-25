import { useState, type FormEvent } from 'react'
import { Alert, Button, Field, Input } from '@/shared/ui'
import { useLogin } from '../model/useLogin'

export function LoginForm() {
  const login = useLogin()
  const [form, setForm] = useState({ login: '', password: '' })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    login.mutate(form)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Логин">
        <Input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} autoComplete="username" />
      </Field>
      <Field label="Пароль">
        <Input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete="current-password"
        />
      </Field>
      {login.error && <Alert tone="danger">{login.error.message}</Alert>}
      <Button type="submit" loading={login.isPending} className="w-full">
        Войти
      </Button>
    </form>
  )
}
