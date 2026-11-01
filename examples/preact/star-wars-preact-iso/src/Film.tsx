import { useRoute } from 'preact-iso'
import { useQuery } from '@tanstack/preact-query'
import { filmsQueries } from './services/films/queries'
import { charactersQueries } from './services/characters/queries'

export default function Film() {
  const { filmId } = useRoute().params

  const { data, status } = useQuery(filmsQueries.detail(filmId))

  if (!filmId) {
    return <p>Invalid film ID</p>
  }

  if (status === 'pending') return <p>Loading...</p>

  if (status === 'error') return <p>Error :(</p>

  return (
    <div>
      <h2 className="text-4xl">{data.title}</h2>
      <p>{data.opening_crawl}</p>
      <br />
      <h4 className="text-2xl">Characters</h4>
      {data.characters.map((character) => {
        const characterUrlParts = character.split('/').filter(Boolean)
        const characterId = characterUrlParts[characterUrlParts.length - 1]
        return <Character characterId={characterId} key={characterId} />
      })}
    </div>
  )
}

function Character({ characterId }: { characterId: string }) {
  const { data, status } = useQuery(charactersQueries.detail(characterId))

  if (status !== 'success') {
    return null
  }

  return (
    <a
      className="text-blue-500 hover:underline"
      href={`/characters/${characterId}`}
    >
      <h6 className="text-lg">{data.name}</h6>
    </a>
  )
}
