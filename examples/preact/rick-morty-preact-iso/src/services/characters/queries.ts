import { queryOptions } from '@tanstack/preact-query'
import { charactersAPI } from './api'

export const charactersQueries = {
  all: () => ['characters'] as const,
  list: () =>
    queryOptions({
      queryKey: [...charactersQueries.all(), 'list'] as const,
      queryFn: () => charactersAPI.getCharacters(),
    }),
  detail: (characterId: string) =>
    queryOptions({
      queryKey: [...charactersQueries.all(), 'detail', characterId] as const,
      queryFn: () => charactersAPI.getCharacter(characterId),
    }),
}
