import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { MockFrame } from '@/shared/ui'
import { formatDateTime } from '@/shared/lib'
import { useNotifications } from '../model/useNotifications'

/** Уведомления внутри продукта — вместо email и SMS (ограничение 5 кейса) */
export function NotificationBell() {
  const { items, unreadCount, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Уведомления"
        onClick={() => {
          setOpen(!open)
          if (!open) markAllRead()
        }}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-slate-100 hover:text-ink"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-4 shadow-lg">
          <MockFrame taskId="notifications">
            <div className="mb-2 pt-2 text-sm font-semibold text-ink">Уведомления</div>
            {items.length === 0 ? (
              <p className="text-sm text-ink-muted">Пока ничего нового.</p>
            ) : (
              <ul className="space-y-2">
                {items.slice(0, 6).map((item) => (
                  <li key={item.applicationId}>
                    <Link
                      to={`/client/applications/${item.applicationId}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-2 py-1.5 hover:bg-canvas"
                    >
                      <div className={`text-sm ${item.unread ? 'font-semibold text-ink' : 'text-ink'}`}>{item.text}</div>
                      <div className="text-xs text-ink-muted">{formatDateTime(item.at)}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </MockFrame>
        </div>
      )}
    </div>
  )
}
