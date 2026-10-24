/** Базовый адрес API. Пусто — тот же origin: в разработке /api проксирует Vite, в Docker — nginx */
export const API_URL = import.meta.env.VITE_API_URL ?? ''

/** Как часто обновлять заявку, пока её обрабатывает банк */
export const POLL_INTERVAL_MS = 2000
