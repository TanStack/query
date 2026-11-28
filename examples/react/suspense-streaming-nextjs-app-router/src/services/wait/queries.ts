import { suspenseQueryOptions } from '@tanstack/react-query'
import { waitAPI } from './api'

export const waitQueries = {
  all: () => ['wait'] as const,
  detail: (wait: number) =>
    suspenseQueryOptions({
      queryKey: [...waitQueries.all(), 'detail', wait] as const,
      queryFn: () => waitAPI.getWait(wait),
    }),
}
