export const getFilms = async () => {
  const res = await fetch('https://swapi.dev/api/films/')
  if (!res.ok) throw new Error('Failed to fetch films')
  return await res.json()
}

export const getFilm = async (filmId: string) => {
  const res = await fetch(`https://swapi.dev/api/films/${filmId}/`)
  if (!res.ok) throw new Error('Failed to fetch film')
  return await res.json()
}

export const getCharacters = async () => {
  const res = await fetch('https://swapi.dev/api/people/')
  if (!res.ok) throw new Error('Failed to fetch characters')
  return await res.json()
}

export const getCharacter = async (characterId: string) => {
  const res = await fetch(`https://swapi.dev/api/people/${characterId}/`)
  if (!res.ok) throw new Error('Failed to fetch character')
  return await res.json()
}

export const getPlanet = async (planetId: string) => {
  const res = await fetch(`https://swapi.dev/api/planets/${planetId}/`)
  if (!res.ok) throw new Error('Failed to fetch planet')
  return await res.json()
}
