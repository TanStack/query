import { useQuery } from '@tanstack/react-query'

const fetchPosts = async (limit = 10) => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts')
  const data = await response.json()
  return data.filter((x) => x.id <= limit)
}

const usePosts = (limit) => {
  return useQuery({
    queryKey: ['posts', limit],
    queryFn: () => fetchPosts(limit),
  })
}

export { usePosts, fetchPosts }
