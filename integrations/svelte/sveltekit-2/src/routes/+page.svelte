<script lang="ts">
  import { isPending, isError, createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return 'Success'
    },
  }))
</script>

{#if isPending(query)}
  <div>Loading...</div>
{:else if isError(query)}
  <div>An error has occurred!</div>
{:else}
  <div>{query.data}</div>
{/if}
