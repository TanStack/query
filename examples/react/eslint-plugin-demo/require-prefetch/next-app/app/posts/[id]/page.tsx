// ✅ passes: the page prefetches postOptions(id) from its params, dehydrates it, and passes id down as a prop
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../../get-query-client'
import { postOptions } from '../../queries'
import { PostInfo } from './post-info'

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(postOptions(id))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostInfo id={id} />
    </HydrationBoundary>
  )
}
