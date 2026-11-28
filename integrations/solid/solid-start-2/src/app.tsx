import {
  isPending,
  isError,
  isSuccess,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { Match, Switch } from 'solid-js'

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
      <Match when={isPending(query)}>Loading...</Match>
      <Match when={isError(query)}>An error has occurred!</Match>
      <Match when={isSuccess(query)}>{query.data}</Match>
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
