import { useRoute } from 'preact-iso'
import { useQuery } from '@tanstack/preact-query'
import { charactersQueries } from './services/characters/queries'
import { episodesQueries } from './services/episodes/queries'

function Episode() {
  const { params } = useRoute()
  const episodeId = params.episodeId

  const { data, status } = useQuery(episodesQueries.detail(episodeId))

  if (status === 'pending') return <p>Loading...</p>

  if (status === 'error') return <p>Error :(</p>

  return (
    <div>
      <h2 className="text-4xl">{data.name}</h2>
      <p>{data.air_date}</p>
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

  if (status === 'pending') return <p>Loading...</p>
  if (status === 'error') return <p>Error :(</p>

  return (
    <article key={characterId}>
      <a
        className="text-blue-500 hover:underline"
        href={`/characters/${characterId}`}
      >
        <h6 className="text-lg">{data.name}</h6>
      </a>
    </article>
  )
}

export default Episode
