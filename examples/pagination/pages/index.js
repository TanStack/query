import React from 'react'
import fetch from '../libs/fetch'

import { usePaginatedQuery } from 'react-query'

export default () => {
  const [page, setPage] = React.useState(0)

  const { status, resolvedData, data, error, isFetching } = usePaginatedQuery(
    ['todos', page],
    (key, page = 0) => fetch('/api/projects?page=' + page)
  )

  return (
    <div>
      {status === 'loading' ? (
        <div>Loading...</div>
      ) : status === 'error' ? (
        <div>Error: {error.message}</div>
      ) : (
        // The data from the last successful page will remain
        // available while loading other pages
        <div>
          {resolvedData.projects.map(project => (
            <p
              style={{
                border: '1px solid gray',
                borderRadius: '5px',
                padding: '.5rem',
              }}
              key={project.id}
            >
              {project.name}
            </p>
          ))}
        </div>
      )}
      <span>Current Page: {page + 1}</span>{' '}
      <button
        onClick={() => setPage(old => Math.max(old - 1, 0))}
        disabled={page === 0}
      >
        Previous Page
      </button>{' '}
      <button
        onClick={() => setPage(old => old + 1)}
        disabled={!data || !data.hasMore}
      >
        Next Page
      </button>
      {// Since the data stick around between page requests,
      // we can use `isFetching` to show a background loading
      // indicator since our `status === 'loading'` state won't be triggered
      isFetching ? <span> Loading...</span> : null}{' '}
    </div>
  )
}
