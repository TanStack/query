import {
  isFetching,
  isFetchingNextPage,
  isFetchingPreviousPage,
  useQuery,
} from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { Fragment } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { projectsQueries } from './services/projects/queries'

export default function Example() {
  const ref = useRef<HTMLButtonElement>(null)
  const [inView, setInView] = useState(false)

  const queryResult = useQuery(projectsQueries.infinite())

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
    })
    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [queryResult.status])

  useEffect(() => {
    if (inView && queryResult.hasNextPage && !isFetchingNextPage(queryResult)) {
      queryResult.fetchNextPage()
    }
  }, [
    inView,
    queryResult.hasNextPage,
    isFetchingNextPage(queryResult),
    queryResult.fetchNextPage,
  ])

  return (
    <div>
      <h1>Infinite Loading</h1>
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
                    padding: '10rem 1rem',
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
              ref={ref}
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
      <a href="/about">Go to another page</a>
      <PreactQueryDevtools initialIsOpen />
    </div>
  )
}
