import { queryOptions } from '@tanstack/solid-query'
import { usersAPI } from './api'

export const usersQueries = {
  all: () => ['users'] as const,
  detail: ({
    sleep,
    simulateError,
  }: { sleep?: number; simulateError?: boolean } = {}) =>
    queryOptions({
      queryKey: [
        ...usersQueries.all(),
        'detail',
        sleep,
        simulateError,
      ] as const,
      queryFn: () => usersAPI.getUser({ sleep, simulateError }),
    }),
}
