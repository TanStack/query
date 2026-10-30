// ✅ passes: the server `loader` calls `dehydrate()` inside the shared `hydrationData()` helper, which
// the rule follows, and the component renders the returned state in a `<HydrationBoundary>`.
import {
  HydrationBoundary,
  QueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { userOptions } from '../queries'
import { hydrationData } from '../hydration'
import type { Route } from './+types/author-bio'

export async function loader({ params }: Route.LoaderArgs) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(userOptions(params.userId))
  return hydrationData(queryClient)
}

export default function AuthorBio({
  params,
  loaderData,
}: Route.ComponentProps) {
  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <AuthorName userId={params.userId} />
    </HydrationBoundary>
  )
}

function AuthorName({ userId }: { userId: string }) {
  const { data: author } = useSuspenseQuery(userOptions(userId))
  return <h1>{author.name}</h1>
}
