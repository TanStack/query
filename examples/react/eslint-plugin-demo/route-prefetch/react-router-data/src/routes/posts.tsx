import { Outlet } from 'react-router-dom'
import { useSuspenseQuery } from '@tanstack/react-query'
import { postListOptions } from '../queries'
import type { QueryClient } from '@tanstack/react-query'

// Prefetches the post list for the `/posts` layout and its index route.
export const loader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(postListOptions())
  return null
}

export function PostsLayout() {
  return (
    <section>
      <h1>Posts</h1>
      <Outlet />
    </section>
  )
}

export function PostList() {
  const { data: posts } = useSuspenseQuery(postListOptions())

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
