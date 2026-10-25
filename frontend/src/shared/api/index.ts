import type { components } from './schema'

export { http, ApiError, setUnauthorizedHandler } from './http'
export { tokenStorage } from './token'
export { queryClient } from './queryClient'

/**
 * Типы всех схем API. Файл schema.d.ts генерируется из OpenAPI бэкенда:
 *   npm run api:types
 * Руками его не правим — после изменения API просто перегенерируем.
 */
export type Schemas = components['schemas']
