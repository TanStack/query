import { queryOptions } from '@tanstack/react-query'
import { charactersAPI } from './api'

export const charactersQueries = {
  all: () => ['characters'] as const,
  detail: (id: number) =>
    queryOptions({
      queryKey: [...charactersQueries.all(), 'detail', id] as const,
      queryFn: () => charactersAPI.getCharacter(id),
      staleTime: 60 * 1000,
    }),
}
