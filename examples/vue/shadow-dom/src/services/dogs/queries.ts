import { queryOptions } from '@tanstack/vue-query'
import { dogsAPI } from './api'

export const dogsQueries = {
  all: () => ['dogs'] as const,
  list: () =>
    queryOptions({
      queryKey: [...dogsQueries.all(), 'list'] as const,
      queryFn: () => dogsAPI.getDogs(),
    }),
}
