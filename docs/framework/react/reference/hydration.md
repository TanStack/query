---
id: hydration
title: hydration
---

## `dehydrate`

`dehydrate` creates a frozen representation of a `cache` that can later be hydrated with `HydrationBoundary` or `hydrate`. This is useful for passing prefetched queries from server to client or persisting queries to localStorage or other persistent locations. It only includes currently successful queries by default.

```tsx
import { dehydrate } from '@tanstack/react-query'

const dehydratedState = dehydrate(queryClient, {
  shouldDehydrateQuery,
  shouldDehydrateMutation,
})
```

**Options**

- `client: QueryClient`
  - **Required**
  - The `queryClient` that should be dehydrated
- `options: DehydrateOptions`
  - Optional
  - `shouldDehydrateMutation: (mutation: Mutation) => boolean`
    - Optional
    - Whether to dehydrate mutations.
    - The function is called for each mutation in the cache
      - Return `true` to include this mutation in dehydration, or `false` otherwise
    - Defaults to only including paused mutations
    - If you would like to extend the function while retaining the default behavior, import and execute `defaultShouldDehydrateMutation` as part of the return statement
  - `shouldDehydrateQuery: (query: Query) => boolean`
    - Optional
    - Whether to dehydrate queries.
    - The function is called for each query in the cache
      - Return `true` to include this query in dehydration, or `false` otherwise
    - Defaults to only including successful queries
    - If you would like to extend the function while retaining the default behavior, import and execute `defaultShouldDehydrateQuery` as part of the return statement
  - `serializeData?: (data: any) => any` A function to transform (serialize) data during dehydration.
  - `shouldRedactErrors?: (error: unknown) => boolean`
    - Optional
    - Whether to redact errors from the server during dehydration.
    - The function is called for each error in the cache
      - Return `true` to redact this error, or `false` otherwise
    - Defaults to redacting all errors

**Returns**

- `dehydratedState: DehydratedState`
  - This includes everything that is needed to hydrate the `queryClient` at a later point
  - You **should not** rely on the exact format of this response, it is not part of the public API and can change at any time
  - This result is not in serialized form, you need to do that yourself if desired

### Limitations

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
    - `deserializeData?: (data: any) => any` A function to transform (deserialize) data before it is put into the cache.
  - `queryClient?: QueryClient`,
    - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.

### Limitations

If the queries you're trying to hydrate already exist in the queryCache, `hydrate` will only overwrite them if the data is newer than the data present in the cache. Otherwise, it will **not** get applied.

[//]: # 'HydrationBoundary'

## `HydrationBoundary`

`HydrationBoundary` adds a previously dehydrated state into the `queryClient` that would be returned by `useQueryClient()`. If the client already contains data, the new queries will be intelligently merged based on update timestamp.

```tsx
import { HydrationBoundary } from '@tanstack/react-query'

function App() {
  return <HydrationBoundary state={dehydratedState}>...</HydrationBoundary>
}
```

> Note: Only `queries` can be dehydrated with an `HydrationBoundary`.

**Options**

- `state: DehydratedState`
  - The state to hydrate
- `options: HydrateOptions`
  - Optional
  - `defaultOptions: QueryOptions`
    - The default query options to use for the hydrated queries.
  - `queryClient?: QueryClient`,
    - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.

[//]: # 'HydrationBoundary'
