'use client'
import * as React from 'react'

import { broadcastQueryClientRestore } from '@tanstack/query-broadcast-client-experimental'
import {
  IsRestoringProvider,
  QueryClientProvider,
  useIsRestoring,
} from '@tanstack/react-query'
import type { BroadcastQueryClientRestoreOptions } from '@tanstack/query-broadcast-client-experimental'
import type { OmitKeyof, QueryClientProviderProps } from '@tanstack/react-query'

export type BroadcastQueryClientProviderProps = QueryClientProviderProps & {
  broadcastOptions: OmitKeyof<BroadcastQueryClientRestoreOptions, 'queryClient'>
}

/**
 * Provides a QueryClient while gating descendant queries during cross-tab
 * cache bootstrap. The session is cleaned up when the client changes or the
 * provider unmounts.
 */
export const BroadcastQueryClientProvider = ({
  children,
  broadcastOptions,
  ...props
}: BroadcastQueryClientProviderProps): React.JSX.Element => {
  const parentIsRestoring = useIsRestoring()
  const [isRestoring, setIsRestoring] = React.useState(true)
  const optionsRef = React.useRef(broadcastOptions)
  const [previousClient, setPreviousClient] = React.useState(props.client)
  const clientChanged = previousClient !== props.client

  React.useEffect(() => {
    optionsRef.current = broadcastOptions
  })

  React.useEffect(() => {
    setPreviousClient(props.client)
  }, [props.client])

  React.useEffect(() => {
    setIsRestoring(true)
    let mounted = true
    const [cleanup, restorePromise] = broadcastQueryClientRestore({
      ...optionsRef.current,
      queryClient: props.client,
    })

    restorePromise.then(() => {
      if (mounted) {
        setIsRestoring(false)
      }
    })

    return () => {
      mounted = false
      cleanup()
    }
  }, [props.client])

  return (
    <QueryClientProvider {...props}>
      <IsRestoringProvider
        value={parentIsRestoring || isRestoring || clientChanged}
      >
        {children}
      </IsRestoringProvider>
    </QueryClientProvider>
  )
}
