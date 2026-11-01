import type { Post } from './types'

export const postsAPI = (customFetch = fetch) => ({
  getPosts: async (limit: number) => {
    const response = await customFetch(
      'https://jsonplaceholder.typicode.com/posts',
    )
    if (!response.ok) throw new Error('Failed to fetch posts')
    const data = (await response.json()) as Array<Post>
    return data.filter((x) => x.id <= limit)
  },
  getPost: async (id: number): Promise<Post> => {
    const response = await customFetch(
      `https://jsonplaceholder.typicode.com/posts/${id}`,
    )
    if (!response.ok) throw new Error('Failed to fetch post')
    const data = (await response.json()) as Post
    return data
  },
})
