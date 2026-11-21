import { queryOptions } from '@tanstack/react-query'
import { moviesAPI } from './api'

export const moviesQueries = {
  all: () => ['movies'] as const,
  list: () =>
    queryOptions({
      queryKey: [...moviesQueries.all(), 'list'] as const,
      queryFn: () => moviesAPI.getMovies(),
    }),
  detail: (title: string) =>
    queryOptions({
      queryKey: [...moviesQueries.all(), 'detail', title] as const,
      queryFn: () => moviesAPI.getMovie(title),
    }),
}
