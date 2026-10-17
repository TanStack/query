export const getEpisodes = async () => {
  const res = await fetch('https://rickandmortyapi.com/api/episode/')
  if (!res.ok) throw new Error('Failed to fetch episodes')
  return await res.json()
}

export const getEpisode = async (episodeId: string) => {
  const res = await fetch(
    `https://rickandmortyapi.com/api/episode/${episodeId}`,
  )
  if (!res.ok) throw new Error('Failed to fetch episode')
  return await res.json()
}

export const getCharacters = async () => {
  const res = await fetch('https://rickandmortyapi.com/api/character/')
  if (!res.ok) throw new Error('Failed to fetch characters')
  return await res.json()
}

export const getCharacter = async (characterId: string) => {
  const res = await fetch(
    `https://rickandmortyapi.com/api/character/${characterId}`,
  )
  if (!res.ok) throw new Error('Failed to fetch character')
  return await res.json()
}

export const getLocation = async (locationId: string) => {
  const res = await fetch(
    `https://rickandmortyapi.com/api/location/${locationId}`,
  )
  if (!res.ok) throw new Error('Failed to fetch location')
  return await res.json()
}
