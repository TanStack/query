'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { postOptions } from '../../queries'

export function PostInfo({ id }: { id: string }) {
  const { data } = useSuspenseQuery(postOptions(id))

  return (
    <article>
      <h1>{data.title}</h1>
      <p>{data.body}</p>
    </article>
  )
}
