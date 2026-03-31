---
id: overview
title: SSR and SvelteKit
---

## Setup

SvelteKit defaults to rendering routes with SSR. Because of this, you need to disable the query on the server. Otherwise, your query will continue executing on the server asynchronously, even after the HTML has been sent to the client.

The recommended way to achieve this is to use the `browser` module from SvelteKit in your `QueryClient` object. This will not disable `queryClient.prefetchQuery()`, which is used in one of the solutions below.

**src/routes/+layout.svelte**

```svelte
<script lang="ts">
  import { browser } from '$app/environment'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })
</script>

<QueryClientProvider client={queryClient}>
  <slot />
</QueryClientProvider>
```

## Prefetching data

Svelte Query supports two ways of prefetching data on the server and passing that to the client with SvelteKit.

If you wish to view the ideal SSR setup, please have a look at the [SSR example](./examples/ssr).

### Using `initialData`

Together with SvelteKit's [`load`](https://kit.svelte.dev/docs/load), you can pass the data loaded server-side into `createQuery`'s' `initialData` option:

**src/routes/+page.ts**

```ts
export async function load() {
  const posts = await getPosts()
  return { posts }
}
```

**src/routes/+page.svelte**

```svelte
<script>
  import { createQuery } from '@tanstack/svelte-query'
  import type { PageData } from './$types'

  export let data: PageData

  const query = createQuery(() => ({
    queryKey: ['posts'],
    queryFn: getPosts,
    initialData: data.posts,
  }))
</script>
```

Pros:

- This setup is minimal and this can be a quick solution for some cases
- Works with both `+page.ts`/`+layout.ts` and `+page.server.ts`/`+layout.server.ts` load functions

Cons:

- If you are calling `createQuery` in a component deeper down in the tree you need to pass the `initialData` down to that point
- If you are calling `createQuery` with the same query in multiple locations, you need to pass `initialData` to all of them
- There is no way to know at what time the query was fetched on the server, so `dataUpdatedAt` and determining if the query needs refetching is based on when the page loaded instead

### Using `prefetchQuery`

Svelte Query supports prefetching queries on the server. Using this setup below, you can fetch data and pass it into QueryClientProvider before it is sent to the user's browser. Therefore, this data is already available in the cache, and no initial fetch occurs client-side.

**src/routes/+layout.ts**

```ts
import { browser } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'

export async function load() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  return { queryClient }
}
```

**src/routes/+layout.svelte**

```svelte
<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import type { LayoutData } from './$types'

  export let data: LayoutData
</script>

<QueryClientProvider client={data.queryClient}>
  <slot />
</QueryClientProvider>
```

**src/routes/+page.ts**

```ts
export async function load({ parent, fetch }) {
  const { queryClient } = await parent()

  // You need to use the SvelteKit fetch function here
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: async () => (await fetch('/api/posts')).json(),
  })
}
```

**src/routes/+page.svelte**

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  // This data is cached by prefetchQuery in +page.ts so no fetch actually happens here
  const query = createQuery(() => ({
    queryKey: ['posts'],
    queryFn: async () => (await fetch('/api/posts')).json(),
  }))
</script>
```

Pros:

- Server-loaded data can be accessed anywhere without prop-drilling
- No initial fetch occurs client-side once the page is rendered, as the query cache retains all information about the query was made including `dataUpdatedAt`

Cons:

- Requires more files for initial setup
- Will not work with `+page.server.ts`/`+layout.server.ts` load functions (however, APIs which are used with TanStack Query need to be fully exposed to the browser anyway)
