// ✅ passes: the page prefetches with its `id` slug prop, the same value it passes to the client
// components, and dehydrates into a <HydrationBoundary>.
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../../get-query-client'
import { commentsOptions, postOptions } from '../../queries'
import { PostInfo } from '../../components/post-info'
import { CommentList } from '../../components/comment-list'
import type { PageProps } from 'waku/router'

export default async function PostPage({ id }: PageProps<'/posts/[id]'>) {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(postOptions(id))
  // Not awaited: comments stream in, but the fetch still starts on the server.
  void queryClient.prefetchQuery(commentsOptions(id))
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostInfo id={id} />
      <CommentList postId={id} />
    </HydrationBoundary>
  )
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
