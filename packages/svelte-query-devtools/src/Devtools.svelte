<script lang="ts">
  import { onMount } from 'svelte'
  import { DEV, BROWSER } from 'esm-env'
  import type { QueryClient } from '@tanstack/svelte-query'
  import { useQueryClient, onlineManager } from '@tanstack/svelte-query'
  import type {
    TanstackQueryDevtools,
    DevtoolsButtonPosition,
    DevtoolsPosition,
    DevToolsErrorType,
  } from '@tanstack/query-devtools'

  export let initialIsOpen = false
  export let buttonPosition: DevtoolsButtonPosition = 'bottom-left'
  export let position: DevtoolsPosition = 'bottom'
  export let client: QueryClient = useQueryClient()
  export let errorTypes: DevToolsErrorType[] = []

  let ref: HTMLDivElement
  let devtools: TanstackQueryDevtools;

  if (DEV && BROWSER) {
    onMount(async () => {
      const QueryDevtools = (await import('@tanstack/query-devtools')).TanstackQueryDevtools
      devtools = new QueryDevtools({
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
  }

  $: {
    if (devtools) {
      devtools.setButtonPosition(buttonPosition)
      devtools.setPosition(position)
      devtools.setInitialIsOpen(initialIsOpen)
      devtools.setErrorTypes(errorTypes)
    }
  }
</script>

<div bind:this={ref} />
