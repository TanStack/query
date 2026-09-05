import { afterEach, describe, expect, it, vi } from 'vitest'
import { Component, provideZonelessChangeDetection } from '@angular/core'
import { render } from '@testing-library/angular'
import {
  QueryClient,
  injectQuery,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'
import { withBroadcastQueryClient } from '../with-broadcast-query-client'

const mockState = vi.hoisted(() => {
  let resolveRestore: (() => void) | undefined
  const cleanup = vi.fn()

  return {
    resolveRestore: () => resolveRestore?.(),
    cleanup,
    restore: vi.fn(() => {
      const restorePromise = new Promise<void>((resolve) => {
        resolveRestore = resolve
      })
      return [cleanup, restorePromise] as const
    }),
  }
})

vi.mock('@tanstack/query-broadcast-client-experimental', () => ({
  broadcastQueryClientRestore: mockState.restore,
}))

afterEach(() => {
  mockState.restore.mockClear()
  mockState.cleanup.mockReset()
})

describe('withBroadcastQueryClient', () => {
  it('holds an initially cached query until bootstrap completes', async () => {
    const queryKey = ['broadcast-bootstrap']
    const queryFn = vi.fn().mockResolvedValue('network')
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKey, 'from-cache')

    @Component({
      template: '<div>{{ state.data() ?? state.fetchStatus() }}</div>',
    })
    class Page {
      state = injectQuery(() => ({
        queryKey,
        queryFn,
        staleTime: Infinity,
      }))
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withBroadcastQueryClient({ broadcastChannel: 'test-channel' }),
        ),
      ],
    })

    expect(rendered.getByText('from-cache')).toBeInTheDocument()
    expect(queryFn).not.toHaveBeenCalled()
    expect(mockState.restore).toHaveBeenCalledWith({
      broadcastChannel: 'test-channel',
      queryClient,
    })

    mockState.resolveRestore()
    await rendered.fixture.whenStable()

    expect(rendered.getByText('from-cache')).toBeInTheDocument()
    expect(queryFn).not.toHaveBeenCalled()

    rendered.fixture.destroy()
  })

  it('allows a stale query to fetch after bootstrap completes', async () => {
    const queryKey = ['broadcast-stale-bootstrap']
    const queryFn = vi.fn().mockResolvedValue('network')
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKey, 'stale', { updatedAt: 0 })

    @Component({
      template: '<div>{{ state.data() ?? state.fetchStatus() }}</div>',
    })
    class Page {
      state = injectQuery(() => ({
        queryKey,
        queryFn,
        staleTime: 0,
      }))
    }

    const rendered = await render(Page, {
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(
          queryClient,
          withBroadcastQueryClient({ broadcastChannel: 'test-channel' }),
        ),
      ],
    })

    expect(queryFn).not.toHaveBeenCalled()
    mockState.resolveRestore()
    await Promise.resolve()
    rendered.fixture.detectChanges()
    await rendered.fixture.whenStable()
    rendered.fixture.detectChanges()

    expect(queryFn).toHaveBeenCalledOnce()
    rendered.fixture.destroy()
  })
})
