'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { commentsOptions } from '../queries'

export function CommentList({ postId }: { postId: string }) {
  const { data: comments } = useSuspenseQuery(commentsOptions(postId))
  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id}>{comment.body}</li>
      ))}
    </ul>
  )
}
