import { useParams, Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getFilm, getCharacter } from './api'

export default function Film() {
  let params = useParams()
  const filmId = params.filmId!

  const { data, status } = useQuery({
    queryKey: ['film', filmId],
    queryFn: () => getFilm(filmId),
  })

  if (status === 'pending') return <p>Loading...</p>

  if (status === 'error') return <p>Error :(</p>

  return (
    <div>
      <h2 className="text-4xl">{data.title}</h2>
      <p>{data.opening_crawl}</p>
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

  if (status !== 'success') {
    return null
  }

  return (
    <RouterLink
      className="text-blue-500 hover:underline"
      to={`/characters/${characterId}`}
    >
      <h6 className="text-lg">{data.name}</h6>
    </RouterLink>
  )
}
