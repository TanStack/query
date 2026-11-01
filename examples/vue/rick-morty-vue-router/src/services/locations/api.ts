import type { Location } from './types'

export const locationsAPI = {
  getLocation: async (locationId: string): Promise<Location> => {
    const res = await fetch(
      `https://rickandmortyapi.com/api/location/${locationId}`,
    )
    if (!res.ok) throw new Error('Failed to fetch location')
    return await res.json()
  },
}
