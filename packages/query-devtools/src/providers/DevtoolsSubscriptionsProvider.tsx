import { createCacheSubscriptionRegistry } from '../createCacheSubscriptionRegistry'
import { DevtoolsSubscriptionsContext } from '../contexts/DevtoolsSubscriptionsContext'
import type {
  MutationCache,
  MutationCacheNotifyEvent,
  QueryCache,
  QueryCacheNotifyEvent,
} from '@tanstack/query-core'
import type { DevtoolsSubscriptions } from '../contexts/types'
import type { ParentProps } from 'solid-js'

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
