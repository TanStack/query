import type { Character, Paginated } from './types'

export const charactersAPI = {
  getCharacters: async (): Promise<Paginated<Character>> => {
    const res = await fetch('https://swapi.dev/api/people/')
    if (!res.ok) throw new Error('Failed to fetch characters')
    return await res.json()
  },
  getCharacter: async (characterId: string): Promise<Character> => {
    const res = await fetch(`https://swapi.dev/api/people/${characterId}/`)
    if (!res.ok) throw new Error('Failed to fetch character')
    return await res.json()
  },
}
