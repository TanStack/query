// ✅ passes: a route folder named `app` (/dashboard/app) is still a normal route segment, covered by
// the dashboard layout's prefetch of currentUserOptions
import { Welcome } from '../welcome'

export default function DashboardAppPage() {
  return (
    <section>
      <Welcome />
      <h2>Installed apps</h2>
    </section>
  )
}
