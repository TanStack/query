import { queryOptions } from '@tanstack/svelte-query'
import { filmsAPI } from './api'

export const filmsQueries = {
  all: () => ['films'] as const,
  list: () =>
    queryOptions({
      queryKey: [...filmsQueries.all(), 'list'] as const,
      queryFn: () => filmsAPI.getFilms(),
    }),
  detail: (filmId: string) =>
    queryOptions({
      queryKey: [...filmsQueries.all(), 'detail', filmId] as const,
      queryFn: () => filmsAPI.getFilm(filmId),
    }),
}
