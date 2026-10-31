import { assertType, describe, expectTypeOf, it } from 'vitest'
import {
  createNotifyManager,
  defaultScheduler,
  notifyManager,
} from '../notifyManager'

describe('notifyManager', () => {
  it('should expose the same type as the factory', () => {
    expectTypeOf(notifyManager).toEqualTypeOf<
      ReturnType<typeof createNotifyManager>
    >()
  })

  it('should expose every method as readonly', () => {
    type Manager = ReturnType<typeof createNotifyManager>

    expectTypeOf<Manager>().toEqualTypeOf<{
      readonly [K in keyof Manager]: Manager[K]
    }>()
  })

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

  describe('batch', () => {
    it('should pass the return type of the callback through', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(localNotifyManager.batch(() => 5)).toEqualTypeOf<number>()
      expectTypeOf(
        localNotifyManager.batch(() => 'im happy' as const),
      ).toEqualTypeOf<'im happy'>()
      expectTypeOf(localNotifyManager.batch(() => ({ a: 1 }))).toEqualTypeOf<{
        a: number
      }>()
    })

    it('should be void when the callback returns nothing', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(localNotifyManager.batch(() => {})).toEqualTypeOf<void>()
    })

    it('should only accept a callback taking no arguments', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(localNotifyManager.batch).parameters.toEqualTypeOf<
        [callback: () => unknown]
      >()
    })
  })

  describe('batchCalls', () => {
    it('should catch improper signatures of the wrapped function', () => {
      const localNotifyManager = createNotifyManager()

      // we define some fn with its signature:
      const fn: (a: string, b: number) => string = (a, b) => a + b

      // now someFn expect to be called with args [a: string, b: number]
      const someFn = localNotifyManager.batchCalls(fn)

      expectTypeOf(someFn).parameters.toEqualTypeOf<Parameters<typeof fn>>()
      assertType<Parameters<typeof someFn>>(['im happy', 4])
      assertType<Parameters<typeof someFn>>([
        'im not happy',
        // @ts-expect-error
        false,
      ])
    })

    it('should discard the return type of the wrapped function', () => {
      const localNotifyManager = createNotifyManager()

      const fn: (a: string) => string = (a) => a
      const someFn = localNotifyManager.batchCalls(fn)

      expectTypeOf(someFn).returns.toEqualTypeOf<void>()
    })

    it('should accept a callback without parameters', () => {
      const localNotifyManager = createNotifyManager()

      const someFn = localNotifyManager.batchCalls(() => {})

      expectTypeOf(someFn).parameters.toEqualTypeOf<[]>()
    })

    it('should preserve optional parameters', () => {
      const localNotifyManager = createNotifyManager()

      const someFn = localNotifyManager.batchCalls(
        (_a: string, _b?: number) => {},
      )

      expectTypeOf(someFn).parameters.toEqualTypeOf<[_a: string, _b?: number]>()
    })

    it('should preserve rest parameters', () => {
      const localNotifyManager = createNotifyManager()

      const someFn = localNotifyManager.batchCalls(
        (..._args: Array<number>) => {},
      )

      expectTypeOf(someFn).parameters.toEqualTypeOf<Array<number>>()
    })

    it('should constrain its type argument to an argument tuple', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(
        localNotifyManager.batchCalls<[a: string, b: number]>((_a, _b) => {}),
      ).parameters.toEqualTypeOf<[a: string, b: number]>()

      // @ts-expect-error a non-array type does not satisfy Array<unknown>
      localNotifyManager.batchCalls<string>(() => {})
    })
  })

  describe('schedule', () => {
    it('should only accept a callback taking no arguments', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(localNotifyManager.schedule).parameters.toEqualTypeOf<
        [callback: () => void]
      >()
    })

    it('should return void', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(localNotifyManager.schedule).returns.toEqualTypeOf<void>()
    })
  })

  describe('setNotifyFunction', () => {
    it('should only accept a function taking a callback', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(
        localNotifyManager.setNotifyFunction,
      ).parameters.toEqualTypeOf<[fn: (callback: () => void) => void]>()
    })

    it('should return void', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(
        localNotifyManager.setNotifyFunction,
      ).returns.toEqualTypeOf<void>()
    })
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

  describe('setScheduler', () => {
    it('should only accept a function taking a callback', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(localNotifyManager.setScheduler).parameters.toEqualTypeOf<
        [fn: (callback: () => void) => void]
      >()
    })

    it('should accept the exported defaultScheduler', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(defaultScheduler).toEqualTypeOf<
        Parameters<typeof localNotifyManager.setScheduler>[0]
      >()
    })

    it('should return void', () => {
      const localNotifyManager = createNotifyManager()

      expectTypeOf(
        localNotifyManager.setScheduler,
      ).returns.toEqualTypeOf<void>()
    })
  })
})
