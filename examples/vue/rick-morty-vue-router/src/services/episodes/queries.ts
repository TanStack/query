import { queryOptions } from '@tanstack/vue-query'
import { episodesAPI } from './api'

export const episodesQueries = {
  all: () => ['episodes'] as const,
  list: () =>
    queryOptions({
      queryKey: [...episodesQueries.all(), 'list'] as const,
      queryFn: () => episodesAPI.getEpisodes(),
    }),
  detail: (episodeId: string) =>
    queryOptions({
      queryKey: [...episodesQueries.all(), 'detail', episodeId] as const,
      queryFn: () => episodesAPI.getEpisode(episodeId),
    }),
}
