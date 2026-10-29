import { useSuspenseQuery } from '@tanstack/react-query'
import { userPostsOptions } from '../queries'

export function AuthorPosts({ authorId }: { authorId: string }) {
  const { data: posts } = useSuspenseQuery(userPostsOptions(authorId))

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
