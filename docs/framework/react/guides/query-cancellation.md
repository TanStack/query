---
id: query-cancellation
title: Query Cancellation
---

TanStack Query provides each query function with an [`AbortSignal` instance](https://developer.mozilla.org/docs/Web/API/AbortSignal). When a query becomes out-of-date or inactive, this `signal` will become aborted. This means that all queries are cancellable, and you can respond to the cancellation inside your query function if desired. The best part about this is that it allows you to continue to use normal async/await syntax while getting all the benefits of automatic cancellation.

The `AbortController` API is available in [most runtime environments](https://developer.mozilla.org/docs/Web/API/AbortController#browser_compatibility), but if your runtime environment does not support it, you will need to provide a polyfill. There are [several available](https://www.npmjs.com/search?q=abortcontroller%20polyfill).

## Default behavior

By default, queries that unmount or become unused before their promises are resolved are _not_ cancelled. This means that after the promise has resolved, the resulting data will be available in the cache. This is helpful if you've started receiving a query, but then unmount the component before it finishes. If you mount the component again and the query has not been garbage collected yet, data will be available.

However, if you consume the `AbortSignal`, the Promise will be cancelled (e.g. aborting the fetch) and therefore, also the Query must be cancelled. Cancelling the query will result in its state being _reverted_ to its previous state.

## Using `fetch`

[//]: # 'Example'

```tsx
const query = useQuery({
  queryKey: ['todos'],
  queryFn: async ({ signal }) => {
    const todosResponse = await fetch('/todos', {
      // Pass the signal to one fetch
      signal,
    })
    const todos = await todosResponse.json()

    const todoDetails = todos.map(async ({ details }) => {
      const response = await fetch(details, {
        // Or pass it to several
        signal,
      })
      return response.json()
    })

    return Promise.all(todoDetails)
  },
})
```

[//]: # 'Example'

## Using `axios` [v0.22.0+](https://github.com/axios/axios/releases/tag/v0.22.0)

[//]: # 'Example2'

```tsx
import axios from 'axios'

const query = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) =>
    axios.get('/todos', {
      // Pass the signal to `axios`
      signal,
    }),
})
```

[//]: # 'Example2'

### Using `axios` with version lower than v0.22.0

[//]: # 'Example3'

```tsx
import axios from 'axios'

const query = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => {
    // Create a new CancelToken source for this request
    const CancelToken = axios.CancelToken
    const source = CancelToken.source()

    const promise = axios.get('/todos', {
      // Pass the source token to your request
      cancelToken: source.token,
    })

    // Cancel the request if TanStack Query signals to abort
    signal?.addEventListener('abort', () => {
      source.cancel('Query was cancelled by TanStack Query')
    })

    return promise
  },
})
```

[//]: # 'Example3'

## Using `XMLHttpRequest`

[//]: # 'Example4'

```tsx
const query = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => {
    return new Promise((resolve, reject) => {
      var oReq = new XMLHttpRequest()
      oReq.addEventListener('load', () => {
        resolve(JSON.parse(oReq.responseText))
      })
      signal?.addEventListener('abort', () => {
        oReq.abort()
        reject()
      })
      oReq.open('GET', '/todos')
      oReq.send()
    })
  },
})
```

[//]: # 'Example4'

## Using `graphql-request`

An `AbortSignal` can be set in the client `request` method.

[//]: # 'Example5'

```tsx
const client = new GraphQLClient(endpoint)

const query = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => {
    client.request({ document: query, signal })
  },
})
```

[//]: # 'Example5'

## Using `graphql-request` with version lower than v4.0.0

An `AbortSignal` can be set in the `GraphQLClient` constructor.

[//]: # 'Example6'

```tsx
const query = useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => {
    const client = new GraphQLClient(endpoint, {
      signal,
    })
    return client.request(query, variables)
  },
})
```

[//]: # 'Example6'

## Manual Cancellation

You might want to cancel a query manually. For example, if the request takes a long time to finish, you can allow the user to click a cancel button to stop the request. To do this, you just need to call `queryClient.cancelQueries({ queryKey })`, which will cancel the query and revert it back to its previous state. If you have consumed the `signal` passed to the query function, TanStack Query will additionally also cancel the Promise.

[//]: # 'Example7'

```tsx
const query = useQuery({
  queryKey: ['todos'],
  queryFn: async ({ signal }) => {
    const resp = await fetch('/todos', { signal })
    return resp.json()
  },
})

const queryClient = useQueryClient()

return (
  <button
    onClick={(e) => {
      e.preventDefault()
      queryClient.cancelQueries({ queryKey: ['todos'] })
    }}
  >
    Cancel
  </button>
)
```

[//]: # 'Example7'

## Limitations

Cancellation does not work when working with `Suspense` hooks: `useSuspenseQuery`, `useSuspenseQueries` and `useSuspenseInfiniteQuery`.
