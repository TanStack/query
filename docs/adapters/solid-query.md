---
title: Solid Query (Coming Soon)
---

The `@tanstack/solid-query` package offers a 1st-class API for using TanStack Query via Solid. However, all of the primitives you receive from this API are core APIs that are shared across all of the TanStack Adapters including the Query Client, query results, query subscriptions, etc.

## Example

```tsx
import { QueryClient, QueryClientProvider, createQuery } from '@tanstack/solid-query'
import { For } from 'solid-js'

const queryClient = new QueryClient()

function Example() {
  const query = createQuery(() => ['todos'], fetchTodos)

  return (
    <div>
      {query.isLoading ? (
        'Loading...'
      ) : query.isError ? (
        'Error!'
      ) : query.data ? (
        <For each={query.data}>{(todo) => <div>{todo.title}</div>}</For>
      ) : null}
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

## Important Differences with React Query

In general solid query follows the same API as React Query, but there are some important differences to be aware of. Keep these in mind as you read the tanstack query documentation.

- Solid Query does not support server side rendering yet! Please reach out in the solid query channel on the tanstack query discord if you would like to help contribute to solid query's SSR support.

- Exports follow the solid naming convention `createX` instead of `useX` *unless* the export is used to access `context`. For example, `useQuery` becomes `createQuery`, `useMutation` becomes `createMutation`, but `useQueryClient` is `useQueryClient` because it accesses the `client` from the `QueryClientProvider` context.

- Query keys passed to `createQuery` and `createQueries` are Accessor functions which return arrays. This change makes it easy to implement reactive query keys.

```tsx
// ❌ react version
useQuery(["todos"], fetchTodos)

// ✅ solid version
createQuery(() => ["todos"], fetchTodos)
```

> Mutation keys are not accessors. Why? Because it is impossible to differentiate the `createMutation` overloads `createMutation(mutationFn, options)` and `createMutation(mutationKey, options)` if the mutation key is an accessor function.
> If you need reactivity in a mutation key you can pass the mutation key as an option with an object getter.
> ```tsx
> createMutation(updateTodos, {
>   // ✅ reactive mutation key passed as an object getter
>   get mutationKey() {
>     return ["todos"]
>   }
> })
> ```

- Solid Query does not export a `QueryErrorResetBoundary`. Instead wrap your components in a solid `<ErrorBoundary>`.

- `createQuery` does not support destructuring outside of a reactive context. The return value of `createQuery` is a store, and accessing values in the store is only reactive in a reactive context.

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
      {query.isLoading ? (
        'Loading...'
      ) : query.isError ? (
        'Error!'
      ) : query.data ? (
        <For each={query.data}>{(todo) => <div>{todo.title}</div>}</For>
      ) : null}
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

- You do not need to provide `suspense: true` to query options. Suspense works for queries out of the box if you access the query data in a `<Suspense>` context.


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

- Property tracking is handled through solid's fine grained reactivity, so `notifyOnChange` options are not used.