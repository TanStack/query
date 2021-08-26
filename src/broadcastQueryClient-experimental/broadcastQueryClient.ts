import { BroadcastChannel } from 'broadcast-channel'
import {
  InvalidateOptions,
  InvalidateQueryFilters,
  QueryClient,
  QueryKey,
} from '../core'
import { QueryClientConfig } from '../core/queryClient'
import { parseFilterArgs } from '../core/utils'

interface BroadcastQueryClientConfig extends QueryClientConfig {
  broadcastChannel?: string
}

export class BroadcastQueryClient extends QueryClient {
  private channel: BroadcastChannel

  constructor(
    { broadcastChannel = 'react-query', ...config }: BroadcastQueryClientConfig
  ) {
    super(config)
    let transaction = false
    const tx = (cb: () => void) => {
      transaction = true
      cb()
      transaction = false
    }

    this.channel = new BroadcastChannel(broadcastChannel, {
      webWorkerSupport: false,
    })

    const queryCache = this.getQueryCache()

    this.getQueryCache().subscribe(queryEvent => {
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
        this.channel.postMessage({
          type: 'queryUpdated',
          queryHash,
          queryKey,
          state,
        })
      }

      if (queryEvent.type === 'queryRemoved') {
        this.channel.postMessage({
          type: 'queryRemoved',
          queryHash,
          queryKey,
        })
      }
    })

    this.channel.onmessage = action => {
      if (!action?.type) {
        return
      }

      tx(() => {
        if (action.type === 'invalidate') {
          super.invalidateQueries(action.filters, action.options)
        }

        const { type, queryHash, queryKey, state } = action

        if (type === 'queryUpdated') {
          const query = queryCache.get(queryHash)

          if (query) {
            query.setState(state)
            return
          }

          queryCache.build(
            this,
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

  invalidateQueries(
    filters?: InvalidateQueryFilters,
    options?: InvalidateOptions
  ): Promise<void>
  invalidateQueries(
    queryKey?: QueryKey,
    filters?: InvalidateQueryFilters,
    options?: InvalidateOptions
  ): Promise<void>
  invalidateQueries(
    arg1?: QueryKey | InvalidateQueryFilters,
    arg2?: InvalidateQueryFilters | InvalidateOptions,
    arg3?: InvalidateOptions
  ): Promise<void> {
    const [filters, options] = parseFilterArgs(arg1, arg2, arg3)

    this.channel.postMessage({ type: 'invalidate', filters, options })
    return super.invalidateQueries(filters, options)
  }
}
