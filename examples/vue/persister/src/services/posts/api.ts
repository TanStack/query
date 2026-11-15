import type { Post } from './types'

export const postsAPI = {
  getPosts: async (): Promise<Array<Post>> => {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts')
    if (!response.ok) throw new Error('Failed to fetch posts')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return await response.json()
  },
  getPost: async (id: number): Promise<Post> => {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/posts/${id}`,
    )
    if (!response.ok) throw new Error('Failed to fetch post')
    return await response.json()
  },
}
