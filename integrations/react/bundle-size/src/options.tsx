import * as React from 'react'
import { useMutation, useQueryClient } from '#adapter'
import {
  bookmarkScope,
  previousPage,
  refreshBookmarks,
  selectTitles,
} from '#feature-options'
import { isError, isPending, useBookQuery } from '#query-hooks'
import { fetchBooks } from './books.ts'

function savedBooks(): string[] {
  return JSON.parse(localStorage.getItem('bookmarks') ?? '[]') as string[]
}

export function ReadingList() {
  const client = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [events, setEvents] = React.useState<string[]>([])
  const books = useBookQuery({
    queryKey: ['books', page],
    queryFn: ({ signal }) => fetchBooks(page, signal),
    select: selectTitles,
    placeholderData: previousPage,
  })
  const saved = useBookQuery({ queryKey: ['bookmarks'], queryFn: savedBooks })
  const bookmark = useMutation({
    scope: bookmarkScope,
    mutationFn: async (title: string) => {
      setEvents((items) => [...items, `Saving ${title}`])
      await Promise.resolve()
      localStorage.setItem(
        'bookmarks',
        JSON.stringify([...savedBooks(), title]),
      )
      setEvents((items) => [...items, `Saved ${title}`])
    },
    onSuccess: () => refreshBookmarks(client),
  })
  if (isPending(books)) return <p>Loading books…</p>
  if (isError(books)) return <p role="alert">{books.error.message}</p>
  return (
    <>
      <ul>
        {books.data.map((title) => (
          <li key={title}>{title}</li>
        ))}
      </ul>
      {books.isPlaceholderData && (
        <p role="status">Showing the previous page</p>
      )}
      <button disabled={page === 2} onClick={() => setPage(2)}>
        Next page
      </button>
      <button
        onClick={() => books.data.forEach((title) => bookmark.mutate(title))}
      >
        Bookmark this page
      </button>
      <p>Bookmarks: {saved.data?.join(', ')}</p>
      <ol aria-label="Bookmark activity">
        {events.map((event, index) => (
          <li key={index}>{event}</li>
        ))}
      </ol>
    </>
  )
}
