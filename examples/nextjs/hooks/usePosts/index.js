import ky from 'ky-universal'
import { useQuery } from 'react-query'

const fetcher = async () => {
  const parsed = await ky('https://jsonplaceholder.typicode.com/posts').json()
  return parsed
}

const usePosts = () => {
  const query = useQuery('posts', fetcher)
  return { ...query }
}

export { usePosts }
