<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query'

  const endPoint = 'https://swapi.dev/api'

  const fetchPlanets = async ({ pageParam = 1 }) =>
    await fetch(`${endPoint}/planets/?page=${pageParam}`).then((r) => r.json())

  const query = createInfiniteQuery(() => ({
    queryKey: ['planets'],
    queryFn: ({ pageParam }) => fetchPlanets({ pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const nextUrl = new URLSearchParams(new URL(lastPage.next).search)
        const nextCursor = nextUrl.get('page')
        if (nextCursor) {
          return +nextCursor
        }
      }
      return undefined
    },
  }))
</script>

{#if query.isPending}
  Loading...
{/if}
{#if query.error}
  <span>Error: {query.error.message}</span>
{/if}
{#if query.isSuccess}
  <div>
    {#each query.data.pages as { results }}
      {#each results as planet}
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
      {#if query.isFetching}
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
  }
</style>
