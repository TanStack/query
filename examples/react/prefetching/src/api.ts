import { queryOptions, skipToken } from '@tanstack/react-query'

export type Character = {
  id: number
  name: string
  status: string
  species: string
  gender: string
  origin: { name: string }
}

const getCharacters = async (): Promise<{
  results: Array<Character>
}> => {
  await new Promise((r) => setTimeout(r, 500))
  const response = await fetch('https://rickandmortyapi.com/api/character/')
  if (!response.ok) throw new Error('Failed to fetch characters')
  return await response.json()
}

const getCharacter = async (selectedChar: number): Promise<Character> => {
  await new Promise((r) => setTimeout(r, 500))
  const response = await fetch(
    `https://rickandmortyapi.com/api/character/${selectedChar}`,
  )
  if (!response.ok) throw new Error('Failed to fetch character')
  return await response.json()
}

export const charactersQueryOptions = queryOptions({
  queryKey: ['characters'],
  queryFn: getCharacters,
})

export const characterQueryOptions = (id: number | undefined) =>
  queryOptions({
    queryKey: ['character', id],
    queryFn: id ? () => getCharacter(id) : skipToken,
  })
