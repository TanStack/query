import { createEffect, createMemo, onCleanup, onMount } from 'solid-js'
import { onlineManager, useQueryClient } from '@tanstack/solid-query'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import type { DevtoolsErrorType } from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/solid-query'
import type { JSX } from 'solid-js'

export interface DevtoolsPanelOptions {
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

  /**
   * Custom styles for the devtools panel
   * @default { height: '500px' }
   * @example { height: '100%' }
   * @example { height: '100%', width: '100%' }
   */
  style?: JSX.CSSProperties

  /**
   * Callback function that is called when the devtools panel is closed
   */
  onClose?: () => unknown
  /**
   * Set this to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Set this to 'light' or 'dark' to change the theme of the devtools panel.
   */
  theme?: 'light' | 'dark' | 'system'
}

export default function SolidQueryDevtoolsPanel(props: DevtoolsPanelOptions) {
  const queryClient = useQueryClient(props.client)
  const client = createMemo(() => queryClient)
  let ref!: HTMLDivElement
  const { errorTypes, styleNonce, shadowDOMTarget, hideDisabledQueries } = props
  const devtools = new TanstackQueryDevtoolsPanel({
    client: client(),
    queryFlavor: 'Solid Query',
    version: '5',
    onlineManager,
    buttonPosition: 'bottom-left',
    position: 'bottom',
    initialIsOpen: true,
    errorTypes,
    styleNonce,
    shadowDOMTarget,
    onClose: props.onClose,
    hideDisabledQueries,
    theme: props.theme,
  })
  createEffect(() => {
    devtools.setClient(client())
  })
  createEffect(() => {
    devtools.setOnClose(props.onClose ?? (() => {}))
  })

  createEffect(() => {
    devtools.setErrorTypes(props.errorTypes || [])
  })

  createEffect(() => {
    devtools.setTheme(props.theme || 'system')
  })

  onMount(() => {
    devtools.mount(ref)
    onCleanup(() => devtools.unmount())
  })

  return (
    <div
      style={{ height: '500px', ...props.style }}
      class="tsqd-parent-container"
      ref={ref}
    />
  )
}
