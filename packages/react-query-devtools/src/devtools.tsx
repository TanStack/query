'use client'
import { useEffect, useRef, useState } from 'react'
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import React from 'react'
import type {
  DevToolsErrorType,
  DevtoolsButtonPosition,
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
   * Defaults to 'bottom-left'.
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
  errorTypes?: Array<DevToolsErrorType>
}

export function ReactQueryDevtools(
  props: DevtoolsOptions,
): React.ReactElement | null {
  const queryClient = useQueryClient()
  const client = props.client || queryClient
  const ref = useRef<HTMLDivElement>(null)
  const { buttonPosition, position, initialIsOpen, errorTypes } = props
  const [devtools] = useState(
    new TanstackQueryDevtools({
      client: client,
      queryFlavor: 'React Query',
      version: '5',
      onlineManager,
      buttonPosition,
      position,
      initialIsOpen,
      errorTypes,
    }),
  )

  useEffect(() => {
    devtools.setClient(client)
  }, [client, devtools])

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
    if (ref.current) {
      devtools.mount(ref.current)
    }

    return () => {
      devtools.unmount()
    }
  }, [devtools])

  return <div className="tsqd-parent-container" ref={ref}></div>
}
