---
id: query-cancellation
title: Query Cancellation
ref: docs/framework/react/guides/query-cancellation.md
replace:
  {
    '@tanstack/react-query': '@tanstack/svelte-query',
    'useQuery[(]': 'createQuery(() => ',
  }
---

[//]: # 'Example'

```ts
const todosQuery = createQuery(() => ({
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
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
import axios from 'axios'

const todosQuery = createQuery(() => ({
  queryKey: ['todos'],
  queryFn: ({ signal }) =>
    axios.get('/todos', {
      // Pass the signal to `axios`
      signal,
    }),
}))
```

[//]: # 'Example2'
[//]: # 'Example3'

```ts
import axios from 'axios'

const todosQuery = createQuery(() => ({
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
}))
```

[//]: # 'Example3'
[//]: # 'Example4'

```ts
const todosQuery = createQuery(() => ({
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
}))
```

[//]: # 'Example4'
[//]: # 'Example5'

```ts
const client = new GraphQLClient(endpoint)

const todosQuery = createQuery(() => ({
  queryKey: ['todos'],
  queryFn: ({ signal }) => {
    client.request({ document: query, signal })
  },
}))
```

[//]: # 'Example5'
[//]: # 'Example6'

```ts
const todosQuery = createQuery(() => ({
  queryKey: ['todos'],
  queryFn: ({ signal }) => {
    const client = new GraphQLClient(endpoint, {
      signal,
    })
    return client.request(query, variables)
  },
}))
```

[//]: # 'Example6'
[//]: # 'Example7'

```svelte
<script lang="ts">
  const todosQuery = createQuery(() => ({
    queryKey: ['todos'],
    queryFn: async ({ signal }) => {
      const resp = await fetch('/todos', { signal })
      return resp.json()
    },
  }))

  const queryClient = useQueryClient()
</script>

<button
  onclick={() => {
    queryClient.cancelQueries({ queryKey: ['todos'] })
  }}
>
  Cancel
</button>
```

[//]: # 'Example7'
[//]: # 'Limitations'
[//]: # 'Limitations'
