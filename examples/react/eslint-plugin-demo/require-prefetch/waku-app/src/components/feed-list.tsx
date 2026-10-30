'use client'

import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { feedOptions } from '../queries'

export function FeedList() {
  const { data, fetchNextPage, hasNextPage } =
    useSuspenseInfiniteQuery(feedOptions)
  return (
    <>
      <ul>
        {data.pages.flat().map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load more</button>
      )}
    </>
  )
}
