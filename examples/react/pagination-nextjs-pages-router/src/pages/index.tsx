import React from 'react'
import {
  keepPreviousData,
  noop,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { projectsQueries } from '../services/projects/queries'

export default function Example() {
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(0)

  const { status, data, error, isFetching, isPlaceholderData } = useQuery({
    ...projectsQueries.list(page),
    placeholderData: keepPreviousData,
  })

  // Prefetch the next page!
  React.useEffect(() => {
    if (!isPlaceholderData && data?.hasMore) {
      queryClient.query(projectsQueries.list(page + 1)).catch(noop)
    }
  }, [data, isPlaceholderData, page, queryClient])

  return (
    <div>
      <p>
        In this example, each page of data remains visible as the next page is
        fetched. The buttons and capability to proceed to the next page are also
        suppressed until the next page cursor is known. Each page is cached as a
        normal query too, so when going to previous pages, you'll see them
        instantaneously while they are also refetched invisibly in the
        background.
      </p>
      {status === 'pending' ? (
        <div>Loading...</div>
      ) : status === 'error' ? (
        <div>Error: {error.message}</div>
      ) : (
        // `data` will either resolve to the latest page's data
        // or if fetching a new page, the last successful page's data
        <div>
          {data.projects.map((project) => (
            <p key={project.id}>{project.name}</p>
          ))}
        </div>
      )}
      <div>Current Page: {page + 1}</div>
      <button
        onClick={() => setPage((old) => Math.max(old - 1, 0))}
        disabled={page === 0}
      >
        Previous Page
      </button>{' '}
      <button
        onClick={() => {
          setPage((old) => (data?.hasMore ? old + 1 : old))
        }}
        disabled={isPlaceholderData || !data?.hasMore}
      >
        Next Page
      </button>
      {
        // Since the last page's data potentially sticks around between page requests,
        // we can use `isFetching` to show a background loading
        // indicator since our `status === 'pending'` state won't be triggered
        isFetching ? <span> Loading...</span> : null
      }{' '}
      <ReactQueryDevtools initialIsOpen />
    </div>
  )
}
