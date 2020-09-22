import ky from 'ky-universal'
import { useQuery } from 'react-query'

const fetchPosts = async (_, limit) => {
  const parsed = await ky('https://jsonplaceholder.typicode.com/posts').json()
  const result = parsed.filter(x => x.id <= limit ?? 10)
  return result
}

const usePosts = limit => {
  const query = useQuery(['posts', limit], fetchPosts)
  return { ...query }
}

export { usePosts, fetchPosts }
