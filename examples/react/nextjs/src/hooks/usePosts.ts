import { useQuery } from '@tanstack/react-query'
import { postsQueries } from '../services/posts/queries'

const usePosts = (limit: number) => {
  return useQuery(postsQueries.list(limit))
}

export { usePosts }
