import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { glossaryById } from '@/shared/config'

/** Термин с пунктирным подчёркиванием: по наведению или тапу — объяснение из глоссария. Из прототипа */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const entry = glossaryById[id]
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null)

  const open = () => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const half = 140
    const x = Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8)
    const below = r.top < 150
    setPos({ x, y: below ? r.bottom + 8 : r.top - 8, below })
  }
  const close = () => setPos(null)

  useEffect(() => {
    if (!pos) return
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [pos])

  if (!entry) return <>{children}</>

  return (
    <>
      <span
        ref={ref}
        role="button"
        tabIndex={0}
        className="cursor-help underline decoration-ink-soft decoration-dotted decoration-[1.5px] underline-offset-4 hover:decoration-accent"
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        onClick={(e) => {
          e.stopPropagation()
          if (pos) close()
          else open()
        }}
      >
        {children}
      </span>
      {pos &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[100] w-[280px] rounded-xl bg-ink px-4 py-3 text-left text-[13px] font-normal leading-relaxed text-white shadow-lg"
            style={{ left: pos.x, top: pos.y, transform: `translate(-50%, ${pos.below ? '0' : '-100%'})` }}
          >
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">{entry.term}</span>
            {entry.text}
          </div>,
          document.body,
        )}
    </>
  )
}

/** Текст с разметкой терминов {{glossaryId|текст}} и **жирным** */
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const parts: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\{\{(\w+)\|([^}]+)\}\}/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[1]) parts.push(<strong key={match.index} className="font-semibold">{match[1]}</strong>)
    else parts.push(<Term key={match.index} id={match[2]}>{match[3]}</Term>)
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <p className={className}>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</p>
}
