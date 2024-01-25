---
id: hydration
title: hydration
---

## `dehydrate`

`dehydrate` creates a frozen representation of a `cache` that can later be hydrated with `Hydrate`, `useHydrate`, or `hydrate`. This is useful for passing prefetched queries from server to client or persisting queries to localStorage or other persistent locations. It only includes currently successful queries by default.

```js
import { dehydrate } from 'react-query'

const dehydratedState = dehydrate(queryClient, {
  shouldDehydrateQuery,
})
```

> Note: Since version `3.22.0` hydration utilities moved into to core. If you using lower version your should import `dehydrate` from `react-query/hydration`

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
  - `shouldDehydrateQuery: (query: Query) => boolean`
    - Optional
    - This function is called for each query in the cache
    - Return `true` to include this query in dehydration, or `false` otherwise
    - The default version only includes successful queries, do `shouldDehydrateQuery: () => true` to include all queries

**Returns**

- `dehydratedState: DehydratedState`
  - This includes everything that is needed to hydrate the `queryClient` at a later point
  - You **should not** rely on the exact format of this response, it is not part of the public API and can change at any time
  - This result is not in serialized form, you need to do that yourself if desired

### limitations

The hydration API requires values to be JSON serializable. If you need to dehydrate values that are not automatically serializable to JSON (like `Error` or `undefined`), you have to serialize them for yourself. Since only successful queries are included per default, to also include `Errors`, you have to provide `shouldDehydrateQuery`, e.g.:

```js
// server
const state = dehydrate(client, { shouldDehydrateQuery: () => true }) // to also include Errors
const serializedState = mySerialize(state) // transform Error instances to objects

// client
const state = myDeserialize(serializedState)  // transform objects back to Error instances
hydrate(client, state)
```

## `hydrate`

`hydrate` adds a previously dehydrated state into a `cache`. If the queries included in dehydration already exist in the queryCache, `hydrate` does not overwrite them.

```js
import { hydrate } from 'react-query'

hydrate(queryClient, dehydratedState, options)
```

> Note: Since version `3.22.0` hydration utilities moved into to core. If you using lower version your should import `hydrate` from `react-query/hydration`

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

## `useHydrate`

`useHydrate` adds a previously dehydrated state into the `queryClient` that would be returned by `useQueryClient()`. If the client already contains data, the new queries will be intelligently merged based on update timestamp.

```jsx
import { useHydrate } from 'react-query'

useHydrate(dehydratedState, options)
```

> Note: Since version `3.22.0` hydration utilities moved into to core. If you using lower version your should import `useHydrate` from `react-query/hydration`

**Options**

- `dehydratedState: DehydratedState`
  - **Required**
  - The state to hydrate
- `options: HydrateOptions`
  - Optional
  - `defaultOptions: QueryOptions`
    - The default query options to use for the hydrated queries.

## `Hydrate`

`Hydrate` wraps `useHydrate` into component. Can be useful when you need hydrate in class component or need hydrate on same level where `QueryClientProvider` rendered.

```js
import { Hydrate } from 'react-query'

function App() {
  return <Hydrate state={dehydratedState}>...</Hydrate>
}
```

> Note: Since version `3.22.0` hydration utilities moved into to core. If you using lower version your should import `Hydrate` from `react-query/hydration`

**Options**

- `state: DehydratedState`
  - The state to hydrate
- `options: HydrateOptions`
  - Optional
  - `defaultOptions: QueryOptions`
    - The default query options to use for the hydrated queries.
