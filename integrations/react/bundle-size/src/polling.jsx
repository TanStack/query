import * as React from 'react'
import {
  useQuery,
  useInfiniteQuery,
  useSuspenseQuery,
  useSuspenseInfiniteQuery,
} from '#adapter'
import { interval } from '#polling-option'
import { fetchBooks } from './books.js'

function options(name) {
  return {
    queryKey: ['books', name],
    queryFn: ({ pageParam = 1, signal }) => fetchBooks(pageParam, signal),
    refetchInterval: interval,
    refetchIntervalInBackground: true,
  }
}

const pagination = {
  initialPageParam: 1,
  getNextPageParam: (page) => page.next,
}

function Updates() {
  const query = useQuery(options('query'))
  const infinite = useInfiniteQuery({ ...options('infinite'), ...pagination })
  const suspense = useSuspenseQuery(options('suspense'))
  const suspenseInfinite = useSuspenseInfiniteQuery({
    ...options('suspense-infinite'),
    ...pagination,
  })
  const rows = [
    ['Query', query, query.data],
    ['Infinite query', infinite, infinite.data?.pages[0]],
    ['Suspense query', suspense, suspense.data],
    [
      'Suspense infinite query',
      suspenseInfinite,
      suspenseInfinite.data.pages[0],
    ],
  ]
  return (
    <ul>
      {rows.map(([name, result, page]) => (
        <li key={name}>
          {name}: {page?.titles.join(', ')}{' '}
          {result.dataUpdatedAt > 0 && (
            <time dateTime={new Date(result.dataUpdatedAt).toISOString()}>
              {new Date(result.dataUpdatedAt).toLocaleTimeString()}
            </time>
          )}
        </li>
      ))}
    </ul>
  )
}

export function ReadingList() {
  return (
    <React.Suspense fallback={<p>Loading books…</p>}>
      <Updates />
    </React.Suspense>
  )
}
