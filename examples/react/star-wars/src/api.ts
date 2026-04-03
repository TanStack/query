export const getFilms = async () => {
  const res = await fetch('https://swapi.dev/api/films/')
  return await res.json()
}

export const getFilm = async (filmId: string) => {
  const res = await fetch(`https://swapi.dev/api/films/${filmId}/`)
  return await res.json()
}

export const getCharacters = async () => {
  const res = await fetch('https://swapi.dev/api/people/')
  return await res.json()
}

export const getCharacter = async (characterId: string) => {
  const res = await fetch(`https://swapi.dev/api/people/${characterId}/`)
  return await res.json()
}

export const getPlanet = async (planetId: string) => {
  const res = await fetch(`https://swapi.dev/api/planets/${planetId}/`)
  return await res.json()
}
