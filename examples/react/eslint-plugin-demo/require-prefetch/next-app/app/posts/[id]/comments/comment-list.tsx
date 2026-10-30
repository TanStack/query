'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { commentsOptions } from '../../../queries'

export function CommentList() {
  const params = useParams<{ id: string }>()
  const { data } = useSuspenseQuery(commentsOptions(params.id))

  return (
    <ul>
      {data.map((comment) => (
        <li key={comment.id}>{comment.body}</li>
      ))}
    </ul>
  )
}
