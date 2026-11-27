import * as React from 'react'
import { interval } from '#polling-option'
import {
  useBookPages,
  useBookQuery,
  useSuspenseBookPages,
  useSuspenseBookQuery,
} from '#query-hooks'
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

function BookRow({ label, result, page }) {
  return (
    <li>
      {label}: {page?.titles.join(', ')}{' '}
      {result.dataUpdatedAt > 0 && (
        <time dateTime={new Date(result.dataUpdatedAt).toISOString()}>
          {new Date(result.dataUpdatedAt).toLocaleTimeString()}
        </time>
      )}
    </li>
  )
}

function SuspenseBook() {
  const result = useSuspenseBookQuery(options('suspense'))
  return <BookRow label="Suspense query" result={result} page={result.data} />
}

function SuspensePages() {
  const result = useSuspenseBookPages({
    ...options('suspense-infinite'),
    ...pagination,
  })
  return (
    <BookRow
      label="Suspense infinite query"
      result={result}
      page={result.data.pages[0]}
    />
  )
}

export function ReadingList() {
  const query = useBookQuery(options('query'))
  const infinite = useBookPages({ ...options('infinite'), ...pagination })
  return (
    <ul>
      <BookRow label="Query" result={query} page={query.data} />
      <BookRow
        label="Infinite query"
        result={infinite}
        page={infinite.data?.pages[0]}
      />
      <React.Suspense fallback={<li role="status">Loading suspense query…</li>}>
        <SuspenseBook />
      </React.Suspense>
      <React.Suspense fallback={<li role="status">Loading suspense pages…</li>}>
        <SuspensePages />
      </React.Suspense>
    </ul>
  )
}
