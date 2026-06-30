import Dataloader from 'dataloader'

interface CharacterT {
  id: number
  name: string
  status: string
  species: string
  type: string
  gender: string
  image: string
}

// fetch function that returns characters in request order
const fetchCharacters = async (ids: ReadonlyArray<number>) => {
  console.log(`Fetching characters: ${ids.join(', ')}`)

  const res = await fetch(
    `https://rickandmortyapi.com/api/character/[${ids.join(',')}]`,
  )
  const characters = (await res.json()) as Array<CharacterT>

  // dataloader requires that we return characters in the same order as requested
  // so we create a map to pick characters in O(n) time
  const characterMap = new Map<number, CharacterT>()
  for (const character of characters) {
    characterMap.set(character.id, character)
  }

  // map over ids array and pick the characters in order
  // null indicates not found
  return ids.map((id) => characterMap.get(id) ?? null)
}

// Singleton characterLoader
//
export const characterLoader = new Dataloader(fetchCharacters, {
  cache: false, // <-- IMPORTANT, dataloader doesn't have the same cache management as react-query
})
