import { queryOptions } from '@tanstack/react-query'

type Episode = {
  id: number
  name: string
  air_date: string
  episode: string
  characters: Array<string>
}

type Character = {
  id: number
  name: string
  status: string
  species: string
  gender: string
  origin: { name: string; url: string }
  location: { name: string; url: string }
  episode: Array<string>
}

type Location = {
  id: number
  name: string
  type: string
}

type Paginated<T> = {
  results: Array<T>
}

const getEpisodes = async (): Promise<Paginated<Episode>> => {
  const res = await fetch('https://rickandmortyapi.com/api/episode/')
  if (!res.ok) throw new Error('Failed to fetch episodes')
  return await res.json()
}

const getEpisode = async (episodeId: string): Promise<Episode> => {
  const res = await fetch(
    `https://rickandmortyapi.com/api/episode/${episodeId}`,
  )
  if (!res.ok) throw new Error('Failed to fetch episode')
  return await res.json()
}

const getCharacters = async (): Promise<Paginated<Character>> => {
  const res = await fetch('https://rickandmortyapi.com/api/character/')
  if (!res.ok) throw new Error('Failed to fetch characters')
  return await res.json()
}

const getCharacter = async (characterId: string): Promise<Character> => {
  const res = await fetch(
    `https://rickandmortyapi.com/api/character/${characterId}`,
  )
  if (!res.ok) throw new Error('Failed to fetch character')
  return await res.json()
}

const getLocation = async (locationId: string): Promise<Location> => {
  const res = await fetch(
    `https://rickandmortyapi.com/api/location/${locationId}`,
  )
  if (!res.ok) throw new Error('Failed to fetch location')
  return await res.json()
}

export const episodesQueryOptions = queryOptions({
  queryKey: ['episodes'],
  queryFn: getEpisodes,
})

export const episodeQueryOptions = (episodeId: string) =>
  queryOptions({
    queryKey: ['episode', episodeId],
    queryFn: () => getEpisode(episodeId),
  })

export const charactersQueryOptions = queryOptions({
  queryKey: ['characters'],
  queryFn: getCharacters,
})

export const characterQueryOptions = (characterId: string) =>
  queryOptions({
    queryKey: ['character', characterId],
    queryFn: () => getCharacter(characterId),
  })

export const locationQueryOptions = (locationId: string) =>
  queryOptions({
    queryKey: ['location', locationId],
    queryFn: () => getLocation(locationId),
  })
