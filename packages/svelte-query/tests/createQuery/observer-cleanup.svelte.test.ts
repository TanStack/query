import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  createInfiniteQuery,
  createQuery,
} from '../../src/index.js'
import Base from './Base.svelte'

describe('effect root query cleanup', () => {
  let client: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  afterEach(() => {
    client.clear()
    vi.useRealTimers()
  })

  describe.each(['query', 'infinite query'] as const)('%s', (kind) => {
    it.each(['success', 'error', 'disabled'] as const)(
      'removes the observer after disposing a %s query root',
      async (state) => {
        const key = ['root-cleanup', kind, state]
        const queryFn = vi.fn(() => {
          if (state === 'error')
            return Promise.reject(new Error('expected failure'))
          return Promise.resolve('data')
        })
        const options = () => ({
          queryKey: key,
          queryFn,
          enabled: state !== 'disabled',
          gcTime: 10,
          initialPageParam: 0,
          getNextPageParam: () => undefined,
        })
        const dispose = $effect.root(() => {
          if (kind === 'query') createQuery(options, () => client)
          else createInfiniteQuery(options, () => client)
        })

        try {
          flushSync()
          await vi.advanceTimersByTimeAsync(0)
          const query = client.getQueryCache().find({ queryKey: key })!
          expect(query.getObserversCount()).toBe(1)
          expect(query.state.status).toBe(
            state === 'disabled' ? 'pending' : state,
          )

          dispose()

          expect.soft(query.getObserversCount()).toBe(0)
          await vi.advanceTimersByTimeAsync(20)
          expect(client.getQueryCache().find({ queryKey: key })).toBeUndefined()
        } finally {
          dispose()
        }
      },
    )

    it('does not retain an observer when disposed before effects run', () => {
      const key = ['early-root-cleanup', kind]
      const options = () => ({
        queryKey: key,
        enabled: false,
        initialPageParam: 0,
        getNextPageParam: () => undefined,
      })
      const dispose = $effect.root(() => {
        if (kind === 'query') createQuery(options, () => client)
        else createInfiniteQuery(options, () => client)
      })

      try {
        dispose()
        flushSync()
        expect(
          client.getQueryCache().find({ queryKey: key })!.getObserversCount(),
        ).toBe(0)
      } finally {
        dispose()
      }
    })
  })

  it('aborts a signal-consuming request when its root is disposed', () => {
    let signal: AbortSignal | undefined
    const dispose = $effect.root(() => {
      createQuery(
        () => ({
          queryKey: ['pending-root'],
          queryFn: (context) => {
            signal = context.signal
            return new Promise<string>(() => {})
          },
        }),
        () => client,
      )
    })

    try {
      flushSync()
      expect(signal?.aborted).toBe(false)
      dispose()
      expect(signal?.aborted).toBe(true)
    } finally {
      dispose()
    }
  })

  it('stops interval refetches when its root is disposed', async () => {
    const queryFn = vi.fn(() => Promise.resolve('data'))
    const dispose = $effect.root(() => {
      createQuery(
        () => ({
          queryKey: ['polling-root'],
          queryFn,
          refetchInterval: 10,
          refetchIntervalInBackground: true,
        }),
        () => client,
      )
    })

    try {
      flushSync()
      await vi.advanceTimersByTimeAsync(0)
      expect(queryFn).toHaveBeenCalledTimes(1)
      dispose()
      await vi.advanceTimersByTimeAsync(30)
      expect(queryFn).toHaveBeenCalledTimes(1)
    } finally {
      dispose()
    }
  })

  it('cleans up a normal component subscription on unmount', async () => {
    const key = ['component-control']
    const view = render(Base, {
      queryClient: client,
      options: () => ({
        queryKey: key,
        queryFn: () => Promise.resolve('data'),
      }),
    })
    await vi.advanceTimersByTimeAsync(0)
    const query = client.getQueryCache().find({ queryKey: key })!
    expect(query.getObserversCount()).toBe(1)
    await view.unmount()
    expect(query.getObserversCount()).toBe(0)
  })

  it('cleans up after the subscription has changed clients', () => {
    const replacement = new QueryClient()
    let selected = $state(client)
    const key = ['changed-client-control']
    const dispose = $effect.root(() => {
      createQuery(
        () => ({ queryKey: key, enabled: false }),
        () => selected,
      )
    })

    try {
      flushSync()
      const original = client.getQueryCache().find({ queryKey: key })!
      expect(original.getObserversCount()).toBe(1)
      selected = replacement
      flushSync()
      expect(original.getObserversCount()).toBe(0)
      const next = replacement.getQueryCache().find({ queryKey: key })!
      expect(next.getObserversCount()).toBe(1)
      dispose()
      expect(next.getObserversCount()).toBe(0)
    } finally {
      dispose()
      replacement.clear()
    }
  })
})
