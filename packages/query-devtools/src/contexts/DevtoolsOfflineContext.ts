import { createContext, useContext } from 'solid-js'
import type { DevtoolsOfflineState } from './types'

export const DevtoolsOfflineContext = createContext<DevtoolsOfflineState>()

/**
 * Returns the devtools offline state provided by `DevtoolsOfflineProvider`.
 * @returns The offline state.
 * @throws {Error} If there is no `DevtoolsOfflineProvider` above.
 */
export function useDevtoolsOffline() {
  const state = useContext(DevtoolsOfflineContext)
  if (!state) throw new Error('Missing DevtoolsOfflineProvider')
  return state
}
