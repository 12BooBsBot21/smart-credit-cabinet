import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MarkupState {
  /** Показывать на экранах метки «чья задача и в каком статусе» */
  enabled: boolean
  toggle: () => void
}

/** Режим разметки задач. По умолчанию включён: макет сделан, чтобы команда распределила работу */
export const useMockupMarkup = create<MarkupState>()(
  persist(
    (set) => ({
      enabled: true,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
    }),
    { name: 'credit-conveyor.mockup-markup' },
  ),
)
