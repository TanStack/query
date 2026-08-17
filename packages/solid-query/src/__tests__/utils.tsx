import { vi } from 'vitest'
import { Show, createEffect, createSignal, onCleanup } from 'solid-js'
import { onlineManager } from '@tanstack/query-core'
import { render } from '@solidjs/testing-library'
import { QueryClientProvider } from '..'
import type { JSX, ParentProps } from 'solid-js'
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
