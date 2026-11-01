import { For, Match, Switch } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { dogsQueries } from './services/dogs/queries'

export const DogList = () => {
  const query = useQuery(() => dogsQueries.list())

  return (
    <Switch>
      <Match when={query.status === 'pending'}>Loading...</Match>
      <Match when={query.status === 'error'}>Error!</Match>
      <Match when={query.data}>
        {(data) => (
          <div>
            <For each={Object.keys(data().message)}>
              {(dog) => <div>{dog}</div>}
            </For>
          </div>
        )}
      </Match>
    </Switch>
  )
}
