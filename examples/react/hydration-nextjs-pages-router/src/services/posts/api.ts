import type { Post } from './types'

export const postsAPI = {
  getPosts: async (limit: number): Promise<Array<Post>> => {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts')
    if (!response.ok) throw new Error('Failed to fetch posts')
    const data = await response.json()
    return data.filter((x: Post) => x.id <= limit)
  },
}
