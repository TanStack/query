import type { Author } from './types'

export const authorsAPI = {
  getAuthor: async (id: number): Promise<Author> => {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${id}`,
    )
    if (!response.ok) throw new Error('Failed to fetch author')
    return await response.json()
  },
}
