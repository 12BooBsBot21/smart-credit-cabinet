/** Базовый адрес API. Пусто — тот же origin: в разработке /api проксирует Vite, в Docker — nginx */
export const API_URL = import.meta.env.VITE_API_URL ?? ''

/** Как часто обновлять заявку, пока её обрабатывает банк */
export const POLL_INTERVAL_MS = 2000

export { GLOSSARY, glossaryById, type GlossaryEntry } from './glossary'
export { OWNER_LABEL, TASKS, taskById, type Owner, type TaskEntry, type TaskStatus } from './tasks'
