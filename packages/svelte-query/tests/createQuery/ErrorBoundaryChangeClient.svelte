<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { setQueryClientContext } from '../../src/index.js'
  import ErrorBoundaryChangeClientContent from './ErrorBoundaryChangeClientContent.svelte'
  import type { QueryClient } from '@tanstack/query-core'
  import type { Accessor, CreateQueryOptions } from '../../src/index.js'

  type Props = {
    queryClient: QueryClient
    currentClient: Accessor<QueryClient>
    options: Accessor<CreateQueryOptions>
  }

  let { queryClient, currentClient, options }: Props = $props()

  setQueryClientContext(queryClient)

  onMount(() => queryClient.mount())
  onDestroy(() => queryClient.unmount())
</script>

<svelte:boundary onerror={(_err, _reset) => {}}>
  <ErrorBoundaryChangeClientContent {currentClient} {options} />
  {#snippet failed(error, _reset)}
    <div data-testid="error-boundary">
      {error instanceof Error ? error.message : String(error)}
    </div>
  {/snippet}
</svelte:boundary>
