import { mutationOptions, queryOptions } from '@tanstack/solid-query'
import { moviesAPI } from './api'

export const moviesQueries = {
  all: () => ['movies'] as const,
  list: () =>
    queryOptions({
      queryKey: [...moviesQueries.all(), 'list'] as const,
      queryFn: () => moviesAPI.getMovies(),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...moviesQueries.all(), 'detail', id] as const,
      queryFn: () => moviesAPI.getMovie(id),
    }),
}

export const moviesMutations = {
  update: () =>
    mutationOptions({
      mutationFn: async (
        { id, comment }: { id: string; comment: string },
        context,
      ) => {
        // to avoid clashes with our optimistic update when an offline mutation continues
        await context.client.cancelQueries({
          queryKey: moviesQueries.detail(id).queryKey,
        })
        return moviesAPI.updateMovie(id, comment)
      },
    }),
}
