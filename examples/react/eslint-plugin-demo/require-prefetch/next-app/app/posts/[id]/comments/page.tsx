// ✅ passes: the client component reads the same [id] with useParams() from next/navigation
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { commentsOptions } from '../../../queries'
import { CommentList } from './comment-list'

export default async function CommentsPage(props: {
  params: Promise<{ id: string }>
}) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(commentsOptions((await props.params).id))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CommentList />
    </HydrationBoundary>
  )
}
