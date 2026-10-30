'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { notificationsOptions } from './notification-options'

export function NotificationList() {
  const { data } = useSuspenseQuery(notificationsOptions)

  return (
    <ul>
      {data.map((notification) => (
        <li key={notification.id}>{notification.text}</li>
      ))}
    </ul>
  )
}
