/** @jsxRuntime automatic */
/** @jsxImportSource preact */
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '../../../query-persist-client-core/src'
import {
  IsRestoringProvider,
  QueryClientProvider,
} from '../../../preact-query/src'
import type { ComponentChildren } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

type Props = {
  children?: ComponentChildren
  client: any
  persistOptions: any
  onSuccess?: () => void | Promise<void>
  onError?: () => void
}

export function PersistQueryClientProvider({
  children,
  persistOptions,
  onSuccess,
  onError,
  ...props
}: Props) {
  const [isRestoring, setIsRestoring] = useState(true)
  const refs = useRef({ persistOptions, onSuccess, onError })
  const didRestore = useRef(false)

  useEffect(() => {
    refs.current = { persistOptions, onSuccess, onError }
  })

  useEffect(() => {
    const options = {
      ...refs.current.persistOptions,
      queryClient: props.client,
    }

    if (!didRestore.current) {
      didRestore.current = true
      persistQueryClientRestore(options)
        .then(() => refs.current.onSuccess?.())
        .catch(() => refs.current.onError?.())
        .finally(() => {
          setIsRestoring(false)
        })
    }

    return isRestoring ? undefined : persistQueryClientSubscribe(options)
  }, [props.client, isRestoring])

  return (
    <QueryClientProvider {...props}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  )
}
