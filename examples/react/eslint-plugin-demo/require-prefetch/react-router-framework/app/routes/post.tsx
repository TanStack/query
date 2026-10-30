// ✅ passes: the `clientLoader` prefetches the post from `params.postId`, and the component reads
// the same param with `useParams()`.
import { useParams } from 'react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { postOptions, queryClient } from '../queries'
import type { Route } from './+types/post'

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  await queryClient.ensureQueryData(postOptions(params.postId))
}

export default function Post() {
  const { postId } = useParams()
  const { data: post } = useSuspenseQuery(postOptions(postId))

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  )
}
