import { useParams } from 'react-router-dom'
import { useSuspenseQuery } from '@tanstack/react-query'
import { postOptions } from '../queries'

export function EditPost() {
  const { postId } = useParams()
  const { data: post } = useSuspenseQuery(postOptions(postId))

  return <textarea defaultValue={post.body} />
}
