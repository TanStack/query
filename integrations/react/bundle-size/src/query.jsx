import * as React from 'react'
import { isError, isPending, useBookQuery } from '#query-hooks'
import { fetchBooks } from './books.js'

export function ReadingList() {
  const books = useBookQuery({
    queryKey: ['books', 1],
    queryFn: ({ signal }) => fetchBooks(1, signal),
  })
  if (isPending(books)) return <p>Loading books…</p>
  if (isError(books)) return <p role="alert">{books.error.message}</p>
  return (
    <ul>
      {books.data.titles.map((title) => (
        <li key={title}>{title}</li>
      ))}
    </ul>
  )
}
