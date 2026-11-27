import type { QueryClient } from '#adapter'
import type { BookPage } from './books.ts'

export const selectTitles = (page: BookPage) => page.titles
export const previousPage = (previous: BookPage | undefined) => previous
export const bookmarkScope = { id: 'bookmarks' }
export const refreshBookmarks = (client: QueryClient) =>
  client.invalidateQueries({ queryKey: ['bookmarks'] })
