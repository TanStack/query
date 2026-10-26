import { queryOptions } from '@tanstack/react-query'
import { waitAPI } from './api'

export const waitQueries = {
  all: () => ['wait'] as const,
  detail: (wait: number) =>
    queryOptions({
      queryKey: [...waitQueries.all(), 'detail', wait] as const,
      queryFn: () => waitAPI.getWait(wait),
    }),
}
