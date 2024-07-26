<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from './context'
  import type { QueryClientProviderProps } from './types'

  const { client = new QueryClient(), children }: QueryClientProviderProps =
    $props()

  onMount(() => {
    client.mount()
  })

  setQueryClientContext(client)

  onDestroy(() => {
    client.unmount()
  })
</script>

{@render children()}
