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

export const BroadcastQueryClientProvider = ({
  children,
  broadcastOptions,
  ...props
}: BroadcastQueryClientProviderProps): VNode => {
  const parentIsRestoring = useIsRestoring()
  const [isRestoring, setIsRestoring] = useState(true)
  const optionsRef = useRef(broadcastOptions)

  useEffect(() => {
    optionsRef.current = broadcastOptions
  })

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
      <IsRestoringProvider value={parentIsRestoring || isRestoring}>
        {children}
      </IsRestoringProvider>
    </QueryClientProvider>
  )
}
