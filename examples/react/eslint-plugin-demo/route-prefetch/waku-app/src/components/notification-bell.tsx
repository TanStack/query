'use client'

import { useQuery } from '@tanstack/react-query'
import { notificationsOptions } from '../queries'

export function NotificationBell() {
  const { data: notifications = [] } = useQuery(notificationsOptions)
  return <span>{notifications.length} new</span>
}
