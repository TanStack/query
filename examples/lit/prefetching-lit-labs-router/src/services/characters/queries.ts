import { queryOptions, skipToken } from '@tanstack/lit-query'
import { charactersAPI } from './api'

export const charactersQueries = {
  all: () => ['characters'] as const,
  list: () =>
    queryOptions({
      queryKey: [...charactersQueries.all(), 'list'] as const,
      queryFn: () => charactersAPI.getCharacters(),
    }),
  detail: (id: number | undefined) =>
    queryOptions({
      queryKey: [...charactersQueries.all(), 'detail', id] as const,
      queryFn: id ? () => charactersAPI.getCharacter(id) : skipToken,
    }),
}
