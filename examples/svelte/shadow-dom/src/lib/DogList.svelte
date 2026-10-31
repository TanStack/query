<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { dogsQueries } from './services/dogs/queries'

  const query = createQuery(() => dogsQueries.list())
</script>

{#if query.status === 'pending'}
  Loading...
{:else if query.status === 'error'}
  Error!
{:else}
  <div>
    {#each Object.keys(query.data.message) as dog (dog)}
      <div>{dog}</div>
    {/each}
  </div>
{/if}
