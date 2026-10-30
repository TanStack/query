import { useSuspenseQuery } from '@tanstack/react-query'
import { notificationsOptions } from '../queries'

export function Notifications() {
  const { data: notifications } = useSuspenseQuery(notificationsOptions())

  return (
    <ul>
      {notifications.map((notification) => (
        <li key={notification.id}>{notification.text}</li>
      ))}
    </ul>
  )
}
