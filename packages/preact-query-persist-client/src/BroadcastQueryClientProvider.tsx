import { broadcastQueryClientRestore } from '@tanstack/query-broadcast-client-experimental'
import {
  IsRestoringProvider,
  QueryClientProvider,
  useIsRestoring,
} from '@tanstack/preact-query'
import { useEffect, useRef, useState } from 'preact/hooks'
import type { VNode } from 'preact'
import type { BroadcastQueryClientRestoreOptions } from '@tanstack/query-broadcast-client-experimental'
import type {
  OmitKeyof,
  QueryClientProviderProps,
} from '@tanstack/preact-query'

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
}: BroadcastQueryClientProviderProps): VNode => {
  const parentIsRestoring = useIsRestoring()
  const [isRestoring, setIsRestoring] = useState(true)
  const optionsRef = useRef(broadcastOptions)
  const [previousClient, setPreviousClient] = useState(props.client)
  const clientChanged = previousClient !== props.client

  useEffect(() => {
    optionsRef.current = broadcastOptions
  })

  useEffect(() => {
    setPreviousClient(props.client)
  }, [props.client])

  useEffect(() => {
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
