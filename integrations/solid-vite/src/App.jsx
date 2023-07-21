import { Match, Switch } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'

export const App = () => {
  const query = createQuery(() => ({
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

export default App
