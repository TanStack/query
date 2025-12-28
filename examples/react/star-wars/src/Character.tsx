import { useParams, Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCharacter, getFilm, getPlanet } from './api'

export default function Character() {
  let params = useParams()
  const characterId = params.characterId!

  const { status, data } = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => getCharacter(characterId),
  })

  if (status === 'pending') return <p>Loading...</p>
  if (status === 'error') return <p>Error :(</p>

  const homeworldUrlParts = data.homeworld.split('/').filter(Boolean)
  const homeworldId = homeworldUrlParts[homeworldUrlParts.length - 1]

  return (
    <div>
      <h2 className="text-4xl">{data.name}</h2>
      <p>
        <strong>Born</strong>: {data.birth_year}
      </p>
      <p>
        <strong>Eyes</strong>: {data.eye_color}
      </p>
      <p>
        <strong>Hair</strong>: {data.hair_color}
      </p>
      <p>
        <strong>Height</strong>: {data.height}
      </p>
      <p>
        <strong>Mass</strong>: {data.mass}
      </p>
      <p>
        <strong>Homeworld</strong>: <Homeworld homeworldId={homeworldId} />
      </p>

      <h4 className="text-2xl pt-4">Films</h4>
      {data.films.map((film: any) => {
        const filmUrlParts = film.split('/').filter(Boolean)
        const filmId = filmUrlParts[filmUrlParts.length - 1]
        return <Film filmId={filmId} key={`${filmId}`} />
      })}
    </div>
  )
}

function Film({ filmId }: { filmId: string }) {
  const { data, status } = useQuery({
    queryKey: ['film', filmId],
    queryFn: () => getFilm(filmId),
  })

  if (status === 'success') {
    return (
      <RouterLink
        className="text-blue-500 hover:underline"
        to={`/films/${filmId}`}
      >
        <h6 className="text-lg">
          {data.episode_id}. {data.title}
        </h6>
      </RouterLink>
    )
  }
}

function Homeworld({ homeworldId }: { homeworldId: string }) {
  const { data, status } = useQuery({
    queryKey: ['homeworld', homeworldId],
    queryFn: () => getPlanet(homeworldId),
  })

  if (status === 'pending') return <span>Loading...</span>
  if (status === 'error') return <span>Error :(</span>

  return <span>{data.name}</span>
}
