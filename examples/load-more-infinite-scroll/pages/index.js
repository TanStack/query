import React from 'react'
import Link from 'next/link'
import axios from 'axios'

import { useInfiniteQuery } from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'

//

import useIntersectionObserver from '../hooks/useIntersectionObserver'

export default () => {
  const {
    status,
    data,
    error,
    isFetching,
    isFetchingMore,
    fetchMore,
    canFetchMore,
  } = useInfiniteQuery(
    'projects',
    async (key, nextId = 0) => {
      const { data } = await axios.get('/api/projects?cursor=' + nextId)
      return data
    },
    {
      getFetchMore: lastGroup => lastGroup.nextId,
    }
  )

  const loadMoreButtonRef = React.useRef()

  useIntersectionObserver({
    target: loadMoreButtonRef,
    onIntersect: fetchMore,
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
          {data.map((page, i) => (
            <React.Fragment key={i}>
              {page.data.map(project => (
                <p
                  style={{
                    border: '1px solid gray',
                    borderRadius: '5px',
                    padding: '10rem 1rem',
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
              onClick={() => fetchMore()}
              disabled={!canFetchMore || isFetchingMore}
            >
              {isFetchingMore
                ? 'Loading more...'
                : canFetchMore
                ? 'Load More'
                : 'Nothing more to load'}
            </button>
          </div>
          <div>
            {isFetching && !isFetchingMore ? 'Background Updating...' : null}
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
