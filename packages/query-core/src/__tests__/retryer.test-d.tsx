import { describe, expectTypeOf, it } from 'vitest'
import {
  CancelledError,
  canFetch,
  createRetryer,
  isCancelledError,
} from '../retryer'
import type { RetryDelayValue, RetryValue, Retryer } from '../retryer'
import type { CancelOptions, DefaultError, NetworkMode } from '..'

class CustomError extends Error {
  name = 'CustomError' as const
}

describe('retryer', () => {
  describe('createRetryer', () => {
    it('should infer TData from the config fn', () => {
      expectTypeOf(
        createRetryer({
          fn: () => ({ value: 'data' }),
          networkMode: 'online',
          canRun: () => true,
        }),
      ).toEqualTypeOf<Retryer<{ value: string }>>()
    })

    it('should infer TData from a promise returned by the config fn', () => {
      expectTypeOf(
        createRetryer({
          fn: () => Promise.resolve({ value: 'data' }),
          networkMode: 'online',
          canRun: () => true,
        }),
      ).toEqualTypeOf<Retryer<{ value: string }>>()
    })

    it('should default TData to unknown', () => {
      expectTypeOf(
        createRetryer({
          fn: () => ({}) as unknown,
          networkMode: undefined,
          canRun: () => true,
        }),
      ).toEqualTypeOf<Retryer<unknown>>()
    })

    it('should default TError to DefaultError', () => {
      // The default is only observable at a call site: going through
      // `Parameters<typeof createRetryer>` instantiates the generic first, so
      // the callbacks come back already widened.
      createRetryer({
        fn: () => 'data',
        networkMode: 'online',
        canRun: () => true,
        onCancel: (error) => {
          expectTypeOf(error).toEqualTypeOf<DefaultError>()
        },
        onFail: (failureCount, error) => {
          expectTypeOf(failureCount).toEqualTypeOf<number>()
          expectTypeOf(error).toEqualTypeOf<DefaultError>()
        },
        retry: (failureCount, error) => {
          expectTypeOf(failureCount).toEqualTypeOf<number>()
          expectTypeOf(error).toEqualTypeOf<DefaultError>()
          return false
        },
        retryDelay: (failureCount, error) => {
          expectTypeOf(failureCount).toEqualTypeOf<number>()
          expectTypeOf(error).toEqualTypeOf<DefaultError>()
          return 0
        },
      })
    })

    it('should infer TError from an explicit type argument', () => {
      createRetryer<string, CustomError>({
        fn: () => 'data',
        networkMode: 'online',
        canRun: () => true,
        onCancel: (error) => {
          expectTypeOf(error).toEqualTypeOf<CustomError>()
        },
        onFail: (_failureCount, error) => {
          expectTypeOf(error).toEqualTypeOf<CustomError>()
        },
      })
    })

    it('should not carry TError into the returned Retryer', () => {
      expectTypeOf(
        createRetryer<{ value: string }, CustomError>({
          fn: () => ({ value: 'data' }),
          networkMode: 'online',
          canRun: () => true,
        }),
      ).toEqualTypeOf<Retryer<{ value: string }>>()
    })

    it('should take the config as its only parameter', () => {
      createRetryer(
        { fn: () => 'data', networkMode: 'online', canRun: () => true },
        // @ts-expect-error there is no second parameter
        'extra',
      )

      expectTypeOf<
        Parameters<typeof createRetryer<string, CustomError>>['length']
      >().toEqualTypeOf<1>()
    })
  })

  describe('RetryerConfig', () => {
    it('should keep every option writable', () => {
      type Config = Parameters<typeof createRetryer<string, CustomError>>[0]

      expectTypeOf<Config>().toEqualTypeOf<{
        -readonly [K in keyof Config]: Config[K]
      }>()
    })

    it('should only expose its documented options', () => {
      expectTypeOf<
        keyof Parameters<typeof createRetryer<string, CustomError>>[0]
      >().toEqualTypeOf<
        | 'fn'
        | 'initialPromise'
        | 'onCancel'
        | 'onFail'
        | 'onPause'
        | 'onContinue'
        | 'retry'
        | 'retryDelay'
        | 'networkMode'
        | 'canRun'
      >()
    })

    describe('fn', () => {
      it('should be required', () => {
        // @ts-expect-error fn is required
        createRetryer({ networkMode: 'online', canRun: () => true })

        expectTypeOf(
          createRetryer({
            fn: () => 'data',
            networkMode: 'online',
            canRun: () => true,
          }),
        ).toEqualTypeOf<Retryer<string>>()
      })

      it('should take no argument and return the data or a promise of it', () => {
        expectTypeOf(createRetryer<{ value: string }, CustomError>)
          .parameter(0)
          .toHaveProperty('fn')
          .toEqualTypeOf<() => { value: string } | Promise<{ value: string }>>()
      })
    })

    describe('networkMode', () => {
      it('should be required but accept undefined', () => {
        // @ts-expect-error networkMode is required
        createRetryer({ fn: () => 'data', canRun: () => true })

        expectTypeOf(
          createRetryer({
            fn: () => 'data',
            networkMode: undefined,
            canRun: () => true,
          }),
        ).toEqualTypeOf<Retryer<string>>()
      })

      it('should only accept a network mode', () => {
        createRetryer({
          fn: () => 'data',
          // @ts-expect-error 'sometimes' is not a network mode
          networkMode: 'sometimes',
          canRun: () => true,
        })

        expectTypeOf(createRetryer<string, CustomError>)
          .parameter(0)
          .toHaveProperty('networkMode')
          .toEqualTypeOf<'online' | 'always' | 'offlineFirst' | undefined>()
      })
    })

    describe('canRun', () => {
      it('should be required', () => {
        // @ts-expect-error canRun is required
        createRetryer({ fn: () => 'data', networkMode: 'online' })

        expectTypeOf(
          createRetryer({
            fn: () => 'data',
            networkMode: 'online',
            canRun: () => true,
          }),
        ).toEqualTypeOf<Retryer<string>>()
      })

      it('should take no argument and return a boolean', () => {
        expectTypeOf(createRetryer<string, CustomError>)
          .parameter(0)
          .toHaveProperty('canRun')
          .toEqualTypeOf<() => boolean>()
      })
    })

    describe('initialPromise', () => {
      it('should be an optional promise of the data', () => {
        expectTypeOf(createRetryer<{ value: string }, CustomError>)
          .parameter(0)
          .toHaveProperty('initialPromise')
          .toEqualTypeOf<Promise<{ value: string }> | undefined>()
      })

      it('should reject a promise of a different type', () => {
        createRetryer<{ value: string }, CustomError>({
          fn: () => ({ value: 'data' }),
          // @ts-expect-error the initial promise must resolve to the data type
          initialPromise: Promise.resolve('data'),
          networkMode: 'online',
          canRun: () => true,
        })

        expectTypeOf(
          createRetryer<{ value: string }, CustomError>({
            fn: () => ({ value: 'data' }),
            initialPromise: Promise.resolve({ value: 'data' }),
            networkMode: 'online',
            canRun: () => true,
          }),
        ).toEqualTypeOf<Retryer<{ value: string }>>()
      })
    })

    describe('onCancel', () => {
      it('should take the error and return void', () => {
        expectTypeOf(createRetryer<string, CustomError>)
          .parameter(0)
          .toHaveProperty('onCancel')
          .toEqualTypeOf<((error: CustomError) => void) | undefined>()
      })

      it('should type the error it receives', () => {
        createRetryer<string, CustomError>({
          fn: () => 'data',
          networkMode: 'online',
          canRun: () => true,
          onCancel: (error) => {
            expectTypeOf(error).toEqualTypeOf<CustomError>()
          },
        })
      })
    })

    describe('onFail', () => {
      it('should take the failure count and the error and return void', () => {
        expectTypeOf(createRetryer<string, CustomError>)
          .parameter(0)
          .toHaveProperty('onFail')
          .toEqualTypeOf<
            ((failureCount: number, error: CustomError) => void) | undefined
          >()
      })

      it('should type the arguments it receives', () => {
        createRetryer<string, CustomError>({
          fn: () => 'data',
          networkMode: 'online',
          canRun: () => true,
          onFail: (failureCount, error) => {
            expectTypeOf(failureCount).toEqualTypeOf<number>()
            expectTypeOf(error).toEqualTypeOf<CustomError>()
          },
        })
      })
    })

    describe('onPause', () => {
      it('should take no argument and return void', () => {
        expectTypeOf(createRetryer<string, CustomError>)
          .parameter(0)
          .toHaveProperty('onPause')
          .toEqualTypeOf<(() => void) | undefined>()
      })
    })

    describe('onContinue', () => {
      it('should take no argument and return void', () => {
        expectTypeOf(createRetryer<string, CustomError>)
          .parameter(0)
          .toHaveProperty('onContinue')
          .toEqualTypeOf<(() => void) | undefined>()
      })
    })

    describe('retry', () => {
      it('should be an optional retry value carrying the error type', () => {
        expectTypeOf(createRetryer<string, CustomError>)
          .parameter(0)
          .toHaveProperty('retry')
          .toEqualTypeOf<RetryValue<CustomError> | undefined>()
      })

      it('should type the arguments given to a retry function', () => {
        createRetryer<string, CustomError>({
          fn: () => 'data',
          networkMode: 'online',
          canRun: () => true,
          retry: (failureCount, error) => {
            expectTypeOf(failureCount).toEqualTypeOf<number>()
            expectTypeOf(error).toEqualTypeOf<CustomError>()
            return true
          },
        })
      })
    })

    describe('retryDelay', () => {
      it('should be an optional retry delay value carrying the error type', () => {
        expectTypeOf(createRetryer<string, CustomError>)
          .parameter(0)
          .toHaveProperty('retryDelay')
          .toEqualTypeOf<RetryDelayValue<CustomError> | undefined>()
      })

      it('should type the arguments given to a retry delay function', () => {
        createRetryer<string, CustomError>({
          fn: () => 'data',
          networkMode: 'online',
          canRun: () => true,
          retryDelay: (failureCount, error) => {
            expectTypeOf(failureCount).toEqualTypeOf<number>()
            expectTypeOf(error).toEqualTypeOf<CustomError>()
            return 1000
          },
        })
      })
    })
  })

  describe('Retryer', () => {
    it('should keep every member writable', () => {
      type Members = Retryer<{ value: string }>

      expectTypeOf<Members>().toEqualTypeOf<{
        -readonly [K in keyof Members]: Members[K]
      }>()
    })

    describe('promise', () => {
      it('should be a promise of the data', () => {
        expectTypeOf<Retryer<{ value: string }>['promise']>().toEqualTypeOf<
          Promise<{ value: string }>
        >()
      })
    })

    describe('start', () => {
      it('should take no argument and return a promise of the data', () => {
        expectTypeOf<Retryer<{ value: string }>['start']>().toEqualTypeOf<
          () => Promise<{ value: string }>
        >()
      })
    })

    describe('continue', () => {
      it('should return a promise of unknown rather than of the data', () => {
        expectTypeOf<Retryer<{ value: string }>['continue']>().toEqualTypeOf<
          () => Promise<unknown>
        >()
      })
    })

    describe('cancel', () => {
      it('should take optional cancel options and return void', () => {
        expectTypeOf<Retryer<{ value: string }>['cancel']>().toEqualTypeOf<
          (cancelOptions?: { revert?: boolean; silent?: boolean }) => void
        >()
      })
    })

    describe('cancelRetry', () => {
      it('should take no argument and return void', () => {
        expectTypeOf<Retryer<{ value: string }>['cancelRetry']>().toEqualTypeOf<
          () => void
        >()
      })
    })

    describe('continueRetry', () => {
      it('should take no argument and return void', () => {
        expectTypeOf<
          Retryer<{ value: string }>['continueRetry']
        >().toEqualTypeOf<() => void>()
      })
    })

    describe('canStart', () => {
      it('should take no argument and return a boolean', () => {
        expectTypeOf<Retryer<{ value: string }>['canStart']>().toEqualTypeOf<
          () => boolean
        >()
      })
    })

    describe('status', () => {
      it('should return one of pending, resolved or rejected', () => {
        expectTypeOf<Retryer<{ value: string }>['status']>().toEqualTypeOf<
          () => 'pending' | 'resolved' | 'rejected'
        >()
      })
    })

    it('should default TData to unknown', () => {
      expectTypeOf<Retryer>().toEqualTypeOf<Retryer<unknown>>()
    })

    it('should only expose its documented members', () => {
      expectTypeOf<keyof Retryer<string>>().toEqualTypeOf<
        | 'promise'
        | 'cancel'
        | 'continue'
        | 'cancelRetry'
        | 'continueRetry'
        | 'canStart'
        | 'start'
        | 'status'
      >()
    })
  })

  describe('RetryValue', () => {
    it('should be a boolean, a number or a should-retry function', () => {
      expectTypeOf<RetryValue<CustomError>>().toEqualTypeOf<
        | boolean
        | number
        | ((failureCount: number, error: CustomError) => boolean)
      >()
    })

    it('should require an error type argument', () => {
      // @ts-expect-error an error type must be provided
      expectTypeOf<RetryValue>().toBeUnknown()

      expectTypeOf<RetryValue<Error>>().toEqualTypeOf<
        boolean | number | ((failureCount: number, error: Error) => boolean)
      >()
    })

    it('should reject a should-retry function that does not return a boolean', () => {
      createRetryer<string, CustomError>({
        fn: () => 'data',
        networkMode: 'online',
        canRun: () => true,
        // @ts-expect-error a should-retry function must return a boolean
        retry: () => 'yes',
      })

      expectTypeOf<
        ReturnType<
          Extract<RetryValue<CustomError>, (...args: never) => unknown>
        >
      >().toEqualTypeOf<boolean>()
    })

    it('should accept a boolean or a number without a function', () => {
      createRetryer<string, CustomError>({
        fn: () => 'data',
        networkMode: 'online',
        canRun: () => true,
        // @ts-expect-error a retry value cannot be a string
        retry: 'three',
      })

      expectTypeOf<
        Extract<RetryValue<CustomError>, boolean>
      >().toEqualTypeOf<boolean>()
      expectTypeOf<
        Extract<RetryValue<CustomError>, number>
      >().toEqualTypeOf<number>()
      expectTypeOf<
        Extract<RetryValue<CustomError>, string>
      >().toEqualTypeOf<never>()
    })
  })

  describe('RetryDelayValue', () => {
    it('should be a number or a retry delay function', () => {
      expectTypeOf<RetryDelayValue<CustomError>>().toEqualTypeOf<
        number | ((failureCount: number, error: CustomError) => number)
      >()
    })

    it('should not accept a boolean', () => {
      createRetryer<string, CustomError>({
        fn: () => 'data',
        networkMode: 'online',
        canRun: () => true,
        // @ts-expect-error a retry delay cannot be a boolean
        retryDelay: true,
      })

      expectTypeOf<
        Extract<RetryDelayValue<CustomError>, boolean>
      >().toEqualTypeOf<never>()
    })

    it('should reject a retry delay function that does not return a number', () => {
      createRetryer<string, CustomError>({
        fn: () => 'data',
        networkMode: 'online',
        canRun: () => true,
        // @ts-expect-error a retry delay function must return a number
        retryDelay: () => '1000',
      })

      expectTypeOf<
        ReturnType<
          Extract<RetryDelayValue<CustomError>, (...args: never) => unknown>
        >
      >().toEqualTypeOf<number>()
    })
  })

  describe('CancelledError', () => {
    it('should be an Error with optional revert and silent flags', () => {
      const error = new CancelledError()

      expectTypeOf(error).toEqualTypeOf<CancelledError>()
      expectTypeOf(error).toExtend<Error>()
      expectTypeOf(error.revert).toEqualTypeOf<boolean | undefined>()
      expectTypeOf(error.silent).toEqualTypeOf<boolean | undefined>()
    })

    it('should only add revert and silent to the Error surface', () => {
      expectTypeOf<Exclude<keyof CancelledError, keyof Error>>().toEqualTypeOf<
        'revert' | 'silent'
      >()
    })

    it('should take optional cancel options', () => {
      expectTypeOf(CancelledError).toBeConstructibleWith()
      expectTypeOf(CancelledError).toBeConstructibleWith({ revert: true })
      expectTypeOf(CancelledError).toBeConstructibleWith({ silent: true })

      expectTypeOf<
        ConstructorParameters<typeof CancelledError>
      >().toEqualTypeOf<[options?: CancelOptions]>()
    })

    it('should reject an unknown cancel option', () => {
      // @ts-expect-error 'revertible' is not a cancel option
      new CancelledError({ revertible: true })

      expectTypeOf(
        new CancelledError({ revert: true, silent: true }),
      ).toEqualTypeOf<CancelledError>()
    })
  })

  describe('CancelOptions', () => {
    it('should have optional revert and silent booleans', () => {
      expectTypeOf<CancelOptions>().toEqualTypeOf<{
        revert?: boolean
        silent?: boolean
      }>()
    })
  })

  describe('canFetch', () => {
    it('should take a network mode or undefined and return a boolean', () => {
      expectTypeOf(canFetch).toEqualTypeOf<
        (networkMode: NetworkMode | undefined) => boolean
      >()
    })

    it('should require its argument', () => {
      // @ts-expect-error the network mode argument is required
      canFetch()

      expectTypeOf(canFetch(undefined)).toEqualTypeOf<boolean>()
      expectTypeOf(canFetch('always')).toEqualTypeOf<boolean>()
    })

    it('should reject a value that is not a network mode', () => {
      // @ts-expect-error 'sometimes' is not a network mode
      canFetch('sometimes')

      expectTypeOf(canFetch('offlineFirst')).toEqualTypeOf<boolean>()
    })
  })

  describe('isCancelledError', () => {
    it('should narrow an unknown value to a CancelledError', () => {
      const value: unknown = new CancelledError()

      if (isCancelledError(value)) {
        expectTypeOf(value).toEqualTypeOf<CancelledError>()
      } else {
        expectTypeOf(value).toEqualTypeOf<unknown>()
      }
    })

    it('should accept any value and return a type predicate', () => {
      expectTypeOf(isCancelledError).toEqualTypeOf<
        (value: any) => value is CancelledError
      >()
    })

    it('should narrow a union down to the CancelledError member', () => {
      const value = {} as CancelledError | CustomError

      if (isCancelledError(value)) {
        expectTypeOf(value).toEqualTypeOf<CancelledError>()
      } else {
        expectTypeOf(value).toEqualTypeOf<CustomError>()
      }
    })
  })
})
