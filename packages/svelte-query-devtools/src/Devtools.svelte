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

  interface DevtoolsOptions {
    /**
     * Set this true if you want the dev tools to default to being open
     */
    initialIsOpen?: boolean
    /**
     * The position of the TanStack Query logo to open and close the devtools panel.
     * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
     * Defaults to 'bottom-right'.
     */
    buttonPosition?: DevtoolsButtonPosition
    /**
     * The position of the TanStack Query devtools panel.
     * 'top' | 'bottom' | 'left' | 'right'
     * Defaults to 'bottom'.
     */
    position?: DevtoolsPosition
    /**
     * Custom instance of QueryClient
     */
    client?: QueryClient
    /**
     * Use this so you can define custom errors that can be shown in the devtools.
     */
    errorTypes?: Array<DevtoolsErrorType>
    /**
     * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
     */
    styleNonce?: string
    /**
     * Use this so you can attach the devtool's styles to specific element in the DOM.
     */
    shadowDOMTarget?: ShadowRoot
  }

  let {
    initialIsOpen = false,
    buttonPosition = 'bottom-right',
    position = 'bottom',
    client = useQueryClient(),
    errorTypes = [],
    styleNonce = undefined,
    shadowDOMTarget = undefined,
  }: DevtoolsOptions = $props()

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
        })

        devtools.mount(ref)
      })
      return () => devtools?.unmount()
    })

    $effect(() => {
      devtools?.setButtonPosition(buttonPosition)
    })

    $effect(() => {
      devtools?.setPosition(position)
    })

    $effect(() => {
      devtools?.setInitialIsOpen(initialIsOpen)
    })

    $effect(() => {
      devtools?.setErrorTypes(errorTypes)
    })
  }
</script>

<div class="tsqd-parent-container" bind:this={ref}></div>
