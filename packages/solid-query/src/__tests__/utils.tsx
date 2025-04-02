import { vi } from 'vitest'
import { Show, createEffect, createSignal, onCleanup } from 'solid-js'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import type { QueryClientConfig } from '@tanstack/query-core'
import type { ParentProps } from 'solid-js'
import type { MockInstance } from 'vitest'

let queryKeyCount = 0
export function queryKey() {
  queryKeyCount++
  return [`query_${queryKeyCount}`]
}

export function Blink(
  props: {
    duration: number
  } & ParentProps,
) {
  const [shouldShow, setShouldShow] = createSignal<boolean>(true)

  createEffect(() => {
    setShouldShow(true)
    const timeout = setActTimeout(() => setShouldShow(false), props.duration)
    onCleanup(() => clearTimeout(timeout))
  })

  return (
    <Show when={shouldShow()} fallback={<>off</>}>
      <>{props.children}</>
    </Show>
  )
}

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}

export function mockVisibilityState(
  value: DocumentVisibilityState,
): MockInstance<() => DocumentVisibilityState> {
  return vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
}

export function mockOnlineManagerIsOnline(
  value: boolean,
): MockInstance<() => boolean> {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}

export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}

export function setActTimeout(fn: () => void, ms?: number) {
  return setTimeout(() => {
    fn()
  }, ms)
}
