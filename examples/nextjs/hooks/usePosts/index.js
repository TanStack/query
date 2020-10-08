import ky from 'ky-universal'
import { useQuery } from 'react-query'

const fetchPosts = async (_, limit) => {
  const offset = limit ?? 10

  const parsed = await ky('https://jsonplaceholder.typicode.com/posts').json()
  const result = parsed.filter(x => x.id <= offset)
  return result
}

const usePosts = limit => {
  return useQuery(['posts', limit], fetchPosts)
}

export { usePosts, fetchPosts }
