import { onlineManager, useQueryClient } from '@tanstack/preact-query'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import { useEffect, useRef, useState } from 'preact/hooks'
import type { QueryClient } from '@tanstack/preact-query'
import type { DevtoolsErrorType, Theme } from '@tanstack/query-devtools'
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
   * Custom styles for the devtools panel container.
   * @default { height: '100%', display: 'flex', flexDirection: 'column' }
   * @example { height: '100%' }
   * @example { height: '100%', width: '100%' }
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
export function PreactQueryDevtoolsPanel(
  props: DevtoolsPanelOptions,
): VNode | null {
  const queryClient = useQueryClient(props.client)
  const ref = useRef<HTMLDivElement>(null)
  const { errorTypes, shadowDOMTarget, hideDisabledQueries, theme } = props
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
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...props.style,
      }}
      className="tsqd-parent-container"
      ref={ref}
    />
  )
}
