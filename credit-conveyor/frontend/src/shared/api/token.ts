const KEY = 'credit-conveyor.token'

/** Токен доступа. localStorage может быть недоступен (приватный режим) — тогда живём без него */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(KEY, token)
    } catch {
      /* без сохранения токена придётся входить заново после перезагрузки */
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* нечего очищать */
    }
  },
}
