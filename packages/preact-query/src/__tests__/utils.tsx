import { environmentManager, isServer } from '@tanstack/query-core'
import { act, render } from '@testing-library/preact'
import type { ComponentChildren, VNode } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { vi } from 'vitest'
import type { MockInstance } from 'vitest'

import { QueryClientProvider, onlineManager } from '..'
import type { QueryClient } from '..'

export function renderWithClient(
  client: QueryClient,
  ui: VNode,
): ReturnType<typeof render> {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
  return {
    ...result,
    rerender: (rerenderUi: VNode) =>
      rerender(
        <QueryClientProvider client={client}>{rerenderUi}</QueryClientProvider>,
      ),
  } as any
}

export function Blink({
  duration,
  children,
}: {
  duration: number
  children: ComponentChildren
}) {
  const [shouldShow, setShouldShow] = useState<boolean>(true)

  useEffect(() => {
    setShouldShow(true)
    const timeout = setActTimeout(() => setShouldShow(false), duration)
    return () => {
      clearTimeout(timeout)
    }
  }, [duration, children])

  return shouldShow ? <>{children}</> : <>off</>
}

export function mockOnlineManagerIsOnline(
  value: boolean,
): MockInstance<() => boolean> {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}

export function setActTimeout(fn: () => void, ms?: number) {
  return setTimeout(() => {
    act(() => {
      fn()
    })
  }, ms)
}

export function setIsServer(value: boolean) {
  environmentManager.setIsServer(() => value)
  return () => {
    environmentManager.setIsServer(() => isServer)
  }
}
