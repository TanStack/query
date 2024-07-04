'use client'
import * as React from 'react'
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools'
import type { DevtoolsErrorType, DevtoolsPosition } from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/react-query'

export interface DevtoolsPanelOptions {
  /**
   * Set this true if you want the dev tools to be open
   */
  isOpen?: boolean
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
}

export function ReactQueryDevtoolsPanel(
  props: DevtoolsPanelOptions,
): React.ReactElement | null {
  const queryClient = useQueryClient(props.client)
  const ref = React.useRef<HTMLDivElement>(null)
  const {
    position,
    isOpen,
    errorTypes,
    styleNonce,
    shadowDOMTarget,
  } = props
  const [devtools] = React.useState(
    new TanstackQueryDevtoolsPanel({
      client: queryClient,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager,
      position,
      isOpen,
      errorTypes,
      styleNonce,
      shadowDOMTarget,
    }),
  )

  React.useEffect(() => {
    devtools.setClient(queryClient)
  }, [queryClient, devtools])

  React.useEffect(() => {
    if (position) {
      devtools.setPosition(position)
    }
  }, [position, devtools])

  React.useEffect(() => {
    devtools.setIsOpen(isOpen || false)
  }, [isOpen, devtools])

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

  return <div className="tsqd-parent-container" ref={ref}></div>
}
