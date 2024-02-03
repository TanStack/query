<script>
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return 'Success'
    },
  })
</script>

{#if $query.isPending}
  <div>Loading...</div>
{:else if $query.error}
  <div>An error has occurred!</div>
{:else}
  <div>{$query.data}</div>
{/if}
