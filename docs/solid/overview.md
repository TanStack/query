---
id: overview
title: Solid Query 
---

The `@tanstack/solid-query` package provides a 1st-class API for using TanStack Query with SolidJS. 

## Example

```tsx
import { QueryClient, QueryClientProvider, createQuery } from '@tanstack/solid-query'
import { Switch, Match, For } from 'solid-js'

const queryClient = new QueryClient()

function Example() {
  const query = createQuery(() => ['todos'], fetchTodos)

  return (
    <div>
      <Switch>
        <Match when={query.isLoading}>
          <p>Loading...</p>
        </Match>
        <Match when={query.isError}>
          <p>Error: {query.error.message}</p>
        </Match>
        <Match when={query.isSuccess}>
          <For each={query.data}>
            {(todo) => <p>{todo.title}</p>}
          </For>
        </Match>
      </Switch>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}

```

## Available Functions

Solid Query offers useful primitives and functions that will make managing server state in SolidJS apps easier.

- `createQuery`
- `createQueries`
- `createInfiniteQueries`
- `createMutation`
- `useIsFetching`
- `useIsMutating`
- `useQueryClient`
- `QueryClient`
- `QueryClientProvider`




## Important Differences between Solid Query & React Query

Solid Query offers an API similar to  React Query, but there are some key differences to be mindful of.

- To maintain their reactivity, Query keys need to be wrapped inside a function while using `createQuery`, `createQueries`, `createInfiniteQuery` and `useIsFetching`.

```tsx
// ❌ react version
useQuery(["todos", todo], fetchTodos)

// ✅ solid version
createQuery(() => ["todos", todo()], fetchTodos)
```

- Suspense works for queries out of the box if you access the query data inside a `<Suspense>` boundary.

```tsx
import { For, Suspense } from 'solid-js'

function Example() {
  const query = createQuery(() => ['todos'], fetchTodos)
  return (
    <div>
      {/* ✅ Will trigger loading fallback, data accessed in a suspense context. */}
      <Suspense fallback={"Loading..."}>
        <For each={query.data}>{(todo) => <div>{todo.title}</div>}</For>
      </Suspense>
      {/* ❌ Will not trigger loading fallback, data not accessed in a suspense context. */}
      <For each={query.data}>{(todo) => <div>{todo.title}</div>}</For>
    </div>
  )
}
```

- Solid Query primitives (`createX`) do not support destructuring. The return value from these functions is a store, and their properties are only tracked in a reactive context.

```tsx
import { QueryClient, QueryClientProvider, createQuery } from '@tanstack/solid-query'
import { Match, Switch } from 'solid-js'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}

function Example() {
  // ❌ react version -- supports destructing outside reactive context
  // const { isLoading, error, data } = useQuery(['repoData'], () =>
  //   fetch('https://api.github.com/repos/tannerlinsley/react-query').then(res =>
  //     res.json()
  //   )
  // )

  // ✅ solid version -- does not support destructuring outside reactive context
  const query = createQuery(
    () => ['repoData'],
    () =>
      fetch('https://api.github.com/repos/tannerlinsley/react-query').then(
        (res) => res.json(),
      ),
  )

  // ✅ access query properties in JSX reactive context
  return (
    <Switch>
      <Match when={query.isLoading}>Loading...</Match>
      <Match when={query.isError}>Error: {query.error.message}</Match>
      <Match when={query.isSuccess}>
        <div>
          <h1>{query.data.name}</h1>
          <p>{query.data.description}</p>
          <strong>👀 {query.data.subscribers_count}</strong>{' '}
          <strong>✨ {query.data.stargazers_count}</strong>{' '}
          <strong>🍴 {query.data.forks_count}</strong>
        </div>
      </Match>
    </Switch>
  )
}
```

- If you want options to be reactive you need to pass them using object getter syntax. This may look strange at first but it leads to more idiomatic solid code.

```tsx
import {
  QueryClient,
  QueryClientProvider,
  createQuery,
} from '@tanstack/solid-query'
import { createSignal, For } from 'solid-js'

const queryClient = new QueryClient()

function Example() {
  const [enabled, setEnabled] = createSignal(false)
  const query = createQuery(() => ['todos'], fetchTodos, {
    // ❌ passing a signal directly is not reactive
    // enabled: enabled(),

    // ✅ passing a function that returns a signal is reactive
    get enabled() {
      return enabled()
    },
  })

  return (
    <div>
      <Switch>
        <Match when={query.isLoading}>
          <p>Loading...</p>
        </Match>
        <Match when={query.isError}>
          <p>Error: {query.error.message}</p>
        </Match>
        <Match when={query.isSuccess}>
          <For each={query.data}>
            {(todo) => <p>{todo.title}</p>}
          </For>
        </Match>
      </Switch>
      <button onClick={() => setEnabled(!enabled())}>Toggle enabled</button>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}
```

- Errors can be caught and reset using SolidJS' native `ErrorBoundary` component. `QueryErrorResetBoundary` is not needed with Solid Query

- Since Property tracking is handled through Solid's fine grained reactivity, options like `notifyOnChangeProps` are not needed