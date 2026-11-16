import type { Repo } from './types'

export const reposAPI = {
  getRepo: async (): Promise<Repo> => {
    const response = await fetch('https://api.github.com/repos/TanStack/query')
    if (!response.ok) throw new Error('Failed to fetch repo data')
    return await response.json()
  },
}
