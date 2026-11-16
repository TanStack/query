import { queryOptions, skipToken } from '@tanstack/vue-query'
import { authorsAPI } from './api'

export const authorsQueries = {
  all: () => ['authors'] as const,
  detail: (id: number | undefined) =>
    queryOptions({
      queryKey: [...authorsQueries.all(), 'detail', id] as const,
      queryFn: id === undefined ? skipToken : () => authorsAPI.getAuthor(id),
    }),
}
