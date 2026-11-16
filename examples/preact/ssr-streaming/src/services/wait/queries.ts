import { queryOptions } from '@tanstack/preact-query'
import { waitAPI } from './api'

export const waitQueries = {
  all: () => ['wait'] as const,
  detail: (wait: number) =>
    queryOptions({
      queryKey: [...waitQueries.all(), 'detail', wait] as const,
      queryFn: () => waitAPI.getWait(wait),
    }),
}
