<script lang="ts">
  import { onlineManager, useQueryClient } from '@tanstack/svelte-query'
  import { BROWSER } from 'esm-env'
  import { onMount } from 'svelte'
  import type {
    DevtoolsButtonPosition,
    DevtoolsErrorType,
    DevtoolsPosition,
    TanstackQueryDevtools,
    Theme,
  } from '@tanstack/query-devtools'
  import type { QueryClient } from '@tanstack/svelte-query'

  interface DevtoolsOptions {
    /**
     * Set this true if you want the dev tools to default to being open
     */
    initialIsOpen?: boolean
    /**
     * The position of the TanStack logo to open and close the devtools panel.
     * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'relative'
     *
     * @defaultValue bottom-right
     */
    buttonPosition?: DevtoolsButtonPosition
    /**
     * The position of the Svelte Query devtools panel.
     * 'top' | 'bottom' | 'left' | 'right'
     *
     * @defaultValue bottom
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
     * Use this to pass a nonce to the `<style>` element that the devtools add
     * in browsers without constructable stylesheets, such as Safari before
     * 16.4. This is useful if you are using a Content Security Policy (CSP)
     * nonce to allow inline styles. Other browsers need no nonce.
     */
    styleNonce?: string
    /**
     * The shadow root to add the devtools styles to. By default, the styles are
     * added to the shadow root the devtools render in, or to the document when
     * they do not render in a shadow root.
     */
    shadowDOMTarget?: ShadowRoot
    /**
     * Set this to true to hide disabled queries from the devtools panel.
     */
    hideDisabledQueries?: boolean
    /**
     * Set this to 'light', 'dark', or 'system' to change the theme of the devtools panel.
     * This overrides the theme selected in the devtools Settings menu. When omitted, the
     * selected theme is used, or `'system'` if none is selected.
     */
    theme?: Theme
  }

  let {
    initialIsOpen = false,
    buttonPosition = 'bottom-right',
    position = 'bottom',
    client = useQueryClient(),
    errorTypes = [],
    styleNonce = undefined,
    shadowDOMTarget = undefined,
    hideDisabledQueries = false,
    theme,
  }: DevtoolsOptions = $props()

  let ref: HTMLDivElement
  let devtools = $state<TanstackQueryDevtools | undefined>(undefined)

  if (BROWSER) {
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
          theme,
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

    $effect(() => {
      devtools?.setTheme(theme)
    })
  }
</script>

<div class="tsqd-parent-container" bind:this={ref}></div>
