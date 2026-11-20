import { onlineManager, useQueryClient } from '@tanstack/preact-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import { useEffect, useRef, useState } from 'preact/hooks'
import type { QueryClient } from '@tanstack/preact-query'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  Theme,
} from '@tanstack/query-devtools'
import type { VNode } from 'preact'

/**
 * The props of `PreactQueryDevtools`, which renders the devtools with a toggle button that opens
 * them.
 */
export interface DevtoolsOptions {
  /**
   * Set this true if you want the dev tools to default to being open
   */
  initialIsOpen?: boolean
  /**
   * The position of the TanStack logo to open and close the devtools panel.
   * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'relative'
   * @defaultValue bottom-right
   */
  buttonPosition?: DevtoolsButtonPosition
  /**
   * The position of the Preact Query devtools panel.
   * 'top' | 'bottom' | 'left' | 'right'
   * @defaultValue bottom
   */
  position?: DevtoolsPosition
  /**
   * Use this to provide a custom QueryClient. Otherwise, the one from the
   * nearest QueryClientProvider will be used.
   */
  client?: QueryClient
  /**
   * Use this to provide custom error type handlers for the devtools panel.
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
 * Renders the TanStack Query devtools, with a toggle button that opens them, for the given or
 * nearest `QueryClient`.
 * @param props - The devtools options.
 * @returns The element the devtools are mounted in.
 */
export function PreactQueryDevtools(props: DevtoolsOptions): VNode | null {
  const queryClient = useQueryClient(props.client)
  const ref = useRef<HTMLDivElement>(null)
  const {
    buttonPosition,
    position,
    initialIsOpen,
    errorTypes,
    shadowDOMTarget,
    hideDisabledQueries,
    theme,
  } = props
  const [devtools] = useState(
    () =>
      new TanstackQueryDevtools({
        client: queryClient,
        queryFlavor: 'Preact Query',
        version: '5',
        onlineManager,
        buttonPosition,
        position,
        initialIsOpen,
        errorTypes,
        shadowDOMTarget,
        hideDisabledQueries,
        theme,
      }),
  )

  useEffect(() => {
    devtools.setClient(queryClient)
  }, [queryClient, devtools])

  useEffect(() => {
    if (buttonPosition) {
      devtools.setButtonPosition(buttonPosition)
    }
  }, [buttonPosition, devtools])

  useEffect(() => {
    if (position) {
      devtools.setPosition(position)
    }
  }, [position, devtools])

  useEffect(() => {
    devtools.setInitialIsOpen(initialIsOpen || false)
  }, [initialIsOpen, devtools])

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

  return <div className="tsqd-parent-container" ref={ref} />
}
