/**
 * Заглушка запроса для макета: отдаёт данные с задержкой, как настоящий API.
 * Когда бэкенд готов, вызов mockRequest(...) меняется на http.get(...) — интерфейс трогать не нужно.
 */
export function mockRequest<T>(data: T, delayMs = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), delayMs))
}
