import { AsyncBatcher } from '@tanstack/react-pacer/async-batcher'

interface CharacterT {
  id: number
  name: string
  status: string
  species: string
  type: string
  gender: string
  image: string
}

const createDeferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

type CharacterRequest = {
  deferred: ReturnType<typeof createDeferred<CharacterT | null>>
  id: number
}

// fetch function that returns characters by id
const fetchCharacters = async (ids: ReadonlyArray<number>) => {
  console.log(`Fetching characters: ${ids.join(', ')}`)

  const res = await fetch(
    `https://rickandmortyapi.com/api/character/[${ids.join(',')}]`,
  )
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

export const loadCharacter = (id: number) => {
  const deferred = createDeferred<CharacterT | null>()

  characterBatcher.addItem({ deferred, id })

  return deferred.promise
}
