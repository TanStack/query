<script lang="ts">
  import { writable, derived } from 'svelte/store'
  import { createQuery } from '@tanstack/svelte-query'

  const store = writable(1)

  const queryOptions = derived(store, (person) => ({
    queryKey: ['myquery', person],
    queryFn: async () =>
      await fetch(`https://swapi.dev/api/people/${person}`).then((r) =>
        r.json(),
      ),
  }))

  const query = createQuery(queryOptions)
</script>

<input type="number" bind:value={$store} />

{#if $query.isPending}
  <p>Loading...</p>
{:else if $query.isError}
  <p>Error: {$query.error.message}</p>
{:else if $query.isSuccess}
  <pre>{JSON.stringify($query.data, null, 2)}</pre>
{/if}
