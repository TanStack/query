<script lang="ts">
  import { useInfiniteQuery } from '@tanstack/svelte-query'

  const endPoint = 'https://swapi.dev/api'

  const fetchPlanets = async ({ pageParam = 1 }) =>
    await fetch(`${endPoint}/planets/?page=${pageParam}`).then((r) => r.json())

  const queryOptions = {
    queryKey: 'planets',
    queryFn: fetchPlanets,
    //@ts-ignore
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
  }

  const queryResult = useInfiniteQuery(['planets'], queryOptions)

  const { error }: { error: any } = $queryResult
</script>

{#if $queryResult.isLoading}
  Loading...
{/if}
{#if $queryResult.error}
  <span>Error: {error.message}</span>
{/if}
{#if $queryResult.isSuccess}
  <div>
    {#each $queryResult.data.pages as { results }}
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
      on:click={() => $queryResult.fetchNextPage()}
      disabled={!$queryResult.hasNextPage || $queryResult.isFetchingNextPage}
    >
      {#if $queryResult.isFetching}
        Loading more...
      {:else if $queryResult.hasNextPage}
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
