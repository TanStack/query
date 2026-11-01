import type { Episode, Paginated } from './types'

export const episodesAPI = {
  getEpisodes: async (): Promise<Paginated<Episode>> => {
    const res = await fetch('https://rickandmortyapi.com/api/episode/')
    if (!res.ok) throw new Error('Failed to fetch episodes')
    return await res.json()
  },
  getEpisode: async (episodeId: string): Promise<Episode> => {
    const res = await fetch(
      `https://rickandmortyapi.com/api/episode/${episodeId}`,
    )
    if (!res.ok) throw new Error('Failed to fetch episode')
    return await res.json()
  },
}
