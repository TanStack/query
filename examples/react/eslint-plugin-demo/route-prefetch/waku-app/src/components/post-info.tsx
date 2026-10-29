'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { postOptions } from '../queries'

export function PostInfo({ id }: { id: string }) {
  const { data: post } = useSuspenseQuery(postOptions(id))
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  )
}
