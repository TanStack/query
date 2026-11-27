import type { Comment } from './types'

export const commentsAPI = {
  getComments: async (): Promise<Array<Comment>> => {
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/comments',
    )
    if (!response.ok) throw new Error('Failed to fetch comments')
    return await response.json()
  },
}
