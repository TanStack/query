import { createEffect, createSignal, onCleanup } from 'solid-js'
import { useQueryDevtoolsContext } from '../contexts/QueryDevtoolsContext'
import { DevtoolsOfflineContext } from '../contexts/DevtoolsOfflineContext'
import type { DevtoolsOfflineState } from '../contexts/types'
import type { ParentProps } from 'solid-js'

/**
 * Provides its children with the offline state of the devtools `onlineManager`, and a function
 * that toggles it.
 * @param props - The `children` to render.
 * @returns The `children`, wrapped in the context provider.
 */
export function DevtoolsOfflineProvider(props: ParentProps) {
  const [offline, setOffline] = createSignal(false)
  const context = useQueryDevtoolsContext()

  createEffect(() => {
    const manager = context.onlineManager
    setOffline(!manager.isOnline())
    const unsubscribe = manager.subscribe((online) => setOffline(!online))
    onCleanup(unsubscribe)
  })

  const state: DevtoolsOfflineState = {
    offline,
    toggleOffline: () => {
      const manager = context.onlineManager
      manager.setOnline(!manager.isOnline())
    },
  }

  return (
    <DevtoolsOfflineContext.Provider value={state}>
      {props.children}
    </DevtoolsOfflineContext.Provider>
  )
}
