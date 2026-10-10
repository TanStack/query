import { useRef, useState, useEffect } from 'preact/hooks'
import { onlineManager, useQueryClient } from '@tanstack/preact-query'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import type { DevtoolsErrorType, Theme } from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/preact-query'
import type { CSSProperties, VNode } from 'preact'

/**
 * The props of `PreactQueryDevtoolsPanel`, which renders the devtools panel inline.
 */
export interface DevtoolsPanelOptions {
  /**
   * Use this to provide a custom QueryClient. Otherwise, the one from the
   * nearest QueryClientProvider will be used.
   */
  client?: QueryClient
  /**
   * Custom error types to be shown in the devtools.
   */
  errorTypes?: Array<DevtoolsErrorType>
  /**
   * Use this to pass a nonce to the style tag that is added to the document
   * head. This is useful if you are using a Content Security Policy (CSP)
   * nonce to allow inline styles.
   */
  styleNonce?: string
  /**
   * Use this to pass a shadow DOM target to the devtools so that the styles will be applied
   * within the shadow DOM instead of within the head tag in the light DOM.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * Custom styles for the devtools panel container.
   */
  style?: CSSProperties
  /**
   * Callback function when the devtools panel is closed.
   */
  onClose?: () => unknown
  /**
   * Use this to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Use this to set the theme of the devtools panel.
   * @defaultValue system
   */
  theme?: Theme
}

/**
 * Renders the TanStack Query devtools panel inline, for the given or nearest `QueryClient`.
 * @param props - The devtools panel options.
 * @returns The element the devtools panel is mounted in.
 */
export function PreactQueryDevtoolsPanel(
  props: DevtoolsPanelOptions,
): VNode | null {
  const queryClient = useQueryClient(props.client)
  const ref = useRef<HTMLDivElement>(null)
  const {
    errorTypes,
    styleNonce,
    shadowDOMTarget,
    hideDisabledQueries,
    theme,
  } = props
  const [devtools] = useState(
    () =>
      new TanstackQueryDevtoolsPanel({
        client: queryClient,
        queryFlavor: 'Preact Query',
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
        theme,
      }),
  )

  useEffect(() => {
    devtools.setClient(queryClient)
  }, [queryClient, devtools])

  useEffect(() => {
    devtools.setOnClose(props.onClose ?? (() => {}))
  }, [props.onClose, devtools])

  useEffect(() => {
    devtools.setErrorTypes(errorTypes || [])
  }, [errorTypes, devtools])

  useEffect(() => {
    devtools.setTheme(theme)
  }, [theme, devtools])

  useEffect(() => {
    if (ref.current) {
      devtools.mount(ref.current)
    }
    return () => {
      devtools.unmount()
    }
  }, [devtools])

  return (
    <div
      style={{ height: '500px', ...props.style }}
      className="tsqd-parent-container"
      ref={ref}
    />
  )
}
