import { vi } from 'vitest'
import { Show, createSignal, createTrackedEffect, onCleanup } from 'solid-js'
import { onlineManager } from '@tanstack/query-core'
import type { ParentProps } from 'solid-js'
import type { MockInstance } from 'vitest'

export function Blink(
  props: {
    duration: number
  } & ParentProps,
) {
  const [shouldShow, setShouldShow] = createSignal<boolean>(true)

  createTrackedEffect(() => {
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

export function mockOnlineManagerIsOnline(
  value: boolean,
): MockInstance<() => boolean> {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}

export function setActTimeout(fn: () => void, ms?: number) {
  return setTimeout(() => {
    fn()
  }, ms)
}
