import { keepPreviousData, queryOptions } from '@tanstack/solid-query'

const MAX_POKEMONS = 100

type Pokemon = {
  name: string
  stats: Array<{ base_stat: number; stat: { name: string } }>
}

type PokemonList = {
  results: Array<{ name: string; url: string }>
}

const getPokemon = async (id: string): Promise<Pokemon> => {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  if (!response.ok) throw new Error('Failed to fetch pokemon')
  return await response.json()
}

const getPokemons = async (): Promise<PokemonList> => {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMONS}`,
  )
  if (!response.ok) throw new Error('Failed to fetch pokemons')
  return await response.json()
}

export const pokemonQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['pokemon', id],
    queryFn: () => getPokemon(id),
    placeholderData: keepPreviousData,
    throwOnError: true,
  })

export const pokemonsQueryOptions = queryOptions({
  queryKey: ['pokemons'],
  queryFn: getPokemons,
})
