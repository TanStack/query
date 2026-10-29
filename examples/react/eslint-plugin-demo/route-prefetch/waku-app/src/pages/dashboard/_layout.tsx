// ❌ fails: this layout renders <NotificationBell />, whose query no layout prefetches.
import { NotificationBell } from '../../components/notification-bell'
import type { LayoutProps } from 'waku/router'

export default async function DashboardLayout({
  children,
}: LayoutProps<'/dashboard'>) {
  return (
    <>
      <nav>
        {/* eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'notificationsOptions' used by 'useQuery' in '../../components/notification-bell.tsx' isn't prefetched in this layout, so it only starts fetching after the component renders. Start it in this layout by passing the same query options to 'queryClient.query()'. */}
        <NotificationBell />
      </nav>
      {children}
    </>
  )
}
