---
id: overview
title: SSR and SvelteKit
---

Svelte Query supports two ways of prefetching data on the server and passing that to the client with SvelteKit.

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
