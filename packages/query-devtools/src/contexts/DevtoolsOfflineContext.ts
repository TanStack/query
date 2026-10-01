import { createContext, useContext } from 'solid-js'
import type { DevtoolsOfflineState } from './types'

export const DevtoolsOfflineContext = createContext<DevtoolsOfflineState>()

export function useDevtoolsOffline() {
  const state = useContext(DevtoolsOfflineContext)
  if (!state) throw new Error('Missing DevtoolsOfflineProvider')
  return state
}
