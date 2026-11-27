import {
  invalidateQueries,
  placeholderData,
  select,
  serialScope,
} from '#adapter'

export const selectTitles = select((page) => page.titles)
export const previousPage = placeholderData((previous) => previous)
export const bookmarkScope = serialScope('bookmarks')
export const refreshBookmarks = (client) =>
  invalidateQueries(client, { queryKey: ['bookmarks'] })
