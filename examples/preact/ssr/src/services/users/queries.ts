import { queryOptions, skipToken } from '@tanstack/preact-query'
import { usersAPI } from './api'

export const usersQueries = {
  all: () => ['users'] as const,
  detail: (id: number | undefined) =>
    queryOptions({
      queryKey: [...usersQueries.all(), 'detail', id] as const,
      queryFn: id ? () => usersAPI.getUser(id) : skipToken,
    }),
}
