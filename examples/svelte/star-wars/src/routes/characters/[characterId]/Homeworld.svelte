<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let { homeworldId }: { homeworldId: string } = $props()

  const getHomeworld = async () => {
    const res = await fetch(`https://swapi.dev/api/planets/${homeworldId}/`)
    return await res.json()
  }

  const query = createQuery(() => ({
    queryKey: ['homeworld', homeworldId],
    queryFn: getHomeworld,
  }))
</script>

{#if query.status === 'success'}
  <span>
    {query.data.name}
  </span>
{/if}
