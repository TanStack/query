import React from 'react'
import fetch from '../libs/fetch'
import Link from 'next/link'

import { useQuery } from 'react-query'

export default () => {
  const {
    data,
    isLoading,
    isFetching,
    isFetchingMore,
    fetchMore,
    canFetchMore,
  } = useQuery(
    'projects',
    ({ nextId } = {}) => fetch('/api/projects?cursor=' + (nextId || 0)),
    {
      paginated: true,
      getCanFetchMore: lastPage => lastPage.nextId,
    }
  )

  const loadMore = async () => {
    try {
      const { nextId } = data[data.length - 1]

      await fetchMore({
        nextId,
      })
    } catch {}
  }

  return (
    <div>
      <h1>Pagination</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : data ? (
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
            {canFetchMore ? (
              <button onClick={loadMore} disabled={isFetchingMore}>
                {isFetchingMore ? 'Loading more...' : 'Load More'}
              </button>
            ) : (
              'Nothing more to fetch.'
            )}
          </div>
          <div>
            {isFetching && !isFetchingMore ? 'Background Updating...' : null}
          </div>
        </>
      ) : null}
      <hr />
      <Link href="/about">
        <a>Go to another page</a>
      </Link>
    </div>
  )
}
