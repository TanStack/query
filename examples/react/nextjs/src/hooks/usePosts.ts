import { queryOptions, useQuery } from '@tanstack/react-query'

type Post = {
  id: number
  title: string
  body: string
}

const fetchPosts = async (limit: number): Promise<Array<Post>> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts')
  if (!response.ok) throw new Error('Failed to fetch posts')
  const data = await response.json()
  return data.filter((x: Post) => x.id <= limit)
}

const postsQueryOptions = (limit: number) =>
  queryOptions({
    queryKey: ['posts', limit],
    queryFn: () => fetchPosts(limit),
  })

const usePosts = (limit: number) => {
  return useQuery(postsQueryOptions(limit))
}

export { usePosts, postsQueryOptions }
