import type { Planet } from './types'

export const planetsAPI = {
  getPlanet: async (planetId: string): Promise<Planet> => {
    const res = await fetch(`https://swapi.dev/api/planets/${planetId}/`)
    if (!res.ok) throw new Error('Failed to fetch planet')
    return await res.json()
  },
}
