import { useQuery } from '@tanstack/preact-query'
import { filmsQueries } from './services/films/queries'

export default function Films() {
  const { data, status } = useQuery(filmsQueries.list())

  if (status === 'pending') {
    return <p>Loading...</p>
  }
  if (status === 'error') {
    return <p>Error :(</p>
  }

  return (
    <div>
      <h2 className="text-4xl">Films</h2>
      {data.results.map((film) => {
        const filmUrlParts = film.url.split('/').filter(Boolean)
        const filmId = filmUrlParts[filmUrlParts.length - 1]
        return (
          <article key={filmId}>
            <a
              className="text-blue-500 hover:underline"
              href={`/films/${filmId}`}
            >
              <h6 className="text-xl">
                {film.episode_id}. {film.title}{' '}
                <em>
                  ({new Date(Date.parse(film.release_date)).getFullYear()})
                </em>
              </h6>
            </a>
          </article>
        )
      })}
    </div>
  )
}
