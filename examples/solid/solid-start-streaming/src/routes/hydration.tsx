import type { CreateQueryResult } from '@tanstack/solid-query'
import { createQuery } from '@tanstack/solid-query'
import { createSignal, Suspense } from 'solid-js'
import { fetchUser } from '~/utils/api'
import { NoHydration } from 'solid-js/web'
import { Title } from '@solidjs/meta'

export default function Hydration() {
  const query = createQuery(() => ({
    queryKey: ['user'],
    queryFn: () => fetchUser({ sleep: 500 }),
    deferStream: true,
  }))

  const [initialQueryState] = createSignal(JSON.parse(JSON.stringify(query)))

  return (
    <main>
      <Title>Solid Query - Hydration</Title>

      <h1>Solid Query - Hydration Example</h1>

      <div class="description">
        <p>
          Lists the query state as seen on the server, initial render on the
          client (right after hydration), and current client value. Ideally, if
          SSR is setup correctly, these values are exactly the same in all three
          contexts.
        </p>
      </div>

      <button onClick={() => query.refetch()}>Refetch</button>

      <table class="example example--table">
        <thead>
          <tr>
            <th>Context</th>
            <th>data.name</th>
            <th>isFetching</th>
            <th>isFetched</th>
            <th>isPending</th>
            <th>isRefetching</th>
            <th>isLoading</th>
            <th>isStale</th>
            <th>isSuccess</th>
            <th>isError</th>
            <th>error</th>
            <th>fetchStatus</th>
            <th>dataUpdatedAt</th>
          </tr>
        </thead>

        <tbody>
          <Suspense>
            <NoHydration>
              <QueryStateRow context="server" query={query} />
            </NoHydration>

            <QueryStateRow
              context="client (initial render)"
              query={initialQueryState()!}
            />

            <QueryStateRow context="client" query={query} />
          </Suspense>
        </tbody>
      </table>
    </main>
  )
}

type QueryState = CreateQueryResult<
  {
    id: string
    name: string
    queryTime: number
  },
  Error
>

const QueryStateRow = (props: { context: string; query: QueryState }) => {
  return (
    <tr>
      <td>{props.context}</td>
      <td>{props.query.data?.name}</td>
      <td>{String(props.query.isFetching)}</td>
      <td>{String(props.query.isFetched)}</td>
      <td>{String(props.query.isPending)}</td>
      <td>{String(props.query.isRefetching)}</td>
      <td>{String(props.query.isLoading)}</td>
      <td>{String(props.query.isStale)}</td>
      <td>{String(props.query.isSuccess)}</td>
      <td>{String(props.query.isError)}</td>
      <td>{String(props.query.error)}</td>
      <td>{String(props.query.fetchStatus)}</td>
      <td>{String(props.query.dataUpdatedAt)}</td>
    </tr>
  )
}
