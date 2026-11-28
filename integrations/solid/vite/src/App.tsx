import { isPending, isError, isSuccess, useQuery } from '@tanstack/solid-query'
import { Match, Switch } from 'solid-js'

const App = () => {
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

export default App
