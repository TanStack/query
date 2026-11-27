import * as React from 'react'
import {
  queryOptions,
  infiniteQueryOptions,
  mutationOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from '#adapter'
import { fetchBooks } from './books.js'

export function ReadingList() {
  const books = useInfiniteQuery(
    infiniteQueryOptions({
      queryKey: ['books'],
      queryFn: ({ pageParam, signal }) => fetchBooks(pageParam, signal),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.next,
    }),
  )
  const bookmark = useQuery(
    queryOptions({
      queryKey: ['bookmark'],
      queryFn: () => localStorage.getItem('bookmark'),
    }),
  )
  const save = useMutation(
    mutationOptions({
      mutationFn: async (title) => localStorage.setItem('bookmark', title),
      onSuccess: () => bookmark.refetch(),
    }),
  )
  if (books.isPending) return <p>Loading books…</p>
  if (books.isError) return <p role="alert">{books.error.message}</p>
  return (
    <>
      {bookmark.data && <p>Bookmarked: {bookmark.data}</p>}
      <ul>
        {books.data.pages
          .flatMap((page) => page.titles)
          .map((title) => (
            <li key={title}>
              {title}{' '}
              <button onClick={() => save.mutate(title)}>Bookmark</button>
            </li>
          ))}
      </ul>
      {books.hasNextPage && (
        <button
          disabled={books.isFetching}
          onClick={() => books.fetchNextPage()}
        >
          Load more
        </button>
      )}
      {save.isError && <p role="alert">{save.error.message}</p>}
    </>
  )
}
