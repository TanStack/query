<script lang="ts">
  import { projectsQueries } from '$lib/services/projects/queries'
  import {
    createQuery,
    keepPreviousData,
    noop,
    useQueryClient,
  } from '@tanstack/svelte-query'

  const queryClient = useQueryClient()
  let page = $state(0)

  const query = createQuery(() => ({
    ...projectsQueries.list(page),
    placeholderData: keepPreviousData,
  }))

  // Prefetch the next page!
  $effect(() => {
    if (!query.isPlaceholderData && query.data?.hasMore) {
      queryClient.query(projectsQueries.list(page + 1)).catch(noop)
    }
  })
</script>

<div>
  <p>
    In this example, each page of data remains visible as the next page is
    fetched. The buttons and capability to proceed to the next page are also
    suppressed until the next page cursor is known. Each page is cached as a
    normal query too, so when going to previous pages, you'll see them
    instantaneously while they are also refetched invisibly in the background.
  </p>
  {#if query.status === 'pending'}
    <div>Loading...</div>
  {:else if query.status === 'error'}
    <div>Error: {query.error.message}</div>
  {:else}
    <!-- `data` will either resolve to the latest page's data
    or if fetching a new page, the last successful page's data -->
    <div>
      {#each query.data.projects as project (project.id)}
        <p>{project.name}</p>
      {/each}
    </div>
  {/if}
  <div>Current Page: {page + 1}</div>
  <button onclick={() => (page = Math.max(page - 1, 0))} disabled={page === 0}>
    Previous Page
  </button>
  <button
    onclick={() => {
      page = query.data?.hasMore ? page + 1 : page
    }}
    disabled={query.isPlaceholderData || !query.data?.hasMore}
  >
    Next Page
  </button>
  <!-- Since the last page's data potentially sticks around between page requests,
  we can use `isFetching` to show a background loading
  indicator since our `status === 'pending'` state won't be triggered -->
  {#if query.isFetching}<span> Loading...</span>{/if}
</div>
