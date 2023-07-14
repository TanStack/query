import type { QueryClientConfig } from '@tanstack/query-core'
import { QueryClient } from '../QueryClient'
import type { ParentProps } from 'solid-js'
import { createEffect, createSignal, onCleanup, Show } from 'solid-js'
import { vi } from 'vitest'
import { onlineManager } from '@tanstack/query-core'

let queryKeyCount = 0
export function queryKey(): Array<string> {
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

export function mockVisibilityState(value: DocumentVisibilityState) {
  return vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
}

export function mockOnlineManagerIsOnline(value: boolean) {
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
 * Assert the parameter is of a specific type.
 */
export function expectType<T>(_: T): void {
  return undefined
}

/**
 * Assert the parameter is not typed as `any`
 */
export function expectTypeNotAny<T>(_: 0 extends 1 & T ? never : T): void {
  return undefined
}
