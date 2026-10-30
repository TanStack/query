// ✅ passes: the `clientLoader` returns the id it prefetched with, and the component reads it back
// with `useLoaderData()`, so both build the same query.
import { useLoaderData } from 'react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { commentsOptions, queryClient } from '../queries'
import type { Route } from './+types/post-comments'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  void queryClient.query(commentsOptions(params.postId))
  return { postId: params.postId }
}

export default function PostComments() {
  const { postId } = useLoaderData<typeof clientLoader>()
  const { data: comments } = useSuspenseQuery(commentsOptions(postId))

  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id}>{comment.body}</li>
      ))}
    </ul>
  )
}
