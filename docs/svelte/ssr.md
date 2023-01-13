---
id: overview
title: SSR and SvelteKit
---

Svelte Query supports two ways of prefetching data on the server and passing that to the client with SvelteKit.

## Caveat

SvelteKit defaults to rendering routes with SSR. Unless you are using one of the below solutions, you need to disable the query on the server. Otherwise, your query will continue executing on the server asynchronously, even after the HTML has been sent to the client.

One way to achieve this is to `import { browser } from '$app/environment'` and add `enabled: browser` to the options of `createQuery`. This will set the query to disabled on the server, but enabled on the client.

Another way to achieve this is using page options. For that page or layout, you should set `export const ssr = false` in either `+page.ts` or `+layout.ts`. You can read more about using this option [here](https://kit.svelte.dev/docs/page-options#ssr).

## Using `initialData`

Together with SvelteKit's [`load`](https://kit.svelte.dev/docs/load), you can pass the data loaded server-side into `createQuery`'s' `initialData` option:

**src/routes/+page.ts**
```ts
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
  const posts = await getPosts()
  return { posts }
}
```

**src/routes/+page.svelte**
```markdown
<script>
  import { createQuery } from '@tanstack/svelte-query'
  import type { PageData } from './$types'

  export let data: PageData

  const query = createQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    initialData: posts
  })
</script>
```

Pros:

- This setup is minimal and this can be a quick solution for some cases
- Works with both `+page.ts`/`+layout.ts` and `+page.server.ts`/`+layout.server.ts` load functions

Cons:

- If you are calling `createQuery` in a component deeper down in the tree you need to pass the `initialData` down to that point
- If you are calling `createQuery` with the same query in multiple locations, you need to pass `initialData` to all of them
- There is no way to know at what time the query was fetched on the server, so `dataUpdatedAt` and determining if the query needs refetching is based on when the page loaded instead

## Using `prefetchQuery`

Svelte Query supports prefetching queries on the server. Using this setup below, you can fetch data and pass it into QueryClientProvider before it is sent to the user's browser. Therefore, this data is already available in the cache, and no initial fetch occurs client-side.

**src/routes/+layout.ts**
```ts
import { QueryClient } from '@tanstack/svelte-query'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async () => {
  const queryClient = new QueryClient()
  return { queryClient }
}
```

**src/routes/+layout.svelte**
```markdown
<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import type { PageData } from './$types'

  export let data: PageData
</script>

<QueryClientProvider client={data.queryClient}>
  <slot />
</QueryClientProvider>
```

**src/routes/+page.ts**
```ts
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { queryClient } = await parent()
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts
  })
}
```

**src/routes/+page.svelte**
```markdown
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  // This data is cached by prefetchQuery in +page.ts so no fetch actually happens here
  const query = createQuery({
    queryKey: ['posts'],
    queryFn: getPosts
  })
</script>
```

Pros:

- Server-loaded data can be accessed anywhere without prop-drilling
- No initial fetch occurs client-side once the page is rendered, as the query cache retains all information about the query was made including `dataUpdatedAt`

Cons:

- Requires more files for initial setup
- Works with only `+page.ts`/`+layout.ts` load functions
