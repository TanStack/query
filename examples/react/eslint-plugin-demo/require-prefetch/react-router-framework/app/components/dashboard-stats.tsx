import { useSuspenseQuery } from '@tanstack/react-query'
import { userOptions, userPostsOptions } from '../queries'

export function DashboardStats({ userId }: { userId: string }) {
  const { data: user } = useSuspenseQuery(userOptions(userId))
  const { data: posts } = useSuspenseQuery(userPostsOptions(userId))

  return (
    <p>
      {user.name} has written {posts.length} posts.
    </p>
  )
}
