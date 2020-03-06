import React from 'react'
import fetch from '../libs/fetch'
import Link from 'next/link'

import { useInfiniteQuery } from 'react-query'

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
    (key, nextId = 0) => fetch('/api/projects?cursor=' + nextId),
    {
      getFetchMore: (lastGroup, allGroups) => lastGroup.nextId,
    }
  )

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
                    padding: '5rem 1rem',
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
    </div>
  )
}
