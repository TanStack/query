'use client'

import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { feedOptions } from '../queries'

export function FeedList() {
  const { data, fetchNextPage, hasNextPage } =
    useSuspenseInfiniteQuery(feedOptions)

  return (
    <section>
      {data.pages.flat().map((post) => (
        <p key={post.id}>{post.title}</p>
      ))}
      {hasNextPage ? (
        <button onClick={() => fetchNextPage()}>More</button>
      ) : null}
    </section>
  )
}
