<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../../src/index.js'
  import type { Accessor, CreateInfiniteQueryOptions } from '../../src/types.js'
  import ErrorBoundaryContent from './ErrorBoundaryContent.svelte'

  type Props = {
    queryClient: QueryClient
    options: Accessor<CreateInfiniteQueryOptions>
  }

  let { queryClient, options }: Props = $props()

  setQueryClientContext(queryClient)

  onMount(() => queryClient.mount())
  onDestroy(() => queryClient.unmount())
</script>

<svelte:boundary onerror={(_err, _reset) => {}}>
  <ErrorBoundaryContent {options} />
  {#snippet failed(error, _reset)}
    <div data-testid="error-boundary">
      {error instanceof Error ? error.message : String(error)}
    </div>
  {/snippet}
</svelte:boundary>
