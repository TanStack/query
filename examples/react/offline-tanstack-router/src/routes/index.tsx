import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { moviesQueries } from '../services/movies/queries'

export const Route = createFileRoute('/')({
  component: List,
})

function List() {
  const moviesQuery = useQuery(moviesQueries.list())

  if (moviesQuery.isLoading) {
    return 'Loading...'
  }

  if (moviesQuery.data) {
    return (
      <div>
        <h1>Movies</h1>
        <p>
          Try to mock offline behavior with the button in the devtools. You can
          navigate around as long as there is already data in the cache. You'll
          get a refetch as soon as you go online again.
        </p>
        <ul>
          {moviesQuery.data.movies.map((movie) => (
            <li key={movie.id}>
              <Link to="/$movieId" params={{ movieId: movie.id }}>
                {movie.title}
              </Link>
            </li>
          ))}
        </ul>
        <div>
          Updated at: {new Date(moviesQuery.data.ts).toLocaleTimeString()}
        </div>
        <div>{moviesQuery.isFetching && 'fetching...'}</div>
      </div>
    )
  }

  if (moviesQuery.isError) {
    return (
      <div>
        <h1>Couldn't load movies!</h1>
        <div>{moviesQuery.error.message}</div>
      </div>
    )
  }

  // query will be in 'idle' fetchStatus while restoring from localStorage
  return null
}
