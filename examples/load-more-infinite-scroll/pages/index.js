import React from 'react'
import Link from 'next/link'
import axios from 'axios'

import { useInfiniteQuery, QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'

//

import useIntersectionObserver from '../hooks/useIntersectionObserver'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}

function Example() {
  const {
    status,
    data,
    error,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
  } = useInfiniteQuery(
    'projects',
    async ({ pageParam = 0 }) => {
      const res = await axios.get('/api/projects?cursor=' + pageParam)
      return res.data
    },
    {
      getPreviousPageParam: firstPage => firstPage.previousId ?? false,
      getNextPageParam: lastPage => lastPage.nextId ?? false,
    }
  )

  const loadMoreButtonRef = React.useRef()

  useIntersectionObserver({
    target: loadMoreButtonRef,
    onIntersect: fetchNextPage,
    enabled: hasNextPage,
  })

  return (
    <div>
      <h1>Infinite Loading</h1>
      {status === 'loading' ? (
        <p>Loading...</p>
      ) : status === 'error' ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <div>
            <button
              onClick={() => fetchPreviousPage()}
              disabled={!hasPreviousPage || isFetchingPreviousPage}
            >
              {isFetchingNextPage
                ? 'Loading more...'
                : hasNextPage
                ? 'Load Older'
                : 'Nothing more to load'}
            </button>
          </div>
          {data.pages.map(page => (
            <React.Fragment key={page.nextId}>
              {page.data.map(project => (
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
              ref={loadMoreButtonRef}
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
            >
              {isFetchingNextPage
                ? 'Loading more...'
                : hasNextPage
                ? 'Load Newer'
                : 'Nothing more to load'}
            </button>
          </div>
          <div>
            {isFetching && !isFetchingNextPage
              ? 'Background Updating...'
              : null}
          </div>
        </>
      )}
      <hr />
      <Link href="/about">
        <a>Go to another page</a>
      </Link>
      <ReactQueryDevtools initialIsOpen />
    </div>
  )
}
