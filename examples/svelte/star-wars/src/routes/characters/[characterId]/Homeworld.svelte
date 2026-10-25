<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { planetsQueries } from '$lib/services/planets/queries'

  let { homeworldId }: { homeworldId: string } = $props()

  const query = createQuery(() => planetsQueries.detail(homeworldId))
</script>

{#if query.status === 'pending'}
  <span>Loading...</span>
{/if}

{#if query.status === 'error'}
  <span>Error :(</span>
{/if}

{#if query.status === 'success'}
  <span>
    {query.data.name}
  </span>
{/if}
