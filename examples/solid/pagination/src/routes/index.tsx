import {
  ErrorBoundary,
  For,
  Show,
  Suspense,
  createEffect,
  createSignal,
} from 'solid-js'
import {
  keepPreviousData,
  noop,
  useQuery,
  useQueryClient,
} from '@tanstack/solid-query'
import { projectsQueries } from '~/services/projects/queries'

export default function Example() {
  const queryClient = useQueryClient()
  const [page, setPage] = createSignal(0)

  const projectsQuery = useQuery(() => ({
    ...projectsQueries.list(page()),
    placeholderData: keepPreviousData,
    throwOnError: true,
  }))

  // Prefetch the next page!
  createEffect(() => {
    if (!projectsQuery.isPlaceholderData && projectsQuery.data?.hasMore) {
      queryClient.query(projectsQueries.list(page() + 1)).catch(noop)
    }
  })

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
      <ErrorBoundary fallback={(error) => <div>Error: {error.message}</div>}>
        <Suspense fallback={<div>Loading...</div>}>
          {
            // `data` will either resolve to the latest page's data
            // or if fetching a new page, the last successful page's data
          }
          <div>
            <For each={projectsQuery.data?.projects}>
              {(project) => <p>{project.name}</p>}
            </For>
          </div>
        </Suspense>
      </ErrorBoundary>
      <div>Current Page: {page() + 1}</div>
      <button
        onClick={() => setPage((old) => Math.max(old - 1, 0))}
        disabled={page() === 0}
      >
        Previous Page
      </button>{' '}
      <button
        onClick={() => {
          setPage((old) => (projectsQuery.data?.hasMore ? old + 1 : old))
        }}
        disabled={
          projectsQuery.isPlaceholderData || !projectsQuery.data?.hasMore
        }
      >
        Next Page
      </button>
      {
        // Since the last page's data potentially sticks around between page requests,
        // we can use `isFetching` to show a background loading
        // indicator since our `status === 'pending'` state won't be triggered
      }
      <Show when={projectsQuery.isFetching}>
        <span> Loading...</span>
      </Show>{' '}
    </div>
  )
}
