<script lang="ts">
  import {
    QueryClient,
    mountQueryClient,
    unmountQueryClient,
  } from '@tanstack/query-core'
  import { onDestroy, onMount } from 'svelte'
  import { setQueryClientContext } from './context.js'
  import type { QueryClientProviderProps } from './types.js'

  const { client = new QueryClient(), children }: QueryClientProviderProps =
    $props()

  onMount(() => {
    mountQueryClient(client)
  })

  setQueryClientContext(client)

  onDestroy(() => {
    unmountQueryClient(client)
  })
</script>

{@render children()}
