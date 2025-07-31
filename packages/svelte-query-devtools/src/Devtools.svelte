<script lang="ts">
  import { onMount } from 'svelte'
  import { BROWSER, DEV } from 'esm-env'
  import { onlineManager, useQueryClient } from '@tanstack/svelte-query'
  import type { QueryClient } from '@tanstack/svelte-query'
  import type {
    DevtoolsButtonPosition,
    DevtoolsErrorType,
    DevtoolsPosition,
    TanstackQueryDevtools,
  } from '@tanstack/query-devtools'

  export let initialIsOpen = false
  export let buttonPosition: DevtoolsButtonPosition = 'bottom-right'
  export let position: DevtoolsPosition = 'bottom'
  export let client: QueryClient = useQueryClient()
  export let errorTypes: Array<DevtoolsErrorType> = []
  export let styleNonce: string | undefined = undefined
  export let shadowDOMTarget: ShadowRoot | undefined = undefined
  export let hideDisabledQueries: boolean = false

  let ref: HTMLDivElement
  let devtools: TanstackQueryDevtools | undefined

  if (DEV && BROWSER) {
    onMount(() => {
      import('@tanstack/query-devtools').then((m) => {
        const QueryDevtools = m.TanstackQueryDevtools

        devtools = new QueryDevtools({
          client,
          queryFlavor: 'Svelte Query',
          version: '5',
          onlineManager,
          buttonPosition,
          position,
          initialIsOpen,
          errorTypes,
          styleNonce,
          shadowDOMTarget,
          hideDisabledQueries,
        })

        devtools.mount(ref)
      })

      return () => {
        devtools?.unmount()
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

<div class="tsqd-parent-container" bind:this={ref}></div>
