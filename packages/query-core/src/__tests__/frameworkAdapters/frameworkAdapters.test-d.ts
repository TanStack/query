import { describe, expectTypeOf, it } from 'vitest'
import { QueriesObserver, QueryClient } from '../..'
import { createNotifyManager } from '../../notifyManager'
import type { Query } from '../..'

describe('framework adapter APIs', () => {
  it('should only expose its documented members', () => {
    expectTypeOf<keyof ReturnType<typeof createNotifyManager>>().toEqualTypeOf<
      | 'batch'
      | 'batchCalls'
      | 'schedule'
      | 'setNotifyFunction'
      | 'setBatchNotifyFunction'
      | 'setScheduler'
    >()
  })

  describe('setBatchNotifyFunction', () => {
    it('should only accept a function taking a callback', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(
        localNotifyManager.setBatchNotifyFunction,
      ).parameters.toEqualTypeOf<[fn: (callback: () => void) => void]>()
    })

    it('should return void', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(
        localNotifyManager.setBatchNotifyFunction,
      ).returns.toEqualTypeOf<void>()
    })
  })

  describe('getQueries', () => {
    it('should return the observed queries', () => {
      const observer = new QueriesObserver(new QueryClient(), [])

      expectTypeOf(observer.getQueries()).toEqualTypeOf<Array<Query>>()
    })
  })
})
