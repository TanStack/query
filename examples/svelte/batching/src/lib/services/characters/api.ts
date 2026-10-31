import { AsyncBatcher } from '@tanstack/svelte-pacer/async-batcher'
import type { CharacterT } from './types'

type CharacterRequest = {
  deferred: PromiseWithResolvers<CharacterT | null>
  id: number
}

// fetch function that returns characters by id
const fetchCharacters = async (ids: ReadonlyArray<number>) => {
  console.log(`Fetching characters: ${ids.join(', ')}`)

  const res = await fetch(
    `https://rickandmortyapi.com/api/character/[${ids.join(',')}]`,
  )
  if (!res.ok) throw new Error('Failed to fetch characters')
  const characters = (await res.json()) as Array<CharacterT> | CharacterT

  const characterMap = new Map<number, CharacterT>()
  for (const character of Array.isArray(characters)
    ? characters
    : [characters]) {
    characterMap.set(character.id, character)
  }

  return characterMap
}

const characterBatcher = new AsyncBatcher<CharacterRequest>(
  (requests) => fetchCharacters([...new Set(requests.map(({ id }) => id))]),
  {
    wait: 0,
    onSuccess: (charactersById, requests) => {
      for (const { deferred, id } of requests) {
        deferred.resolve(charactersById.get(id) ?? null)
      }
    },
    onError: (error, requests) => {
      for (const { deferred } of requests) {
        deferred.reject(error)
      }
    },
  },
)

export const charactersAPI = {
  getCharacter: (id: number) => {
    const deferred = Promise.withResolvers<CharacterT | null>()

    characterBatcher.addItem({ deferred, id })

    return deferred.promise
  },
}
