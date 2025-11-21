'use client'
import * as React from 'react'
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import type { DevtoolsErrorType, Theme } from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/react-query'

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
  style?: React.CSSProperties

  /**
   * Callback function that is called when the devtools panel is closed
   */
  onClose?: () => unknown
  /**
   * Set this to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Set this to 'light', 'dark', or 'system' to change the theme of the devtools panel.
   * Defaults to 'system'.
   */
  theme?: Theme
}

export function ReactQueryDevtoolsPanel(
  props: DevtoolsPanelOptions,
): React.ReactElement | null {
  const queryClient = useQueryClient(props.client)
  const ref = React.useRef<HTMLDivElement>(null)
  const {
    errorTypes,
    styleNonce,
    shadowDOMTarget,
    hideDisabledQueries,
    theme,
  } = props
  const [devtools] = React.useState(
    new TanstackQueryDevtoolsPanel({
      client: queryClient,
      queryFlavor: 'React Query',
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

  React.useEffect(() => {
    devtools.setClient(queryClient)
  }, [queryClient, devtools])

  React.useEffect(() => {
    devtools.setOnClose(props.onClose ?? (() => {}))
  }, [props.onClose, devtools])

  React.useEffect(() => {
    devtools.setErrorTypes(errorTypes || [])
  }, [errorTypes, devtools])

  React.useEffect(() => {
    devtools.setTheme(theme)
  }, [theme, devtools])

  React.useEffect(() => {
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
    ></div>
  )
}
