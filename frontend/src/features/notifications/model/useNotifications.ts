import { useState } from 'react'
import { STATUS_LABEL, useClientApplications } from '@/entities/application'
import { useSession } from '@/entities/session'

export interface Notification {
  applicationId: number
  text: string
  at: string
  unread: boolean
}

const storageKey = (userId: number) => `credit-conveyor.notifications-seen.${userId}`

function readSeen(userId: number): string {
  try {
    return localStorage.getItem(storageKey(userId)) ?? ''
  } catch {
    return ''
  }
}

/**
 * МАКЕТ уведомлений: статусы заявок настоящие, а «прочитано» хранится в браузере.
 * Бэкенд-задача: GET /api/notifications из журнала событий и отметка прочтения на сервере.
 */
export function useNotifications() {
  const userId = useSession((s) => s.user?.id ?? 0)
  const applications = useClientApplications()
  const [seenAt, setSeenAt] = useState(() => readSeen(userId))

  const items: Notification[] = (applications.data ?? []).map((a) => ({
    applicationId: a.id,
    text: `${a.number}: ${STATUS_LABEL[a.status]}`,
    at: a.updated_at,
    unread: a.updated_at > seenAt,
  }))

  const markAllRead = () => {
    const now = new Date().toISOString()
    setSeenAt(now)
    try {
      localStorage.setItem(storageKey(userId), now)
    } catch {
      /* без localStorage отметка живёт до перезагрузки */
    }
  }

  return { items, unreadCount: items.filter((i) => i.unread).length, markAllRead }
}
