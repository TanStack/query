<script lang="ts">
  import { onMount } from 'svelte'
  import { DEV } from 'esm-env'
  import { onlineManager, useQueryClient } from '@tanstack/svelte-query'
  import type { QueryClient } from '@tanstack/svelte-query'
  import type {
    DevToolsErrorType,
    DevtoolsButtonPosition,
    DevtoolsPosition,
  } from '@tanstack/query-devtools'
  import { TanstackQueryDevtools } from '@tanstack/query-devtools'

  interface DevtoolsOptions {
    /**
     * Set this true if you want the dev tools to default to being open
     */
    initialIsOpen?: boolean
    /**
     * The position of the React Query logo to open and close the devtools panel.
     * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
     * Defaults to 'bottom-right'.
     */
    buttonPosition?: DevtoolsButtonPosition
    /**
     * The position of the React Query devtools panel.
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
    errorTypes?: Array<DevToolsErrorType>
    /**
     * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
     */
    styleNonce?: string
    /**
     * Use this so you can attach the devtool's styles to specific element in the DOM.
     */
    shadowDOMTarget?: ShadowRoot
  }
  let props: DevtoolsOptions = $props()
  let ref: HTMLDivElement
  const queryClient = useQueryClient()
  const devtools = new TanstackQueryDevtools({
    client: props.client ?? queryClient,
    queryFlavor: 'Svelte Query',
    version: '5',
    onlineManager,
    buttonPosition: props.buttonPosition,
    position: props.position,
    initialIsOpen: props.initialIsOpen,
    errorTypes: props.errorTypes,
    styleNonce: props.styleNonce,
    // shadowDOMTarget: props.shadowDOMTarget,
  })

  if (!DEV) {
    console.log('devtool disabled')
    throw ''
  }
  $effect(() => {
    devtools.setClient(props.client || queryClient)
  })

  $effect(() => {
    const buttonPos = props.buttonPosition
    if (buttonPos) {
      devtools.setButtonPosition(buttonPos)
    }
  })

  $effect(() => {
    const pos = props.position
    if (pos) {
      devtools.setPosition(pos)
    }
  })

  $effect(() => {
    devtools.setInitialIsOpen(props.initialIsOpen || false)
  })

  $effect(() => {
    devtools.setErrorTypes(props.errorTypes || [])
  })

  onMount(() => {
    devtools.mount(ref)
    return () => devtools.unmount()
  })
</script>

<div class="tsqd-parent-container" bind:this={ref}></div>
