import type { Film, Paginated } from './types'

export const filmsAPI = {
  getFilms: async (): Promise<Paginated<Film>> => {
    const res = await fetch('https://swapi.dev/api/films/')
    if (!res.ok) throw new Error('Failed to fetch films')
    return await res.json()
  },
  getFilm: async (filmId: string): Promise<Film> => {
    const res = await fetch(`https://swapi.dev/api/films/${filmId}/`)
    if (!res.ok) throw new Error('Failed to fetch film')
    return await res.json()
  },
}
