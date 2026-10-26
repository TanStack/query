import type { User } from './types'

export const usersAPI = {
  getUser: async (id: number): Promise<User> => {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${id}`,
    )
    if (!response.ok) throw new Error('Failed to fetch user')
    return await response.json()
  },
}
