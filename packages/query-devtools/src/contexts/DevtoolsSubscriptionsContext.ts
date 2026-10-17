import { createContext, useContext } from 'solid-js'
import type { DevtoolsSubscriptions } from './types'

export const DevtoolsSubscriptionsContext =
  createContext<DevtoolsSubscriptions>()

/**
 * Returns the devtools cache subscription registries provided by `DevtoolsSubscriptionsProvider`.
 * @returns The cache subscription registries.
 * @throws {Error} If there is no `DevtoolsSubscriptionsProvider` above.
 */
export function useDevtoolsSubscriptions() {
  const subscriptions = useContext(DevtoolsSubscriptionsContext)
  if (!subscriptions) throw new Error('Missing DevtoolsSubscriptionsProvider')
  return subscriptions
}
