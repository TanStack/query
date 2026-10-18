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
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(
    (response) => response.json(),
  )
  return res
}

const getPokemons = async (): Promise<PokemonList> => {
  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMONS}`,
  ).then((response) => response.json())
  return res
}

export const pokemonQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['pokemon', id],
    queryFn: () => getPokemon(id),
    placeholderData: keepPreviousData,
  })

export const pokemonsQueryOptions = queryOptions({
  queryKey: ['pokemons'],
  queryFn: getPokemons,
})
