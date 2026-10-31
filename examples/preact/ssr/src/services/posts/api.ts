import type { Post } from './types'

export const postsAPI = {
  getPosts: async (): Promise<Array<Post>> => {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts')
    if (!response.ok) throw new Error('Failed to fetch posts')
    return await response.json()
  },
}
