import type { Character } from './types'

export const charactersAPI = {
  getCharacters: async (): Promise<{
    results: Array<Character>
  }> => {
    await new Promise((r) => setTimeout(r, 500))
    const response = await fetch('https://rickandmortyapi.com/api/character/')
    if (!response.ok) throw new Error('Failed to fetch characters')
    return await response.json()
  },
  getCharacter: async (selectedChar: number): Promise<Character> => {
    await new Promise((r) => setTimeout(r, 500))
    const response = await fetch(
      `https://rickandmortyapi.com/api/character/${selectedChar}`,
    )
    if (!response.ok) throw new Error('Failed to fetch character')
    return await response.json()
  },
}
