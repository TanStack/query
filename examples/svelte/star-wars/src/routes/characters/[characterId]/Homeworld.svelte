<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { planetsQueries } from '$lib/services/planets/queries'

  type Props = {
    homeworldId: string
  }

  let { homeworldId }: Props = $props()

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
