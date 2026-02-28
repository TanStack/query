import { vi } from 'vitest'
import * as React from 'react'
import { act, render } from '@testing-library/react'
import { environmentManager, isServer } from '@tanstack/query-core'
import { QueryClientProvider, onlineManager } from '..'
import type { QueryClient } from '..'
import type { MockInstance } from 'vitest'

export function renderWithClient(
  client: QueryClient,
  ui: React.ReactElement,
): ReturnType<typeof render> {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
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
  children: React.ReactNode
}) {
  const [shouldShow, setShouldShow] = React.useState<boolean>(true)

  React.useEffect(() => {
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
  environmentManager.setIsServer(value)
  return () => {
    environmentManager.setIsServer(() => isServer)
  }
}
