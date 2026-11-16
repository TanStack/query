<script lang="ts">
  import { projectsQueries } from '$lib/services/projects/queries'
  import { createInfiniteQuery } from '@tanstack/svelte-query'

  const query = createInfiniteQuery(() => projectsQueries.infinite())
</script>

<div>
  <h1>Infinite Query with max pages</h1>
  <h3>4 projects per page</h3>
  <h3>3 pages max</h3>
  {#if query.status === 'pending'}
    <p>Loading...</p>
  {:else if query.status === 'error'}
    <span>Error: {query.error.message}</span>
  {:else}
    <div>
      <button
        onclick={() => query.fetchPreviousPage()}
        disabled={!query.hasPreviousPage || query.isFetchingPreviousPage}
      >
        {query.isFetchingPreviousPage
          ? 'Loading more...'
          : query.hasPreviousPage
            ? 'Load Older'
            : 'Nothing more to load'}
      </button>
    </div>
    {#each query.data.pages as page (page.nextId)}
      {#each page.data as project (project.id)}
        <p
          style="border: 1px solid gray; border-radius: 5px; padding: 8px; font-size: 14px; background: hsla({project.id *
            30}, 60%, 80%, 1)"
        >
          {project.name}
        </p>
      {/each}
    {/each}
    <div>
      <button
        onclick={() => query.fetchNextPage()}
        disabled={!query.hasNextPage || query.isFetchingNextPage}
      >
        {query.isFetchingNextPage
          ? 'Loading more...'
          : query.hasNextPage
            ? 'Load Newer'
            : 'Nothing more to load'}
      </button>
    </div>
    <div>
      {query.isFetching && !query.isFetchingNextPage
        ? 'Background Updating...'
        : null}
    </div>
  {/if}
  <hr />
</div>
