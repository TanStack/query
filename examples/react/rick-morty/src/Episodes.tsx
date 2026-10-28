import { Link as RouterLink } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { episodesQueries } from './services/episodes/queries'

export default function Episodes() {
  const { data, status } = useQuery(episodesQueries.list())

  if (status === 'pending') {
    return <p>Loading...</p>
  }
  if (status === 'error') {
    return <p>Error :(</p>
  }

  return (
    <div>
      <h2 className="text-4xl">Episodes</h2>
      {data.results.map((episode) => (
        <article key={episode.id}>
          <RouterLink
            className="text-blue-500 hover:underline"
            to={`/episodes/${episode.id}`}
          >
            <h6 className="text-xl">
              {episode.episode} - {episode.name} <em>{episode.air_date}</em>
            </h6>
          </RouterLink>
        </article>
      ))}
    </div>
  )
}
