export const selectTitles = (page) => page.titles
export const previousPage = (previous) => previous
export const bookmarkScope = { id: 'bookmarks' }
export const refreshBookmarks = (client) =>
  client.invalidateQueries({ queryKey: ['bookmarks'] })
