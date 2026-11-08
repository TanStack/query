<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { locationsQueries } from '$lib/services/locations/queries'

  type Props = {
    locationId: string
  }

  let { locationId }: Props = $props()

  const query = createQuery(() => locationsQueries.detail(locationId))
</script>

{#if query.status === 'pending'}
  <span>Loading...</span>
{:else if query.status === 'error'}
  <span>Error :(</span>
{:else}
  <span>{query.data.name} - {query.data.type}</span>
{/if}
