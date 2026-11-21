import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import { onlineManager, useQueryClient } from '@tanstack/solid-query'
import { createEffect, createMemo, onCleanup, onMount } from 'solid-js'
import type { DevtoolsErrorType, Theme } from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/solid-query'
import type { JSX } from 'solid-js'

/**
 * The props of `SolidQueryDevtoolsPanel`, which renders the devtools panel inline.
 */
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
   * The shadow root to add the devtools styles to. By default, the styles are
   * added to the shadow root the devtools render in, or to the document when
   * they do not render in a shadow root.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * The Trusted Types policy the devtools use to create their HTML templates.
   * Pass one when your page enforces `require-trusted-types-for 'script'`.
   * The devtools only pass it their own markup.
   */
  trustedTypesPolicy?: { createHTML: (html: string) => unknown }

  /**
   * Custom styles for the devtools panel
   * @default { height: '100%', display: 'flex', 'flex-direction': 'column' }
   * @example { height: '100%' }
   * @example { height: '100%', width: '100%' }
   */
  style?: JSX.CSSProperties

  /**
   * Callback function that is called when the devtools panel is closed
   */
  onClose?: () => void
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

/**
 * Renders the TanStack Query devtools panel inline, for the given or nearest `QueryClient`.
 * @param props - The devtools panel options.
 * @returns The element the devtools panel is mounted in.
 */
export default function SolidQueryDevtoolsPanel(props: DevtoolsPanelOptions) {
  const queryClient = useQueryClient(props.client)
  const client = createMemo(() => queryClient)
  let ref!: HTMLDivElement
  const {
    errorTypes,
    shadowDOMTarget,
    trustedTypesPolicy,
    hideDisabledQueries,
  } = props
  const devtools = new TanstackQueryDevtoolsPanel({
    client: client(),
    queryFlavor: 'Solid Query',
    version: '5',
    onlineManager,
    buttonPosition: 'bottom-left',
    position: 'bottom',
    initialIsOpen: true,
    errorTypes,
    shadowDOMTarget,
    trustedTypesPolicy,
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
    devtools.setTheme(props.theme)
  })

  onMount(() => {
    devtools.mount(ref)
    onCleanup(() => devtools.unmount())
  })

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        'flex-direction': 'column',
        ...props.style,
      }}
      class="tsqd-parent-container"
      ref={ref}
    />
  )
}
