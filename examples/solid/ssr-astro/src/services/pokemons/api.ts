import type { Pokemon, PokemonList } from './types'

const MAX_POKEMONS = 100

export const pokemonsAPI = {
  getPokemons: async (): Promise<PokemonList> => {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMONS}`,
    )
    if (!response.ok) throw new Error('Failed to fetch pokemons')
    return await response.json()
  },
  getPokemon: async (id: string): Promise<Pokemon> => {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    if (!response.ok) throw new Error('Failed to fetch pokemon')
    return await response.json()
  },
}
