// ✅ passes: the feed page lives in `useState`, so it only exists at render time. The rule can't
// know which page will be shown and doesn't report it; the loader warms up the first page.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { feedOptions, queryClient } from '../queries'

export async function clientLoader() {
  void queryClient.prefetchQuery(feedOptions(1))
}

export default function Home() {
  const [page, setPage] = useState(1)
  const { data: posts = [] } = useQuery(feedOptions(page))

  return (
    <main>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <button onClick={() => setPage((current) => current + 1)}>
        Next page
      </button>
    </main>
  )
}
