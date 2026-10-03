import { createContext, useContext } from 'solid-js'
import type { DevtoolsState } from './types'

export const DevtoolsStateContext = createContext<DevtoolsState>()

export function useDevtoolsState() {
  const state = useContext(DevtoolsStateContext)
  if (!state) throw new Error('Missing DevtoolsStateProvider')
  return state
}
