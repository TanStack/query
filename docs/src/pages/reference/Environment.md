---
id: Environment
title: Environment
---

## `Environment`

The `Environment` bundles together the configuration and differrent type of caches.

```js
import { Environment, QueryCache, MutationCache } from 'react-query'

const environment = new Environment({
  queryCache: new QueryCache(),
  mutationCache: new MutationCache(), // optional
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
})

await prefetchQuery(environment, {
  queryKey: 'posts',
  queryFn: fetchPosts,
})
```

Its available methods are:

- [`getDefaultOptions`](#environmentsetdefaultoptions)
- [`setDefaultOptions`](#environmentgetdefaultoptions)
- [`setQueryDefaults`](#environmentsetquerydefaults)
- [`setMutationDefaults`](#environmentsetmutationdefaults)
- [`clear`](#environmentclear)

**Options**

- `queryCache: QueryCache`
  - The query cache this client is connected to.
- `mutationCache?: MutationCache`
  - The mutation cache this client is connected to.
- `defaultOptions?: DefaultOptions`
  - Optional
  - Define defaults for all queries and mutations using this environment.

## `environment.getDefaultOptions`

The `getDefaultOptions` method returns the default options which have been set when creating the client or with `setDefaultOptions`.

```js
const defaultOptions = environment.getDefaultOptions()
```

## `environment.setDefaultOptions`

The `setDefaultOptions` method can be used to dynamically set the default options for this environment.

```js
environment.setDefaultOptions({
  queries: {
    staleTime: Infinity,
  },
})
```

## `environment.setQueryDefaults`

`setQueryDefaults` is a synchronous method to set default options for specific queries:

```js
environment.setQueryDefaults('posts', { queryFn: fetchPosts })

function Component() {
  const { data } = useQuery('posts')
}
```

**Options**

- `queryKey: QueryKey`: [Query Keys](../guides/query-keys)
- `options: QueryOptions`

## `environment.setMutationDefaults`

`setMutationDefaults` is a synchronous method to set default options for specific mutations:

```js
environment.setMutationDefaults('addPost', { mutationFn: addPost })

function Component() {
  const { data } = useMutation('addPost')
}
```

**Options**

- `mutationKey: string | unknown[]`
- `options: MutationOptions`

## `environment.clear`

`clear` is a synchronous method to clear all caches.
