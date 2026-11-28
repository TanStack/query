import { describe, expect, it, vi } from 'vitest'
import {
  MutationObserver,
  QueryClient,
  dehydrate,
  hydrate,
  onlineManager,
  serialScope,
} from '..'
import { clearQueryClient, resumePausedMutations } from '../queryClient'

describe('serialScope', () => {
  it('queues mutations across independent module instances that share a cache', async () => {
    const client = new QueryClient()
    const started = Promise.withResolvers<void>()
    const finish = Promise.withResolvers<void>()
    const first = new MutationObserver(client, {
      scope: serialScope('orders'),
      mutationFn: async () => {
        started.resolve()
        await finish.promise
      },
    })
    vi.resetModules()
    const { serialScope: otherScope } = await import('../serialScope')
    const second = new MutationObserver(client, {
      scope: otherScope('orders'),
      mutationFn: () => Promise.resolve(),
    })
    const firstMutation = first.mutate(undefined)
    await started.promise
    const secondMutation = second.mutate(undefined)
    try {
      expect(second.getCurrentResult().isPaused).toBe(true)
    } finally {
      finish.resolve()
      await Promise.all([firstMutation, secondMutation])
      clearQueryClient(client)
    }
  })

  it('restores the queue from JSON and resumes its mutations in order', async () => {
    const source = new QueryClient()
    const started = Promise.withResolvers<void>()
    const release = Promise.withResolvers<void>()
    const events: Array<string> = []
    const target = new QueryClient({
      defaultOptions: {
        mutations: {
          mutationFn: async (value) => {
            events.push(`start ${value}`)
            if (value === 1) {
              started.resolve()
              await release.promise
            }
            events.push(`finish ${value}`)
          },
        },
      },
    })
    const wasOnline = onlineManager.isOnline()
    try {
      onlineManager.setOnline(false)
      const observer = new MutationObserver(source, {
        scope: serialScope('orders'),
        mutationFn: (value: number) => Promise.resolve(value),
      })
      const first = observer.mutate(1)
      const second = observer.mutate(2)
      const snapshot = JSON.parse(JSON.stringify(dehydrate(source)))
      expect(
        snapshot.mutations.map((m: { scope: unknown }) => m.scope),
      ).toStrictEqual([{ id: 'orders' }, { id: 'orders' }])

      hydrate(target, snapshot)
      onlineManager.setOnline(true)
      const resumed = resumePausedMutations(target)
      await started.promise
      expect(events).toStrictEqual(['start 1'])
      release.resolve()
      await resumed
      expect(events).toStrictEqual([
        'start 1',
        'finish 1',
        'start 2',
        'finish 2',
      ])
      await resumePausedMutations(source)
      await Promise.all([first, second])
    } finally {
      release.resolve()
      onlineManager.setOnline(wasOnline)
      clearQueryClient(source)
      clearQueryClient(target)
    }
  })
})
