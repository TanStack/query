// ❌ fails: notificationsOptions lives in a 'use client' module, so on the server it's a client reference, not the options object
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { NotificationList } from './notification-list'
import { notificationsOptions } from './notification-options'

export default function NotificationsPage() {
  const queryClient = getQueryClient()
  // eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- 'notificationsOptions' is imported from './notification-options.ts', which has a 'use client' directive, so on the server it is a client reference and can't be called. Move the query options to a module without 'use client'.
  void queryClient.prefetchQuery(notificationsOptions)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationList />
    </HydrationBoundary>
  )
}
