import { describe, expectTypeOf, it } from 'vitest'
import { timeoutManager } from '..'
import { defaultTimeoutProvider, systemSetTimeoutZero } from '../timeoutManager'
import type {
  ManagedTimerId,
  TimeoutCallback,
  TimeoutManager,
  TimeoutProvider,
} from '..'

describe('timeoutManager', () => {
  describe('TimeoutCallback', () => {
    it('should take a single void argument and return void', () => {
      expectTypeOf<TimeoutCallback>().toEqualTypeOf<(_: void) => void>()
    })

    it('should be callable without an argument', () => {
      // A single `void` parameter is what lets `setTimeout(resolve, n)` and a
      // zero-argument callback both type check.
      const callback: TimeoutCallback = () => {}

      expectTypeOf(callback).toEqualTypeOf<TimeoutCallback>()
      // A lone `void` parameter is optional at the call site, so the tuple is
      // `[] | [void]` and the callback may be called with no argument at all.
      expectTypeOf<Parameters<TimeoutCallback>['length']>().toEqualTypeOf<
        0 | 1
      >()
    })

    it('should reject a callback that requires a value argument', () => {
      // @ts-expect-error a timeout callback cannot require a value argument
      const invalid: TimeoutCallback = (_: number) => {}

      expectTypeOf(invalid).toBeFunction()
      expectTypeOf<TimeoutCallback>().parameter(0).toBeVoid()
      expectTypeOf<ReturnType<TimeoutCallback>>().toEqualTypeOf<void>()
    })
  })

  describe('ManagedTimerId', () => {
    it('should be a number or a primitive-coercible object', () => {
      expectTypeOf<ManagedTimerId>().toEqualTypeOf<
        number | { [Symbol.toPrimitive]: () => number }
      >()
    })

    it('should accept a number and a primitive-coercible object', () => {
      expectTypeOf<Extract<ManagedTimerId, number>>().toEqualTypeOf<number>()
      expectTypeOf<Exclude<ManagedTimerId, number>>().toEqualTypeOf<{
        [Symbol.toPrimitive]: () => number
      }>()
    })

    it('should reject a value that cannot be coerced to a number', () => {
      // @ts-expect-error a timer id cannot be a string
      const invalid: ManagedTimerId = 'timer'

      expectTypeOf(invalid).toEqualTypeOf<
        number | { [Symbol.toPrimitive]: () => number }
      >()
      expectTypeOf<Extract<ManagedTimerId, string>>().toEqualTypeOf<never>()
    })
  })

  describe('TimeoutProvider', () => {
    describe('setTimeout', () => {
      it('should take a callback and a delay and return the timer id', () => {
        expectTypeOf<TimeoutProvider['setTimeout']>().toEqualTypeOf<
          (callback: TimeoutCallback, delay: number) => ManagedTimerId
        >()
      })
    })

    describe('clearTimeout', () => {
      it('should take the timer id or undefined and return void', () => {
        expectTypeOf<TimeoutProvider['clearTimeout']>().toEqualTypeOf<
          (timeoutId: ManagedTimerId | undefined) => void
        >()
      })
    })

    describe('setInterval', () => {
      it('should take a callback and a delay and return the timer id', () => {
        expectTypeOf<TimeoutProvider['setInterval']>().toEqualTypeOf<
          (callback: TimeoutCallback, delay: number) => ManagedTimerId
        >()
      })
    })

    describe('clearInterval', () => {
      it('should take the timer id or undefined and return void', () => {
        expectTypeOf<TimeoutProvider['clearInterval']>().toEqualTypeOf<
          (intervalId: ManagedTimerId | undefined) => void
        >()
      })
    })

    it('should have every member readonly', () => {
      // `Pick` preserves the `readonly` modifier that an indexed access strips.
      expectTypeOf<TimeoutProvider>().toEqualTypeOf<{
        readonly setTimeout: (
          callback: TimeoutCallback,
          delay: number,
        ) => ManagedTimerId
        readonly clearTimeout: (timeoutId: ManagedTimerId | undefined) => void
        readonly setInterval: (
          callback: TimeoutCallback,
          delay: number,
        ) => ManagedTimerId
        readonly clearInterval: (intervalId: ManagedTimerId | undefined) => void
      }>()
    })

    it('should default its timer id to a managed timer id', () => {
      expectTypeOf<TimeoutProvider>().toEqualTypeOf<
        TimeoutProvider<ManagedTimerId>
      >()
    })

    it('should carry a narrowed timer id through its members', () => {
      expectTypeOf<TimeoutProvider<number>['setTimeout']>().toEqualTypeOf<
        (callback: TimeoutCallback, delay: number) => number
      >()
      expectTypeOf<TimeoutProvider<number>['clearTimeout']>().toEqualTypeOf<
        (timeoutId: number | undefined) => void
      >()
    })

    it('should constrain its timer id to a managed timer id', () => {
      // @ts-expect-error a string is not a managed timer id
      expectTypeOf<TimeoutProvider<string>>().toBeObject()

      expectTypeOf<TimeoutProvider<number>>().toBeObject()
    })

    it('should only expose its documented members', () => {
      expectTypeOf<keyof TimeoutProvider>().toEqualTypeOf<
        'setTimeout' | 'clearTimeout' | 'setInterval' | 'clearInterval'
      >()
    })
  })

  describe('defaultTimeoutProvider', () => {
    it('should be a timeout provider of the default timer id', () => {
      expectTypeOf(defaultTimeoutProvider).toEqualTypeOf<TimeoutProvider>()
    })

    it('should not narrow its timer id to the platform one', () => {
      // The provider is declared as `TimeoutProvider`, not
      // `TimeoutProvider<ReturnType<typeof setTimeout>>`, so swapping it for a
      // custom provider stays type safe across environments.
      expectTypeOf(
        defaultTimeoutProvider.setTimeout,
      ).returns.toEqualTypeOf<ManagedTimerId>()
      expectTypeOf(
        defaultTimeoutProvider.setInterval,
      ).returns.toEqualTypeOf<ManagedTimerId>()
    })

    it('should be accepted by setTimeoutProvider', () => {
      expectTypeOf(
        timeoutManager.setTimeoutProvider(defaultTimeoutProvider),
      ).toEqualTypeOf<void>()
    })
  })

  describe('TimeoutManager', () => {
    describe('setTimeoutProvider', () => {
      it('should take a provider and return void', () => {
        expectTypeOf(timeoutManager.setTimeoutProvider).toEqualTypeOf<
          <TTimerId extends ManagedTimerId>(
            provider: TimeoutProvider<TTimerId>,
          ) => void
        >()
      })

      it('should reject a provider that is not a timeout provider', () => {
        // @ts-expect-error a plain object is not a timeout provider
        timeoutManager.setTimeoutProvider({})

        expectTypeOf(
          timeoutManager.setTimeoutProvider({
            setTimeout: (_callback, _delay) => 1,
            clearTimeout: (_timeoutId) => {},
            setInterval: (_callback, _delay) => 1,
            clearInterval: (_intervalId) => {},
          }),
        ).toEqualTypeOf<void>()
      })

      it('should infer the timer id from the provider', () => {
        timeoutManager.setTimeoutProvider({
          setTimeout: (callback, delay) => {
            expectTypeOf(callback).toEqualTypeOf<TimeoutCallback>()
            expectTypeOf(delay).toEqualTypeOf<number>()
            return 1
          },
          clearTimeout: (timeoutId) => {
            // The timer id is inferred from `setTimeout`'s literal return.
            expectTypeOf(timeoutId).toEqualTypeOf<1 | undefined>()
          },
          setInterval: (_callback, _delay) => 1,
          clearInterval: (_intervalId) => {},
        })
      })
    })

    describe('setTimeout', () => {
      it('should take a callback and a delay and return the timer id', () => {
        expectTypeOf(timeoutManager.setTimeout).toEqualTypeOf<
          (callback: TimeoutCallback, delay: number) => ManagedTimerId
        >()
      })

      it('should require the delay', () => {
        // @ts-expect-error the delay is required
        timeoutManager.setTimeout(() => {})

        expectTypeOf(
          timeoutManager.setTimeout(() => {}, 0),
        ).toEqualTypeOf<ManagedTimerId>()
      })
    })

    describe('clearTimeout', () => {
      it('should take the timer id or undefined and return void', () => {
        expectTypeOf(timeoutManager.clearTimeout).toEqualTypeOf<
          (timeoutId: ManagedTimerId | undefined) => void
        >()
      })
    })

    describe('setInterval', () => {
      it('should take a callback and a delay and return the timer id', () => {
        expectTypeOf(timeoutManager.setInterval).toEqualTypeOf<
          (callback: TimeoutCallback, delay: number) => ManagedTimerId
        >()
      })
    })

    describe('clearInterval', () => {
      it('should take the timer id or undefined and return void', () => {
        expectTypeOf(timeoutManager.clearInterval).toEqualTypeOf<
          (intervalId: ManagedTimerId | undefined) => void
        >()
      })
    })

    it('should be the type of the exported singleton', () => {
      expectTypeOf(timeoutManager).toEqualTypeOf<TimeoutManager>()
    })

    it('should only expose its documented members', () => {
      expectTypeOf<keyof TimeoutManager>().toEqualTypeOf<
        | 'setTimeoutProvider'
        | 'setTimeout'
        | 'clearTimeout'
        | 'setInterval'
        | 'clearInterval'
      >()
    })
  })

  describe('systemSetTimeoutZero', () => {
    it('should take a callback and return void', () => {
      expectTypeOf(systemSetTimeoutZero).toEqualTypeOf<
        (callback: TimeoutCallback) => void
      >()
    })

    it('should require the callback', () => {
      // @ts-expect-error the callback is required
      systemSetTimeoutZero()

      expectTypeOf(systemSetTimeoutZero(() => {})).toEqualTypeOf<void>()
    })

    it('should reject a callback that requires a value argument', () => {
      // @ts-expect-error a timeout callback cannot require a value argument
      systemSetTimeoutZero((_: number) => {})

      expectTypeOf(systemSetTimeoutZero(() => {})).toEqualTypeOf<void>()
    })
  })
})
