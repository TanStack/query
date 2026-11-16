import { queryOptions } from '@tanstack/preact-query'
import { reposAPI } from './api'

export const reposQueries = {
  all: () => ['repos'] as const,
  detail: () =>
    queryOptions({
      queryKey: [...reposQueries.all(), 'detail'] as const,
      queryFn: () => reposAPI.getRepo(),
    }),
}
