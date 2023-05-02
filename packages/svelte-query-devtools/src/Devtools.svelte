<script lang="ts">
  import { onMount } from 'svelte'
  import type { QueryClient } from '@tanstack/svelte-query'
  import { useQueryClient, onlineManager } from '@tanstack/svelte-query'
  import type {
    DevtoolsButtonPosition,
    DevtoolsPosition,
    DevToolsErrorType,
  } from '@tanstack/query-devtools'
  import { TanstackQueryDevtools } from '@tanstack/query-devtools'

  export let initialIsOpen: boolean = false
  export let buttonPosition: DevtoolsButtonPosition = 'bottom-left'
  export let position: DevtoolsPosition = 'bottom'
  export let client: QueryClient = useQueryClient()
  export let errorTypes: DevToolsErrorType[] = []

  let ref: HTMLDivElement

  onMount(() => {
    const devtools = new TanstackQueryDevtools({
      client,
      queryFlavor: 'Svelte Query',
      version: '5',
      onlineManager,
      buttonPosition,
      position,
      initialIsOpen,
      errorTypes,
    })

    devtools.mount(ref)
    
    return () => {
      devtools.unmount()
    }
  })
  
</script>

<div bind:this={ref} />
