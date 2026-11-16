import { Match, Switch } from 'solid-js'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

const Example = () => {
  const query = useQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return 'Success'
    },
  }))

  return (
    <Switch>
      <Match when={query.isPending}>Loading...</Match>
      <Match when={query.isError}>An error has occurred!</Match>
      <Match when={query.isSuccess}>{query.data}</Match>
    </Switch>
  )
}

export default function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools />
      <Example />
    </QueryClientProvider>
  )
}
