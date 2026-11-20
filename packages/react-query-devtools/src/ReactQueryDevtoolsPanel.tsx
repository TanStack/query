'use client'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import type { DevtoolsErrorType, Theme } from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/react-query'

/**
 * The props of `ReactQueryDevtoolsPanel`, which renders the devtools panel inline.
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
   * @deprecated The devtools no longer add a `<style>` element, so they need no
   * nonce. This option does nothing.
   */
  styleNonce?: string
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
   * @default { height: '100%', display: 'flex', flexDirection: 'column' }
   * @example { height: '100%' }
   * @example { height: '100%', width: '100%' }
   */
  style?: React.CSSProperties

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
export function ReactQueryDevtoolsPanel(
  props: DevtoolsPanelOptions,
): React.ReactElement | null {
  const queryClient = useQueryClient(props.client)
  const ref = React.useRef<HTMLDivElement>(null)
  const {
    errorTypes,
    shadowDOMTarget,
    trustedTypesPolicy,
    hideDisabledQueries,
    theme,
  } = props
  const [devtools] = React.useState(
    () =>
      new TanstackQueryDevtoolsPanel({
        client: queryClient,
        queryFlavor: 'React Query',
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
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...props.style,
      }}
      className="tsqd-parent-container"
      ref={ref}
    ></div>
  )
}
