import { keepPreviousData, queryOptions } from '@tanstack/solid-query'
import { pokemonsAPI } from './api'

export const pokemonsQueries = {
  all: () => ['pokemons'] as const,
  list: () =>
    queryOptions({
      queryKey: [...pokemonsQueries.all(), 'list'] as const,
      queryFn: () => pokemonsAPI.getPokemons(),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...pokemonsQueries.all(), 'detail', id] as const,
      queryFn: () => pokemonsAPI.getPokemon(id),
      placeholderData: keepPreviousData,
      throwOnError: true,
    }),
}
