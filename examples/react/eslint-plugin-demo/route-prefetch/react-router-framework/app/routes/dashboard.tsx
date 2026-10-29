// ✅ passes: the component is split into `DashboardStats` in another file. The rule follows the
// JSX into it, passes the `userId` prop down, and matches its queries with the `clientLoader`'s.
import { userOptions, userPostsOptions, queryClient } from '../queries'
import { DashboardStats } from '../components/dashboard-stats'
import type { Route } from './+types/dashboard'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  await Promise.all([
    queryClient.ensureQueryData(userOptions(params.userId)),
    queryClient.ensureQueryData(userPostsOptions(params.userId)),
  ])
}

export default function Dashboard({ params }: Route.ComponentProps) {
  return (
    <main>
      <h1>Dashboard</h1>
      <DashboardStats userId={params.userId} />
    </main>
  )
}
