import { vi } from 'vitest'
import { Show, createEffect, createSignal, onCleanup } from 'solid-js'
import { onlineManager } from '@tanstack/query-core'
import { QueryClient } from '../QueryClient'
import type { QueryClientConfig } from '..'
import type { ParentProps } from 'solid-js'
import type { SpyInstance } from 'vitest'

let queryKeyCount = 0
export function queryKey() {
  queryKeyCount++
  return [`query_${queryKeyCount}`]
}

export const Blink = (
  props: {
    duration: number
  } & ParentProps,
) => {
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
): SpyInstance<[], DocumentVisibilityState> {
  return vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
}

export function mockOnlineManagerIsOnline(
  value: boolean,
): SpyInstance<[], boolean> {
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

/**
 * Assert the parameter is not typed as `any`
 */
export function expectTypeNotAny<T>(_: 0 extends 1 & T ? never : T): void {
  return undefined
}

export const doNotExecute = (_func: () => void) => true
