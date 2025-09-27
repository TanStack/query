<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { getPlanet } from '$lib/api'

  export let homeworldId: string

  const query = createQuery({
    queryKey: ['homeworld', homeworldId],
    queryFn: () => getPlanet(homeworldId),
  })
</script>

{#if $query.status === 'pending'}
  <span>Loading...</span>
{/if}

{#if $query.status === 'error'}
  <span>Error :(</span>
{/if}

{#if $query.status === 'success'}
  <span>
    {$query.data.name}
  </span>
{/if}
