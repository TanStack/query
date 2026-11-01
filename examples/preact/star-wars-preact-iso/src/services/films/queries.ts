import { queryOptions, skipToken } from '@tanstack/preact-query'
import { filmsAPI } from './api'

export const filmsQueries = {
  all: () => ['films'] as const,
  list: () =>
    queryOptions({
      queryKey: [...filmsQueries.all(), 'list'] as const,
      queryFn: () => filmsAPI.getFilms(),
    }),
  detail: (filmId: string | undefined) =>
    queryOptions({
      queryKey: [...filmsQueries.all(), 'detail', filmId] as const,
      queryFn: filmId ? () => filmsAPI.getFilm(filmId) : skipToken,
    }),
}
