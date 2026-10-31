import { queryOptions } from '@tanstack/react-query'
import { reposAPI } from './api'

export const reposQueries = {
  all: () => ['repos'] as const,
  detail: () =>
    queryOptions({
      queryKey: [...reposQueries.all(), 'detail'] as const,
      queryFn: () => reposAPI.getRepo(),
    }),
}
