import { suspenseQueryOptions } from '@tanstack/react-query'
import { pokemonsAPI } from './api'

export const pokemonsQueries = {
  all: () => ['pokemons'] as const,
  detail: (id: number) =>
    suspenseQueryOptions({
      queryKey: [...pokemonsQueries.all(), 'detail', id] as const,
      queryFn: () => pokemonsAPI.getPokemon(id),
    }),
}
