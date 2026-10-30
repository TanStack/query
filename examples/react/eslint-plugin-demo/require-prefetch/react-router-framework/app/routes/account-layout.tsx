// ✅ passes: this pathless `layout()` route of routes.ts prefetches the current user in its
// `clientLoader` for the routes nested in it, and runs no queries itself.
import { Outlet } from 'react-router'
import { currentUserOptions, queryClient } from '../queries'

export async function clientLoader() {
  await queryClient.ensureQueryData(currentUserOptions)
}

export default function AccountLayout() {
  return (
    <section>
      <Outlet />
    </section>
  )
}
