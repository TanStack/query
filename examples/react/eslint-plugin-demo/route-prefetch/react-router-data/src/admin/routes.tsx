import { useParams } from 'react-router-dom'
import { useSuspenseQuery } from '@tanstack/react-query'
import { userOptions } from '../queries'
import type { RouteObject } from 'react-router-dom'

// The routes of the admin app, passed to `createBrowserRouter` in ./main.tsx. Problems with them are
// reported there, at the routes argument.
export const adminRoutes: Array<RouteObject> = [
  {
    // ❌ fails: this route has no loader, so the user only starts fetching once `AdminUser` renders.
    path: '/admin/users/:userId',
    Component: AdminUser,
  },
]

function AdminUser() {
  const { userId } = useParams()
  const { data: user } = useSuspenseQuery(userOptions(userId))

  return <h1>Admin: {user.name}</h1>
}
