// ✅ passes: the server `loader` prefetches into a per-request query client and returns
// `dehydrate(queryClient)`, which the component renders in a `<HydrationBoundary>`. The `params`
// prop is passed down to a child component in the same file.
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { userOptions } from '../queries'
import type { Route } from './+types/user'

export async function loader({ params }: Route.LoaderArgs) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(userOptions(params.userId))
  return { dehydratedState: dehydrate(queryClient) }
}

export default function UserRoute({
  params,
  loaderData,
}: Route.ComponentProps) {
  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <UserCard userId={params.userId} />
    </HydrationBoundary>
  )
}

function UserCard({ userId }: { userId: string }) {
  const { data: user } = useSuspenseQuery(userOptions(userId))
  return <h1>{user.name}</h1>
}
