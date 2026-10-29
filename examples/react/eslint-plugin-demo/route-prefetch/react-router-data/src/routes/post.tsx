import { useParams } from 'react-router-dom'
import { useSuspenseQuery } from '@tanstack/react-query'
import { postOptions } from '../queries'
import type { LoaderFunctionArgs } from 'react-router-dom'
import type { QueryClient } from '@tanstack/react-query'

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(postOptions(params.postId))
    return null
  }

export function Post() {
  const { postId } = useParams()
  const { data: post } = useSuspenseQuery(postOptions(postId))

  return (
    <article>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
    </article>
  )
}
