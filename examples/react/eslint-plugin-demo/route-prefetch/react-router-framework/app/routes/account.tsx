// ✅ passes: this route has no loader of its own, but it's nested in `layout('routes/account-layout.tsx')`
// in routes.ts, whose `clientLoader` prefetches `currentUserOptions`.
import { useSuspenseQuery } from '@tanstack/react-query'
import { currentUserOptions } from '../queries'

export default function Account() {
  const { data: user } = useSuspenseQuery(currentUserOptions)
  return <h1>Signed in as {user.name}</h1>
}
