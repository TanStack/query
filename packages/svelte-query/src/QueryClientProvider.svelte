<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
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
