'use client'
import { useRef, useState, useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient, onlineManager } from '@tanstack/react-query'
import type {
  DevtoolsButtonPosition,
  DevtoolsPosition,
  DevToolsErrorType,
} from '@tanstack/query-devtools'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import React from 'react'
export interface DevtoolsOptions {
  /**
   * Set this true if you want the dev tools to default to being open
   */
  initialIsOpen?: boolean
  /**
   * The position of the React Query logo to open and close the devtools panel.
   * Defaults to 'bottom-left'.
   */
  buttonPosition?: DevtoolsButtonPosition
  /**
   * The position of the React Query devtools panel.
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
  errorTypes?: DevToolsErrorType[]
}

export function ReactQueryDevtools(
  props: DevtoolsOptions,
): React.ReactElement | null {
  const queryClient = useQueryClient()
  const ref = useRef<HTMLDivElement>(null)
  const { buttonPosition, position, initialIsOpen, errorTypes } = props
  const [devtools] = useState(
    new TanstackQueryDevtools({
      client: props.client || queryClient,
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

  return <div ref={ref}></div>
}
