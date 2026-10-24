import { API_URL } from '@/shared/config'
import { tokenStorage } from './token'

/** Ошибка API с понятным текстом из ответа бэкенда (поле detail) */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

let onUnauthorized: (() => void) | null = null

/** Что делать при 401 — задаёт слой app (сбросить сессию и отправить на вход) */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body.detail === 'string') return body.detail
    // Ошибка валидации FastAPI: [{ loc, msg }, …]
    if (Array.isArray(body.detail)) return body.detail.map((d: { msg: string }) => d.msg).join('; ')
  } catch {
    /* тело не JSON — вернём общий текст */
  }
  return `Ошибка ${response.status}`
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = tokenStorage.get()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (response.status === 401) onUnauthorized?.()
  if (!response.ok) throw new ApiError(response.status, await readError(response))
  return (await response.json()) as T
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
}
