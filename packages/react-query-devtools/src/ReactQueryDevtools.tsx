'use client'
import * as React from 'react'
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
} from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/react-query'

export interface DevtoolsOptions {
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
   * Set this to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
}

export function ReactQueryDevtools(
  props: DevtoolsOptions,
): React.ReactElement | null {
  const queryClient = useQueryClient(props.client)
  const ref = React.useRef<HTMLDivElement>(null)
  const {
    buttonPosition,
    position,
    initialIsOpen,
    errorTypes,
    styleNonce,
    shadowDOMTarget,
    hideDisabledQueries,
  } = props
  const [devtools] = React.useState(
    new TanstackQueryDevtools({
      client: queryClient,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager,
      buttonPosition,
      position,
      initialIsOpen,
      errorTypes,
      styleNonce,
      shadowDOMTarget,
      hideDisabledQueries,
    }),
  )

  React.useEffect(() => {
    devtools.setClient(queryClient)
  }, [queryClient, devtools])

  React.useEffect(() => {
    if (buttonPosition) {
      devtools.setButtonPosition(buttonPosition)
    }
  }, [buttonPosition, devtools])

  React.useEffect(() => {
    if (position) {
      devtools.setPosition(position)
    }
  }, [position, devtools])

  React.useEffect(() => {
    devtools.setInitialIsOpen(initialIsOpen || false)
  }, [initialIsOpen, devtools])

  React.useEffect(() => {
    devtools.setErrorTypes(errorTypes || [])
  }, [errorTypes, devtools])

  React.useEffect(() => {
    if (ref.current) {
      devtools.mount(ref.current)
    }

    return () => {
      devtools.unmount()
    }
  }, [devtools])

  return <div dir="ltr" className="tsqd-parent-container" ref={ref}></div>
}
