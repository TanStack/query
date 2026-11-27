import { describe, expect, it } from 'vitest'
import {
  MutationObserver,
  QueryClient,
  dehydrate,
  hydrate,
  onlineManager,
  serialScope,
} from '..'
import { clearQueryClient, resumePausedMutations } from '../runtime/queryClient'

describe('serialScope', () => {
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
