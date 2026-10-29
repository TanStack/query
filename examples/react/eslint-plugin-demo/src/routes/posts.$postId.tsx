import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { PostComments } from '../components/post-comments'
import { commentsOptions, postOptions } from '../queries'

// ✅ passes: the loader starts the queries the component reads, including the
// comments that <PostComments /> in another file reads
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params, context }) => {
    void context.queryClient.query(postOptions(params.postId))
    void context.queryClient.query(commentsOptions(params.postId))
  },
  component: Post,
})

function Post() {
  // Reading params with `from` works the same as `Route.useParams()`
  const { postId } = useParams({ from: '/posts/$postId' })
  const { data } = useSuspenseQuery(postOptions(postId))
  return (
    <>
      <h1>{data.title}</h1>
      <PostComments />
    </>
  )
}
