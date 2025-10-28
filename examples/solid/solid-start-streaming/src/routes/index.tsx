import { Title } from '@solidjs/meta'
import { queryOptions, useQuery } from '@tanstack/solid-query'
import { Suspense } from 'solid-js'

const makeQueryOptions = (key: string) =>
  queryOptions({
    queryKey: ['e2e-test-query-integration', key],
    queryFn: async () => {
      console.log('fetching query data')
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 500)
      })
      const result = 'data'
      console.log('query data result', result)
      return result
    },
    staleTime: Infinity,
  })

export default function Home() {
  const query = useQuery(() => makeQueryOptions('useQuery'))

  return (
    <main>
      <Title>Solid Query v5</Title>

      <h1>Solid Query v5</h1>

      <p>
        This demo demonstrates how Solid Query can be used in SSR, with
        streaming support. Use the links in the top left to navigate between the
        various examples.
      </p>

      <Suspense>
        <div data-testid="query-data">{query.data ?? 'loading...'}</div>
      </Suspense>
    </main>
  )
}
