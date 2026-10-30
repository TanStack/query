// ✅ passes: the prefetch happens inside the prefetchUser() helper in another file
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/app/get-query-client'
import { prefetchUser } from '@/lib/prefetch'
import { UserProfile } from './user-profile'

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const queryClient = getQueryClient()
  await prefetchUser(queryClient, id)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserProfile id={id} />
    </HydrationBoundary>
  )
}
