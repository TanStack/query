import {
  isFetching,
  isFetchingNextPage,
  isFetchingPreviousPage,
  useQuery,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React from 'react'
import { projectsQueries } from '../services/projects/queries'

export default function Example() {
  const queryResult = useQuery(projectsQueries.infinite())
  const {
    status,
    data,
    error,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
  } = queryResult
  const fetching = isFetching(queryResult)
  const fetchingNextPage = isFetchingNextPage(queryResult)
  const fetchingPreviousPage = isFetchingPreviousPage(queryResult)

  return (
    <div>
      <h1>Infinite Query with max pages</h1>
      <h3>4 projects per page</h3>
      <h3>3 pages max</h3>
      {status === 'pending' ? (
        <p>Loading...</p>
      ) : status === 'error' ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <div>
            <button
              onClick={() => fetchPreviousPage()}
              disabled={!hasPreviousPage || fetchingPreviousPage}
            >
              {fetchingPreviousPage
                ? 'Loading more...'
                : hasPreviousPage
                  ? 'Load Older'
                  : 'Nothing more to load'}
            </button>
          </div>
          {data.pages.map((page) => (
            <React.Fragment key={page.nextId}>
              {page.data.map((project) => (
                <p
                  style={{
                    border: '1px solid gray',
                    borderRadius: '5px',
                    padding: '8px',
                    fontSize: '14px',
                    background: `hsla(${project.id * 30}, 60%, 80%, 1)`,
                  }}
                  key={project.id}
                >
                  {project.name}
                </p>
              ))}
            </React.Fragment>
          ))}
          <div>
            <button
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || fetchingNextPage}
            >
              {fetchingNextPage
                ? 'Loading more...'
                : hasNextPage
                  ? 'Load Newer'
                  : 'Nothing more to load'}
            </button>
          </div>
          <div>
            {fetching && !fetchingNextPage ? 'Background Updating...' : null}
          </div>
        </>
      )}
      <hr />
      <ReactQueryDevtools initialIsOpen />
    </div>
  )
}
