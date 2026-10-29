// ❌ fails: the server `loader` prefetches into a per-request query client but never dehydrates it,
// so the browser starts over with an empty cache and fetches again after render.
import { useParams } from 'react-router'
import { QueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { userOptions } from '../queries'
import type { Route } from './+types/profile'

export async function loader({ params }: Route.LoaderArgs) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(userOptions(params.userId))
  return null
}

export default function Profile() {
  const { userId } = useParams()
  // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'userOptions(userId)' used by 'useSuspenseQuery' is only prefetched in a server 'loader' that doesn't call 'dehydrate(queryClient)', so the prefetched data doesn't reach the client. Return the dehydrated state and render it in a '<HydrationBoundary>', or prefetch in 'clientLoader'.
  const { data: user } = useSuspenseQuery(userOptions(userId))
  return <h1>{user.name}</h1>
}
