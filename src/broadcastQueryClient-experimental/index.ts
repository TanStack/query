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

  queryClient.getQueryCache().subscribe(queryEvent => {
    if (!queryEvent?.query) {
      return
    }

    const {
      query: { queryHash, queryKey, state },
    } = queryEvent

    if (
      queryEvent.type === 'dispatch' &&
      (queryEvent.action?.type === 'success' ||
        (queryEvent.action?.type === 'setState' &&
          queryEvent.action?.setStateOptions?.meta?.source !== 'tabSync'))
    ) {
      channel.postMessage({
        type: 'queryUpdated',
        queryHash,
        queryKey,
        state,
      })
    }

    if (queryEvent.type === 'queryRemoved') {
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
