import {
  isFetching,
  isFetchingNextPage,
  isFetchingPreviousPage,
  useQuery,
} from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { Fragment } from 'preact'
import { projectsQueries } from './services/projects/queries'

export default function App() {
  const queryResult = useQuery(projectsQueries.infinite())

  return (
    <div>
      <h1>Infinite Query with max pages</h1>
      <h3>4 projects per page</h3>
      <h3>3 pages max</h3>
      {queryResult.status === 'pending' ? (
        <p>Loading...</p>
      ) : queryResult.status === 'error' ? (
        <span>Error: {queryResult.error.message}</span>
      ) : (
        <>
          <div>
            <button
              onClick={() => queryResult.fetchPreviousPage()}
              disabled={
                !queryResult.hasPreviousPage ||
                isFetchingPreviousPage(queryResult)
              }
            >
              {isFetchingPreviousPage(queryResult)
                ? 'Loading more...'
                : queryResult.hasPreviousPage
                  ? 'Load Older'
                  : 'Nothing more to load'}
            </button>
          </div>
          {queryResult.data.pages.map((page) => (
            <Fragment key={page.nextId}>
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
            </Fragment>
          ))}
          <div>
            <button
              onClick={() => queryResult.fetchNextPage()}
              disabled={
                !queryResult.hasNextPage || isFetchingNextPage(queryResult)
              }
            >
              {isFetchingNextPage(queryResult)
                ? 'Loading more...'
                : queryResult.hasNextPage
                  ? 'Load Newer'
                  : 'Nothing more to load'}
            </button>
          </div>
          <div>
            {isFetching(queryResult) && !isFetchingNextPage(queryResult)
              ? 'Background Updating...'
              : null}
          </div>
        </>
      )}
      <hr />
      <PreactQueryDevtools initialIsOpen />
    </div>
  )
}
