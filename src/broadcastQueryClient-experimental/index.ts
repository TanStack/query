import { BroadcastChannel } from 'broadcast-channel'
import { QueryClient } from '../core'

interface BroadcastQueryClientOptions {
  queryClient: QueryClient
  broadcastChannel: string
}

export function broadcastQueryClient({
  queryClient,
  broadcastChannel = 'react-query',
}: BroadcastQueryClientOptions) {
  const channel = new BroadcastChannel(broadcastChannel, {
    webWorkerSupport: false,
  })

  const queryCache = queryClient.getQueryCache()

  queryClient.getQueryCache().subscribe((query, event) => {
    if (!query) {
      return
    }

    const { queryHash, queryKey, state } = query

    if (
      event?.eventType === 'dispatch' &&
      (event?.dispatchAction?.type === 'success' ||
        (event?.dispatchAction?.type === 'setState' &&
          event?.dispatchAction?.setStateOptions?.meta?.source !== 'tabSync'))
    ) {
      channel.postMessage({
        type: 'queryUpdated',
        queryHash,
        queryKey,
        state,
      })
    }

    if (event?.eventType === 'queryRemoved') {
      channel.postMessage({
        type: 'queryRemoved',
        queryHash,
        queryKey,
      })
    }
  })

  channel.onmessage = action => {
    if (!action?.type) {
      return
    }

    const { type, queryHash, queryKey, state } = action

    if (type === 'queryUpdated') {
      const query = queryCache.get(queryHash)

      if (query) {
        query.setState(state, {
          meta: {
            source: 'tabSync',
          },
        })
        return
      }

      queryCache.build(
        queryClient,
        {
          queryKey,
          queryHash,
        },
        state
      )
    } else if (type === 'queryRemoved') {
      const query = queryCache.get(queryHash)

      if (query) {
        queryCache.remove(query)
      }
    }
  }
}
