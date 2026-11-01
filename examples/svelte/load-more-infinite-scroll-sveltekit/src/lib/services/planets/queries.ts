import { infiniteQueryOptions } from '@tanstack/svelte-query'
import { planetsAPI } from './api'

export const planetsQueries = {
  all: () => ['planets'] as const,
  list: () =>
    infiniteQueryOptions({
      queryKey: [...planetsQueries.all(), 'list'] as const,
      queryFn: ({ pageParam }) => planetsAPI.getPlanets(pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.next) {
          const nextUrl = new URLSearchParams(new URL(lastPage.next).search)
          const nextCursor = nextUrl.get('page')
          if (nextCursor) {
            return +nextCursor
          }
        }
        return undefined
      },
    }),
}
