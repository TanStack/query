import type { PlanetsPage } from './types'

const endPoint = 'https://swapi.dev/api'

export const planetsAPI = {
  getPlanets: async (page: number): Promise<PlanetsPage> => {
    const response = await fetch(`${endPoint}/planets/?page=${page}`)
    if (!response.ok) throw new Error('Failed to fetch planets')
    return await response.json()
  },
}
