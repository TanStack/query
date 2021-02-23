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
  let transaction = false
  const tx = (cb: () => void) => {
    transaction = true
    cb()
    transaction = false
  }

  const channel = new BroadcastChannel(broadcastChannel, {
    webWorkerSupport: false,
  })

  const queryCache = queryClient.getQueryCache()

  queryClient.getQueryCache().subscribe(queryEvent => {
    if (transaction || !queryEvent?.query) {
      return
    }

    const {
      query: { queryHash, queryKey, state },
    } = queryEvent

    if (
      queryEvent.type === 'queryUpdated' &&
      queryEvent.action?.type === 'success'
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

    tx(() => {
      const { type, queryHash, queryKey, state } = action

      if (type === 'queryUpdated') {
        const query = queryCache.get(queryHash)

        if (query) {
          query.setState(state)
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
    })
  }
}
