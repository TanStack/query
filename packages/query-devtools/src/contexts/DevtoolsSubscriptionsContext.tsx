import { createContext, useContext } from 'solid-js'
import { createCacheSubscriptionRegistry } from '../createCacheSubscriptionRegistry'
import type {
  MutationCache,
  MutationCacheNotifyEvent,
  QueryCache,
  QueryCacheNotifyEvent,
} from '@tanstack/query-core'
import type { ParentProps } from 'solid-js'

function createDevtoolsSubscriptions() {
  const queryCacheSubscriptions = createCacheSubscriptionRegistry<
    QueryCache,
    QueryCacheNotifyEvent
  >()
  const mutationCacheSubscriptions = createCacheSubscriptionRegistry<
    MutationCache,
    MutationCacheNotifyEvent
  >()
  return { queryCacheSubscriptions, mutationCacheSubscriptions }
}

const DevtoolsSubscriptionsContext =
  createContext<ReturnType<typeof createDevtoolsSubscriptions>>()

export function DevtoolsSubscriptionsProvider(props: ParentProps) {
  const subscriptions = createDevtoolsSubscriptions()
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
