import { queryOptions } from '@tanstack/svelte-query'

type Film = {
  title: string
  episode_id: number
  opening_crawl: string
  release_date: string
  characters: Array<string>
  url: string
}

type Character = {
  name: string
  height: string
  mass: string
  hair_color: string
  eye_color: string
  birth_year: string
  homeworld: string
  films: Array<string>
  url: string
}

type Planet = {
  name: string
}

type Paginated<T> = {
  results: Array<T>
}

const getFilms = async (): Promise<Paginated<Film>> => {
  const res = await fetch('https://swapi.dev/api/films/')
  if (!res.ok) throw new Error('Failed to fetch films')
  return await res.json()
}

const getFilm = async (filmId: string): Promise<Film> => {
  const res = await fetch(`https://swapi.dev/api/films/${filmId}/`)
  if (!res.ok) throw new Error('Failed to fetch film')
  return await res.json()
}

const getCharacters = async (): Promise<Paginated<Character>> => {
  const res = await fetch('https://swapi.dev/api/people/')
  if (!res.ok) throw new Error('Failed to fetch characters')
  return await res.json()
}

const getCharacter = async (characterId: string): Promise<Character> => {
  const res = await fetch(`https://swapi.dev/api/people/${characterId}/`)
  if (!res.ok) throw new Error('Failed to fetch character')
  return await res.json()
}

const getPlanet = async (planetId: string): Promise<Planet> => {
  const res = await fetch(`https://swapi.dev/api/planets/${planetId}/`)
  if (!res.ok) throw new Error('Failed to fetch planet')
  return await res.json()
}

export const filmsQueryOptions = queryOptions({
  queryKey: ['films'],
  queryFn: getFilms,
})

export const filmQueryOptions = (filmId: string) =>
  queryOptions({
    queryKey: ['film', filmId],
    queryFn: () => getFilm(filmId),
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

export const homeworldQueryOptions = (homeworldId: string) =>
  queryOptions({
    queryKey: ['homeworld', homeworldId],
    queryFn: () => getPlanet(homeworldId),
  })
