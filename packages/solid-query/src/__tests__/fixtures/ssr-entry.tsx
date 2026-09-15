import { Match, Suspense, Switch } from 'solid-js'
import { renderToStringAsync } from 'solid-js/web'
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useQuery,
} from '../../index'

const QUERY_NAME = 'shell-data'
const QUERY_SLUG = '/'
export const expectedQueryResult = `ok: ${QUERY_SLUG}`
export const initialQueryResult = 'initial data'
export const successLabel = 'Success:'

export function getCoverage() {
  return Reflect.get(globalThis, '__VITEST_COVERAGE__')
}

export async function render() {
  const queryClient = new QueryClient()
  let queryFnCalls = 0
  const getOptions = (slug: string) =>
    queryOptions({
      queryKey: [QUERY_NAME, slug],
      queryFn: () => {
        queryFnCalls += 1
        return Promise.resolve(`ok: ${slug}`)
      },
    })

  function Page() {
    const query = useQuery(() => getOptions(QUERY_SLUG))

    return (
      <Switch>
        <Match when={query.isPending}>PENDING</Match>
        <Match when={query.isError}>ERROR</Match>
        <Match when={query.isSuccess}>
          {successLabel} {query.data}
        </Match>
      </Switch>
    )
  }

  try {
    const markup = await renderToStringAsync(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="LOADING">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    return { markup, queryFnCalls }
  } finally {
    queryClient.clear()
  }
}

export async function renderWithInitialData() {
  const queryClient = new QueryClient()
  let queryFnCalls = 0

  function Page() {
    const query = useQuery(() => ({
      queryKey: [QUERY_NAME, 'initial'],
      queryFn: () => {
        queryFnCalls += 1
        return Promise.resolve(expectedQueryResult)
      },
      initialData: initialQueryResult,
    }))

    return query.isSuccess ? `${successLabel} ${query.data}` : 'PENDING'
  }

  try {
    const markup = await renderToStringAsync(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="LOADING">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    return { markup, queryFnCalls }
  } finally {
    queryClient.clear()
  }
}
