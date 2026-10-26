import { useQuery } from '@tanstack/preact-query'
import { commentsQueries } from './services/comments/queries'
import { postsQueries } from './services/posts/queries'

export default function App() {
  // This query was prefetched on the server, so its data is already in the
  // server-rendered markup and is available immediately on the client
  const postsQuery = useQuery(postsQueries.list())

  // This query was not prefetched on the server and will not start
  // fetching until on the client, both patterns are fine to mix
  const commentsQuery = useQuery(commentsQueries.list())

  return (
    <div>
      <h1>Server Rendering with Preact Query</h1>
      <h2>Comments</h2>
      <p>
        {commentsQuery.isPending
          ? 'Loading comments on the client...'
          : commentsQuery.isError
            ? `Error: ${commentsQuery.error.message}`
            : `${commentsQuery.data.length} comments`}
      </p>
      <h2>Posts</h2>
      {postsQuery.isPending ? (
        'Loading posts...'
      ) : postsQuery.isError ? (
        <span>Error: {postsQuery.error.message}</span>
      ) : (
        <ul>
          {postsQuery.data.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
