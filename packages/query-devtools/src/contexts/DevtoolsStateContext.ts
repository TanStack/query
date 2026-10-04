import { createContext, useContext } from 'solid-js'
import type { DevtoolsState } from './types'

export const DevtoolsStateContext = createContext<DevtoolsState>()

/**
 * Returns the devtools selection and panel state provided by `DevtoolsStateProvider`.
 * @returns The selection and panel state.
 * @throws {Error} If there is no `DevtoolsStateProvider` above.
 */
export function useDevtoolsState() {
  const state = useContext(DevtoolsStateContext)
  if (!state) throw new Error('Missing DevtoolsStateProvider')
  return state
}
