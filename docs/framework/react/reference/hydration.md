---
id: hydration
title: hydration
---

## `dehydrate`

`dehydrate` creates a frozen representation of a `cache` that can later be hydrated with `Hydrate`, `useHydrate`, or `hydrate`. This is useful for passing prefetched queries from server to client or persisting queries to localStorage or other persistent locations. It only includes currently successful queries by default.

```tsx
import { dehydrate } from '@tanstack/react-query'

const dehydratedState = dehydrate(queryClient, {
  shouldDehydrateQuery,
})
```

**Options**

- `client: QueryClient`
  - **Required**
  - The `queryClient` that should be dehydrated
- `options: DehydrateOptions`
  - Optional
  - `dehydrateMutations: boolean`
    - Optional
    - Whether or not to dehydrate mutations.
  - `dehydrateQueries: boolean`
    - Optional
    - Whether or not to dehydrate queries.
  - `shouldDehydrateMutation: (mutation: Mutation) => boolean`
    - Optional
    - This function is called for each mutation in the cache
    - Return `true` to include this mutation in dehydration, or `false` otherwise
    - The default version only includes paused mutations
    - If you would like to extend the function while retaining the previous behavior, import and execute `defaultShouldDehydrateMutation` as part of the return statement
  - `shouldDehydrateQuery: (query: Query) => boolean`
    - Optional
    - This function is called for each query in the cache
    - Return `true` to include this query in dehydration, or `false` otherwise
    - The default version only includes successful queries, do `shouldDehydrateQuery: () => true` to include all queries
    - If you would like to extend the function while retaining the previous behavior, import and execute `defaultShouldDehydrateQuery` as part of the return statement

**Returns**

- `dehydratedState: DehydratedState`
  - This includes everything that is needed to hydrate the `queryClient` at a later point
  - You **should not** rely on the exact format of this response, it is not part of the public API and can change at any time
  - This result is not in serialized form, you need to do that yourself if desired

### limitations

Some storage systems (such as browser [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)) require values to be JSON serializable. If you need to dehydrate values that are not automatically serializable to JSON (like `Error` or `undefined`), you have to serialize them for yourself. Since only successful queries are included per default, to also include `Errors`, you have to provide `shouldDehydrateQuery`, e.g.:

```tsx
// server
const state = dehydrate(client, { shouldDehydrateQuery: () => true }) // to also include Errors
const serializedState = mySerialize(state) // transform Error instances to objects

// client
const state = myDeserialize(serializedState) // transform objects back to Error instances
hydrate(client, state)
```

## `hydrate`

`hydrate` adds a previously dehydrated state into a `cache`.

```tsx
import { hydrate } from '@tanstack/react-query'

hydrate(queryClient, dehydratedState, options)
```

**Options**

- `client: QueryClient`
  - **Required**
  - The `queryClient` to hydrate the state into
- `dehydratedState: DehydratedState`
  - **Required**
  - The state to hydrate into the client
- `options: HydrateOptions`
  - Optional
  - `defaultOptions: DefaultOptions`
    - Optional
    - `mutations: MutationOptions` The default mutation options to use for the hydrated mutations.
    - `queries: QueryOptions` The default query options to use for the hydrated queries.
  - `context?: React.Context<QueryClient | undefined>`
    - Use this to use a custom React Query context. Otherwise, `defaultContext` will be used.

### Limitations

If the queries included in dehydration already exist in the queryCache, `hydrate` does not overwrite them and they will be **silently** discarded.

[//]: # 'useHydrate'

## `useHydrate`

`useHydrate` adds a previously dehydrated state into the `queryClient` that would be returned by `useQueryClient()`. If the client already contains data, the new queries will be intelligently merged based on update timestamp.

```tsx
import { useHydrate } from '@tanstack/react-query'

useHydrate(dehydratedState, options)
```

**Options**

- `dehydratedState: DehydratedState`
  - **Required**
  - The state to hydrate
- `options: HydrateOptions`
  - Optional
  - `defaultOptions: QueryOptions`
    - The default query options to use for the hydrated queries.
  - `context?: React.Context<QueryClient | undefined>`
    - Use this to use a custom React Query context. Otherwise, `defaultContext` will be used.

[//]: # 'useHydrate'
[//]: # 'Hydrate'

## `Hydrate`

`Hydrate` wraps `useHydrate` into component. Can be useful when you need hydrate in class component or need hydrate on same level where `QueryClientProvider` rendered.

```tsx
import { Hydrate } from '@tanstack/react-query'

function App() {
  return <Hydrate state={dehydratedState}>...</Hydrate>
}
```

**Options**

- `state: DehydratedState`
  - The state to hydrate
- `options: HydrateOptions`
  - Optional
  - `defaultOptions: QueryOptions`
    - The default query options to use for the hydrated queries.
  - `context?: React.Context<QueryClient | undefined>`
    - Use this to use a custom React Query context. Otherwise, `defaultContext` will be used.

[//]: # 'Hydrate'
