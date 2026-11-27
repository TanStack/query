import { createKey } from '@tanstack/query-test-utils'
import { describe, expect, it, vi } from 'vitest'
import { QueriesObserver, QueryClient } from '../..'
import { createNotifyManager } from '../../notifyManager'

describe('framework adapter APIs', () => {
  it('should use custom batch notify function', async () => {
    const notifyManagerTest = createNotifyManager()
    const batchNotifySpy = vi.fn<(callback: () => void) => void>((cb) => cb())
    const callbackSpy1 = vi.fn<() => void>()
    const callbackSpy2 = vi.fn<() => void>()

    notifyManagerTest.setBatchNotifyFunction(batchNotifySpy)

    notifyManagerTest.batch(() => {
      notifyManagerTest.schedule(callbackSpy1)
      notifyManagerTest.schedule(callbackSpy2)
    })

    await Promise.resolve()
    expect(batchNotifySpy).toHaveBeenCalledWith(expect.any(Function))
    expect(callbackSpy1).toHaveBeenCalledWith()
    expect(callbackSpy2).toHaveBeenCalledWith()
  })

  it('should return current queries via getQueries', async () => {
    const queryClient = new QueryClient()
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const unsubscribe = observer.subscribe(() => undefined)
    await Promise.resolve()

    const queries = observer.getQueries()

    expect(queries).toHaveLength(2)
    expect(queries[0]?.queryKey).toStrictEqual(key1)
    expect(queries[1]?.queryKey).toStrictEqual(key2)

    unsubscribe()
    queryClient.clear()
  })
})
