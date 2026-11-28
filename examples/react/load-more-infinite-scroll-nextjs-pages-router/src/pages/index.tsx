import {
  isFetching,
  isFetchingNextPage,
  isFetchingPreviousPage,
  useQuery,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import Link from 'next/link'
import React from 'react'
import { useInView } from 'react-intersection-observer'
import { projectsQueries } from '../services/projects/queries'

export default function Example() {
  const { ref, inView } = useInView()

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

  React.useEffect(() => {
    if (inView && hasNextPage && !fetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchingNextPage, fetchNextPage])

  return (
    <div>
      <h1>Infinite Loading</h1>
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
                    padding: '10rem 1rem',
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
              ref={ref}
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
      <Link href="/about">Go to another page</Link>
      <ReactQueryDevtools initialIsOpen />
    </div>
  )
}
