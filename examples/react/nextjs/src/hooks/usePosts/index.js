import ky from 'ky-universal'
import { useQuery } from '@tanstack/react-query'

const fetchPosts = async (limit = 10) => {
  const parsed = await ky('https://jsonplaceholder.typicode.com/posts').json()
  return parsed.slice(0, limit)
}

const usePosts = (limit) => {
  return useQuery({
    queryKey: ['posts', limit],
    queryFn: () => fetchPosts(limit),
  })
}

export { usePosts, fetchPosts }
