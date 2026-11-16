<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { onDestroy, onMount } from 'svelte'
  import { setQueryClientContext } from './context.js'
  import type { QueryClientProviderProps } from './types.js'

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
