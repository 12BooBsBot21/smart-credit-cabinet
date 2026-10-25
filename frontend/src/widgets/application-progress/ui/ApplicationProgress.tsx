import { Check, Loader2, X } from 'lucide-react'
import { CLIENT_STAGES, isAwaitingBank, stageOf, type ApplicationStatus } from '@/entities/application'

type StageState = 'done' | 'active' | 'waiting' | 'failed' | 'todo'

function stateOf(index: number, status: ApplicationStatus): StageState {
  const current = stageOf(status)
  if (index < current || status === 'ISSUED') return 'done'
  if (index > current) return 'todo'
  if (status === 'REJECTED' || status === 'WITHDRAWN' || status === 'OFFER_DECLINED') return 'failed'
  if (isAwaitingBank(status)) return 'active'
  return 'waiting' // ход за клиентом: уточнить данные, принять условия, подписать
}

const DOT: Record<StageState, string> = {
  done: 'bg-ink text-white',
  active: 'bg-accent text-white ring-4 ring-accent-soft',
  waiting: 'bg-amber-500 text-white ring-4 ring-amber-100',
  failed: 'bg-red-600 text-white',
  todo: 'bg-slate-100 text-ink-soft',
}

/** Путь заявки глазами клиента: внутренние статусы банка свёрнуты в понятные этапы */
export function ApplicationProgress({ status }: { status: ApplicationStatus }) {
  const current = Math.max(stageOf(status), 0)
  return (
    <div>
      <ol className="flex justify-between gap-1 sm:gap-2">
        {CLIENT_STAGES.map((title, index) => {
          const state = stateOf(index, status)
          return (
            <li key={title} className="flex flex-col items-center gap-2 text-center sm:flex-1">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${DOT[state]}`}>
                {state === 'done' && <Check size={16} strokeWidth={3} />}
                {state === 'active' && <Loader2 size={16} className="animate-spin" />}
                {state === 'failed' && <X size={16} strokeWidth={3} />}
                {(state === 'waiting' || state === 'todo') && index + 1}
              </span>
              {/* На узком экране подписи не помещаются — показываем только текущий этап ниже */}
              <span className={`hidden text-xs sm:block ${state === 'todo' ? 'text-ink-soft' : 'font-medium text-ink'}`}>
                {title}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-center text-sm font-medium text-ink sm:hidden">
        Этап {current + 1} из {CLIENT_STAGES.length}: {CLIENT_STAGES[current]}
      </p>
    </div>
  )
}
