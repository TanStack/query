import { vi } from 'vitest'
import { Show, createSignal, createTrackedEffect } from 'solid-js'
import { onlineManager } from '@tanstack/query-core'
import { render } from '@solidjs/testing-library'
import { QueryClientProvider } from '..'
import type { JSX } from '@solidjs/web'
import type { ParentProps } from 'solid-js'
import type { MockInstance } from 'vitest'
import type { QueryClient } from '..'

export function renderWithClient(
  client: QueryClient,
  ui: () => JSX.Element,
): ReturnType<typeof render> {
  return render(() => (
    <QueryClientProvider client={client}>{ui()}</QueryClientProvider>
  ))
}

export function Blink(
  props: {
    duration: number
  } & ParentProps,
) {
  const [shouldShow, setShouldShow] = createSignal<boolean>(true)

  createTrackedEffect(() => {
    setShouldShow(true)
    const timeout = setActTimeout(() => setShouldShow(false), props.duration)
    return () => clearTimeout(timeout)
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

/**
 * Widen a query's `data` read back to `T | undefined`.
 *
 * The public result types declare `data` non-nullable because reads are
 * expected to suspend into a Loading boundary until the value exists. Tests
 * that intentionally observe pending or error states read `data` while the
 * underlying value is still undefined at runtime — this helper makes that
 * mismatch explicit at the call site so their guards typecheck as necessary.
 */
export function pendingData<T>(data: T): T | undefined {
  return data
}
