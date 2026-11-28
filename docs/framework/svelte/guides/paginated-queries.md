---
id: paginated-queries
title: Paginated / Lagged Queries
ref: docs/framework/react/guides/paginated-queries.md
replace:
  {
    '@tanstack/react-query': '@tanstack/svelte-query',
    'useQuery': 'createQuery',
    'useInfiniteQuery': 'createInfiniteQuery',
    'hook': 'function',
  }
---

[//]: # 'Example'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let page = $state(0)
  const projectsQuery = createQuery(() => ({
    queryKey: ['projects', page],
    queryFn: () => fetchProjects(page),
  }))
</script>
```

[//]: # 'Example'
[//]: # 'Example2'

```svelte
<script lang="ts">
  import { keepPreviousData, createQuery } from '@tanstack/svelte-query'

  let page = $state(0)
  const projectsQuery = createQuery(() => ({
    queryKey: ['projects', page],
    queryFn: () => fetchProjects(page),
    // ⬇️ keep previous data while fetching the next page
    placeholderData: keepPreviousData,
  }))
</script>

<div>
  {#if projectsQuery.isPending}
    <div>Loading...</div>
  {:else if projectsQuery.isError}
    <div>Error: {projectsQuery.error.message}</div>
  {:else if projectsQuery.isSuccess}
    <div>
      {#each projectsQuery.data.projects as project}
        <p>{project.name}</p>
      {/each}
    </div>
  {/if}
  <span>Current Page: {page + 1}</span>
  <button onclick={() => (page = Math.max(page - 1, 0))} disabled={page === 0}>
    Previous Page
  </button>
  <!-- Disable the Next Page button until we know a next page is available -->
  <button
    onclick={() => {
      if (!projectsQuery.isPlaceholderData && projectsQuery.data?.hasMore) {
        page = page + 1
      }
    }}
    disabled={projectsQuery.isPlaceholderData || !projectsQuery.data?.hasMore}
  >
    Next Page
  </button>
  {#if projectsQuery.isFetching}
    <span> Loading...</span>
  {/if}
</div>
```

[//]: # 'Example2'
