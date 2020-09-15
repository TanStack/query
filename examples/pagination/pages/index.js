import React from 'react'
import axios from 'axios'
import {
  usePaginatedQuery,
  useQueryCache,
  QueryCache,
  ReactQueryCacheProvider,
} from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'

const queryCache = new QueryCache()

export default function App() {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <Example />
    </ReactQueryCacheProvider>
  )
}

function Example() {
  const cache = useQueryCache()
  const [page, setPage] = React.useState(0)

  const fetchProjects = React.useCallback(async (key, page = 0) => {
    const { data } = await axios.get('/api/projects?page=' + page)
    return data
  }, [])

  const {
    status,
    resolvedData,
    latestData,
    error,
    isFetching,
  } = usePaginatedQuery(['projects', page], fetchProjects, {})

  // Prefetch the next page!
  React.useEffect(() => {
    if (latestData?.hasMore) {
      cache.prefetchQuery(['projects', page + 1], fetchProjects)
    }
  }, [latestData, fetchProjects, page])

  return (
    <div>
      <p>
        In this example, each page of data remains visible as the next page is
        fetched. The buttons and capability to proceed to the next page are also
        supressed until the next page cursor is known. Each page is cached as a
        normal query too, so when going to previous pages, you'll see them
        instantaneously while they are also refetched invisibly in the
        background.
      </p>
      {status === 'loading' ? (
        <div>Loading...</div>
      ) : status === 'error' ? (
        <div>Error: {error.message}</div>
      ) : (
        // `resolvedData` will either resolve to the latest page's data
        // or if fetching a new page, the last successful page's data
        <div>
          {resolvedData.projects.map(project => (
            <p key={project.id}>{project.name}</p>
          ))}
        </div>
      )}
      <span>Current Page: {page + 1}</span>
      <button
        onClick={() => setPage(old => Math.max(old - 1, 0))}
        disabled={page === 0}
      >
        Previous Page
      </button>{' '}
      <button
        onClick={() =>
          // Here, we use `latestData` so the Next Page
          // button isn't relying on potentially old data
          setPage(old => (!latestData || !latestData.hasMore ? old : old + 1))
        }
        disabled={!latestData || !latestData.hasMore}
      >
        Next Page
      </button>
      {
        // Since the last page's data potentially sticks around between page requests,
        // we can use `isFetching` to show a background loading
        // indicator since our `status === 'loading'` state won't be triggered
        isFetching ? <span> Loading...</span> : null
      }{' '}
      <ReactQueryDevtools initialIsOpen />
    </div>
  )
}
