<script lang="ts">
  import { broadcastQueryClientRestore } from '@tanstack/query-broadcast-client-experimental'
  import {
    QueryClientProvider,
    getIsRestoringContext,
    setIsRestoringContext,
  } from '@tanstack/svelte-query'
  import { box } from './utils.svelte.js'
  import type { BroadcastQueryClientRestoreOptions } from '@tanstack/query-broadcast-client-experimental'
  import type { QueryClientProviderProps } from '@tanstack/svelte-query'

  type BroadcastQueryClientProviderProps = QueryClientProviderProps & {
    broadcastOptions: Omit<BroadcastQueryClientRestoreOptions, 'queryClient'>
  }

  let {
    client,
    children,
    broadcastOptions,
    ...props
  }: BroadcastQueryClientProviderProps = $props()

  const parentIsRestoring = getIsRestoringContext()
  const isRestoring = box(true)

  setIsRestoringContext({
    get current() {
      return parentIsRestoring.current || isRestoring.current
    },
  })

  const options = $derived({
    ...broadcastOptions,
    queryClient: client,
  })

  $effect(() => {
    isRestoring.current = true
    const [cleanup, restorePromise] = broadcastQueryClientRestore(options)
    let mounted = true

    restorePromise.then(() => {
      if (mounted) {
        isRestoring.current = false
      }
    })

    return () => {
      mounted = false
      cleanup()
    }
  })
</script>

<QueryClientProvider {client} {...props}>
  {@render children?.()}
</QueryClientProvider>
