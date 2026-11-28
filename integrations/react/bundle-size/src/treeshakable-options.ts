import {
  invalidateQueries,
  placeholderData,
  select,
  serialScope,
} from '#adapter'
import type { QueryClient } from '#adapter'
import type { BookPage } from './books.ts'

export const selectTitles = select((page: BookPage) => page.titles)
export const previousPage = placeholderData(
  (previous: BookPage | undefined) => previous,
)
export const bookmarkScope = serialScope('bookmarks')
export const refreshBookmarks = (client: QueryClient) =>
  invalidateQueries(client, { queryKey: ['bookmarks'] })
