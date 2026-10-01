import { createContext, useContext } from 'solid-js'
import { createCacheSubscriptionRegistry } from '../createCacheSubscriptionRegistry'
import type {
  MutationCache,
  MutationCacheNotifyEvent,
  QueryCache,
  QueryCacheNotifyEvent,
} from '@tanstack/query-core'
import type { ParentProps } from 'solid-js'

interface DevtoolsSubscriptions {
  queryCacheSubscriptions: ReturnType<
    typeof createCacheSubscriptionRegistry<QueryCache, QueryCacheNotifyEvent>
  >
  mutationCacheSubscriptions: ReturnType<
    typeof createCacheSubscriptionRegistry<
      MutationCache,
      MutationCacheNotifyEvent
    >
  >
}

const DevtoolsSubscriptionsContext = createContext<DevtoolsSubscriptions>()

export function DevtoolsSubscriptionsProvider(props: ParentProps) {
  const queryCacheSubscriptions = createCacheSubscriptionRegistry<
    QueryCache,
    QueryCacheNotifyEvent
  >()
  const mutationCacheSubscriptions = createCacheSubscriptionRegistry<
    MutationCache,
    MutationCacheNotifyEvent
  >()
  const subscriptions: DevtoolsSubscriptions = {
    queryCacheSubscriptions,
    mutationCacheSubscriptions,
  }
  return (
    <DevtoolsSubscriptionsContext.Provider value={subscriptions}>
      {props.children}
    </DevtoolsSubscriptionsContext.Provider>
  )
}

export function useDevtoolsSubscriptions() {
  const subscriptions = useContext(DevtoolsSubscriptionsContext)
  if (!subscriptions) throw new Error('Missing DevtoolsSubscriptionsProvider')
  return subscriptions
}
