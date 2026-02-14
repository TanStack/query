import { useRef, useState, useEffect } from 'preact/hooks'
import { onlineManager, useQueryClient } from '@tanstack/preact-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  Theme,
} from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/preact-query'
import type { VNode } from 'preact'

export interface DevtoolsOptions {
  /**
   * Set this true if you want the dev tools to default to being open
   */
  initialIsOpen?: boolean
  /**
   * The position of the TanStack logo to open and close the devtools panel.
   * Defaults to 'bottom-right'.
   */
  buttonPosition?: DevtoolsButtonPosition
  /**
   * The position of the Preact Query devtools panel.
   * Defaults to 'bottom'.
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
   * Use this to pass a nonce to the style tag that is added to the document
   * head. This is useful if you are using a Content Security Policy (CSP)
   * nonce to allow inline styles.
   */
  styleNonce?: string
  /**
   * Use this to render the devtools inside a Shadow DOM.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * Use this to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Use this to set the theme of the devtools panel.
   * Defaults to 'system'.
   */
  theme?: Theme
}

export function PreactQueryDevtools(
  props: DevtoolsOptions,
): VNode | null {
  const queryClient = useQueryClient(props.client)
  const ref = useRef<HTMLDivElement>(null)
  const {
    buttonPosition,
    position,
    initialIsOpen,
    errorTypes,
    styleNonce,
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
        styleNonce,
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

  return <div dir="ltr" className="tsqd-parent-container" ref={ref}></div>
}
