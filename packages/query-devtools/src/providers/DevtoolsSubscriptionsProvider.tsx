import { DevtoolsSubscriptionsContext } from '../contexts/DevtoolsSubscriptionsContext'
import { createCacheSubscriptionRegistry } from '../createCacheSubscriptionRegistry'
import type {
  MutationCache,
  MutationCacheNotifyEvent,
  QueryCache,
  QueryCacheNotifyEvent,
} from '@tanstack/query-core'
import type { ParentProps } from 'solid-js'
import type { DevtoolsSubscriptions } from '../contexts/types'

/**
 * Provides the query and mutation cache subscription registries to its children.
 * @param props - The `children` to render.
 * @returns The `children`, wrapped in the context provider.
 */
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
