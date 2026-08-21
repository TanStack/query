import { useParams, Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCharacter, getEpisode } from './api'

function Episode() {
  let params = useParams()
  const episodeId = params.episodeId!

  const { data, status } = useQuery({
    queryKey: ['episode', episodeId],
    queryFn: () => getEpisode(episodeId),
  })

  if (status === 'pending') return <p>Loading...</p>

  if (status === 'error') return <p>Error :(</p>

  return (
    <div>
      <h2 className="text-4xl">{data.name}</h2>
      <p>{data.air_date}</p>
      <br />
      <h4 className="text-2xl">Characters</h4>
      {data.characters.map((character: any) => {
        const characterUrlParts = character.split('/').filter(Boolean)
        const characterId = characterUrlParts[characterUrlParts.length - 1]
        return <Character characterId={characterId} key={characterId} />
      })}
    </div>
  )
}

function Character({ characterId }: { characterId: string }) {
  const { data, status } = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => getCharacter(characterId),
  })

  if (status === 'pending') return <p>Loading...</p>
  if (status === 'error') return <p>Error :(</p>

  return (
    <article key={characterId}>
      <RouterLink
        className="text-blue-500 hover:underline"
        to={`/characters/${characterId}`}
      >
        <h6 className="text-lg">{data.name}</h6>
      </RouterLink>
    </article>
  )
}

export default Episode
