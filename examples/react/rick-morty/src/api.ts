export const getEpisodes = async () => {
  const res = await fetch('https://rickandmortyapi.com/api/episode/')
  return await res.json()
}

export const getEpisode = async (episodeId: string) => {
  const res = await fetch(
    `https://rickandmortyapi.com/api/episode/${episodeId}`,
  )
  return await res.json()
}

export const getCharacters = async () => {
  const res = await fetch('https://rickandmortyapi.com/api/character/')
  return await res.json()
}

export const getCharacter = async (characterId: string) => {
  const res = await fetch(
    `https://rickandmortyapi.com/api/character/${characterId}`,
  )
  return await res.json()
}

export const getLocation = async (locationId: string) => {
  const res = await fetch(
    `https://rickandmortyapi.com/api/location/${locationId}`,
  )
  return await res.json()
}
