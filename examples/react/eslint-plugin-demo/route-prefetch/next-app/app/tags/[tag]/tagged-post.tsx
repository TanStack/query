'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { postOptions } from '../../queries'

export function TaggedPost({ tag }: { tag: string }) {
  const { data } = useSuspenseQuery(postOptions(tag))

  return <h1>{data.title}</h1>
}
