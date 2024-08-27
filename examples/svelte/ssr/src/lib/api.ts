import type { Post } from './types'

export const api = (customFetch = fetch) => ({
  getPosts: async (limit: number) => {
    const response = await customFetch(
      'https://jsonplaceholder.typicode.com/posts',
    )
    const data = (await response.json()) as Array<Post>
    return data.filter((x) => x.id <= limit)
  },
  getPostById: async (id: number): Promise<Post> => {
    const response = await customFetch(
      `https://jsonplaceholder.typicode.com/posts/${id}`,
    )
    const data = (await response.json()) as Post
    return data
  },
})
