import { createContext, useContext } from 'solid-js'
import type { DevtoolsSubscriptions } from './types'

export const DevtoolsSubscriptionsContext =
  createContext<DevtoolsSubscriptions>()

export function useDevtoolsSubscriptions() {
  const subscriptions = useContext(DevtoolsSubscriptionsContext)
  if (!subscriptions) throw new Error('Missing DevtoolsSubscriptionsProvider')
  return subscriptions
}
