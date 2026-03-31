import { Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getFilms } from './api'

export default function Films() {
  const { data, status } = useQuery({
    queryKey: ['films'],
    queryFn: () => getFilms(),
  })

  if (status === 'pending') {
    return <p>Loading...</p>
  }
  if (status === 'error') {
    return <p>Error :(</p>
  }

  return (
    <div>
      <h2 className="text-4xl">Films</h2>
      {data.results.map((film: any) => {
        const filmUrlParts = film.url.split('/').filter(Boolean)
        const filmId = filmUrlParts[filmUrlParts.length - 1]
        return (
          <article key={filmId}>
            <RouterLink
              className="text-blue-500 hover:underline"
              to={`/films/${filmId}`}
            >
              <h6 className="text-xl">
                {film.episode_id}. {film.title}{' '}
                <em>
                  ({new Date(Date.parse(film.release_date)).getFullYear()})
                </em>
              </h6>
            </RouterLink>
          </article>
        )
      })}
    </div>
  )
}
