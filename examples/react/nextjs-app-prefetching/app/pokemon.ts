import { queryOptions } from '@tanstack/react-query'

export const pokemonOptions = queryOptions({
  queryKey: ['pokemon'],
  queryFn: async () => {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/25')
    if (!response.ok) throw new Error('Failed to fetch pokemon')

    return response.json()
  },
})
