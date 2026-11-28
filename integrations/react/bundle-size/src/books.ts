import type {
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryOptions,
} from '#adapter'

export interface BookPage {
  titles: string[]
  next: number | null
}

export async function fetchBooks(
  page: number,
  signal: AbortSignal,
): Promise<BookPage> {
  const response = await fetch(`./books-${page}.json`, { signal })
  if (!response.ok) throw new Error(`Could not load page ${page}`)
  return response.json() as Promise<BookPage>
}

export type BookPagesOptions = UseInfiniteQueryOptions<
  BookPage,
  Error,
  InfiniteData<BookPage, number>,
  QueryKey,
  number
>
export type SuspenseBookPagesOptions = UseSuspenseInfiniteQueryOptions<
  BookPage,
  Error,
  InfiniteData<BookPage, number>,
  QueryKey,
  number
>
