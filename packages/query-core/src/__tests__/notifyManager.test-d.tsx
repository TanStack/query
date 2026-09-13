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
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(notifyManagerTest.batch(() => 5)).toEqualTypeOf<number>()
      expectTypeOf(
        notifyManagerTest.batch(() => 'im happy' as const),
      ).toEqualTypeOf<'im happy'>()
      expectTypeOf(notifyManagerTest.batch(() => ({ a: 1 }))).toEqualTypeOf<{
        a: number
      }>()
    })

    it('should be void when the callback returns nothing', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(notifyManagerTest.batch(() => {})).toEqualTypeOf<void>()
    })

    it('should only accept a callback taking no arguments', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(notifyManagerTest.batch).parameters.toEqualTypeOf<
        [callback: () => unknown]
      >()
    })
  })

  describe('batchCalls', () => {
    it('should catch improper signatures of the wrapped function', () => {
      const notifyManagerTest = createNotifyManager()

      // we define some fn with its signature:
      const fn: (a: string, b: number) => string = (a, b) => a + b

      // now someFn expect to be called with args [a: string, b: number]
      const someFn = notifyManagerTest.batchCalls(fn)

      expectTypeOf(someFn).parameters.toEqualTypeOf<Parameters<typeof fn>>()
      assertType<Parameters<typeof someFn>>(['im happy', 4])
      assertType<Parameters<typeof someFn>>([
        'im not happy',
        // @ts-expect-error
        false,
      ])
    })

    it('should discard the return type of the wrapped function', () => {
      const notifyManagerTest = createNotifyManager()

      const fn: (a: string) => string = (a) => a
      const someFn = notifyManagerTest.batchCalls(fn)

      expectTypeOf(someFn).returns.toEqualTypeOf<void>()
    })

    it('should accept a callback without parameters', () => {
      const notifyManagerTest = createNotifyManager()

      const someFn = notifyManagerTest.batchCalls(() => {})

      expectTypeOf(someFn).parameters.toEqualTypeOf<[]>()
    })

    it('should preserve optional parameters', () => {
      const notifyManagerTest = createNotifyManager()

      const someFn = notifyManagerTest.batchCalls(
        (_a: string, _b?: number) => {},
      )

      expectTypeOf(someFn).parameters.toEqualTypeOf<[_a: string, _b?: number]>()
    })

    it('should preserve rest parameters', () => {
      const notifyManagerTest = createNotifyManager()

      const someFn = notifyManagerTest.batchCalls(
        (..._args: Array<number>) => {},
      )

      expectTypeOf(someFn).parameters.toEqualTypeOf<Array<number>>()
    })

    it('should constrain its type argument to an argument tuple', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(
        notifyManagerTest.batchCalls<[a: string, b: number]>((_a, _b) => {}),
      ).parameters.toEqualTypeOf<[a: string, b: number]>()

      // @ts-expect-error a non-array type does not satisfy Array<unknown>
      notifyManagerTest.batchCalls<string>(() => {})
    })
  })

  describe('schedule', () => {
    it('should only accept a callback taking no arguments', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(notifyManagerTest.schedule).parameters.toEqualTypeOf<
        [callback: () => void]
      >()
    })

    it('should return void', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(notifyManagerTest.schedule).returns.toEqualTypeOf<void>()
    })
  })

  describe('setNotifyFunction', () => {
    it('should only accept a function taking a callback', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(
        notifyManagerTest.setNotifyFunction,
      ).parameters.toEqualTypeOf<[fn: (callback: () => void) => void]>()
    })

    it('should return void', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(
        notifyManagerTest.setNotifyFunction,
      ).returns.toEqualTypeOf<void>()
    })
  })

  describe('setBatchNotifyFunction', () => {
    it('should only accept a function taking a callback', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(
        notifyManagerTest.setBatchNotifyFunction,
      ).parameters.toEqualTypeOf<[fn: (callback: () => void) => void]>()
    })

    it('should return void', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(
        notifyManagerTest.setBatchNotifyFunction,
      ).returns.toEqualTypeOf<void>()
    })
  })

  describe('setScheduler', () => {
    it('should only accept a function taking a callback', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(notifyManagerTest.setScheduler).parameters.toEqualTypeOf<
        [fn: (callback: () => void) => void]
      >()
    })

    it('should accept the exported defaultScheduler', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(defaultScheduler).toEqualTypeOf<
        Parameters<typeof notifyManagerTest.setScheduler>[0]
      >()
    })

    it('should return void', () => {
      const notifyManagerTest = createNotifyManager()

      expectTypeOf(notifyManagerTest.setScheduler).returns.toEqualTypeOf<void>()
    })
  })
})
