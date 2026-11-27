export async function fetchBooks(page, signal) {
  const response = await fetch(`./books-${page}.json`, { signal })
  if (!response.ok) throw new Error(`Could not load page ${page}`)
  return response.json()
}
