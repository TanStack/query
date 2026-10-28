import { Link as RouterLink, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { filmsQueries } from './services/films/queries'
import { charactersQueries } from './services/characters/queries'
import { planetsQueries } from './services/planets/queries'

export default function Character() {
  const params = useParams()
  const characterId = params.characterId!

  const { status, data } = useQuery(charactersQueries.detail(characterId))

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
      {data.films.map((film) => {
        const filmUrlParts = film.split('/').filter(Boolean)
        const filmId = filmUrlParts[filmUrlParts.length - 1]
        return <Film filmId={filmId} key={`${filmId}`} />
      })}
    </div>
  )
}

function Film({ filmId }: { filmId: string }) {
  const { data, status } = useQuery(filmsQueries.detail(filmId))

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
  const { data, status } = useQuery(planetsQueries.detail(homeworldId))

  if (status === 'pending') return <span>Loading...</span>
  if (status === 'error') return <span>Error :(</span>

  return <span>{data.name}</span>
}
