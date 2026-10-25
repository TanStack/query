<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query'
  import { planetsQueries } from './services/planets/queries'

  const query = createInfiniteQuery(() => planetsQueries.list())
</script>

{#if query.isPending}
  Loading...
{/if}
{#if query.error}
  <span>Error: {query.error.message}</span>
{/if}
{#if query.isSuccess}
  <div>
    {#each query.data.pages as { next, results } (next)}
      {#each results as planet (planet.url)}
        <div class="card">
          <div class="card-body">
            <h2 class="card-title">Planet Name: {planet.name}</h2>
            <p>Population: {planet.population}</p>
          </div>
        </div>
      {/each}
    {/each}
  </div>
  <div>
    <button
      onclick={() => query.fetchNextPage()}
      disabled={!query.hasNextPage || query.isFetchingNextPage}
    >
      {#if query.isFetchingNextPage}
        Loading more...
      {:else if query.hasNextPage}
        Load More
      {:else}Nothing more to load{/if}
    </button>
  </div>
{/if}

<style>
  .card {
    background-color: #111;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.87);
  }
</style>
