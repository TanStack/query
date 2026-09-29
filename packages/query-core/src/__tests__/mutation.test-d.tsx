import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import { MutationCache } from '../mutationCache'
import type { MutationObserver } from '../mutationObserver'
import type { Action, Mutation, MutationState } from '../mutation'
import type {
  DefaultError,
  MutateFunction,
  MutateOptions,
  MutationMeta,
  MutationOptions,
} from '../types'

class CustomError extends Error {
  name = 'CustomError' as const
}

describe('mutation', () => {
  describe('MutationState', () => {
    it('should keep every property writable', () => {
      type State = MutationState<{ value: string }, CustomError, number, string>

      expectTypeOf<State>().toEqualTypeOf<{
        -readonly [K in keyof State]: State[K]
      }>()
    })

    it('should declare every property as required', () => {
      type State = MutationState<{ value: string }, CustomError, number, string>
      type OptionalKeys = {
        [K in keyof State]-?: {} extends Pick<State, K> ? K : never
      }[keyof State]

      expectTypeOf<OptionalKeys>().toEqualTypeOf<never>()
    })

    it('should declare exactly its nine properties', () => {
      expectTypeOf<keyof MutationState>().toEqualTypeOf<
        | 'context'
        | 'data'
        | 'error'
        | 'failureCount'
        | 'failureReason'
        | 'isPaused'
        | 'status'
        | 'variables'
        | 'submittedAt'
      >()
    })

    it('should default its type parameters', () => {
      expectTypeOf<MutationState>().toEqualTypeOf<
        MutationState<unknown, DefaultError, unknown, unknown>
      >()
    })

    describe('context', () => {
      it('should be the on-mutate result or undefined', () => {
        expectTypeOf<
          MutationState<
            { value: string },
            CustomError,
            number,
            string
          >['context']
        >().toEqualTypeOf<string | undefined>()
      })
    })

    describe('data', () => {
      it('should be the data or undefined', () => {
        expectTypeOf<
          MutationState<{ value: string }, CustomError, number, string>['data']
        >().toEqualTypeOf<{ value: string } | undefined>()
      })
    })

    describe('error', () => {
      it('should be the error or null', () => {
        expectTypeOf<
          MutationState<{ value: string }, CustomError, number, string>['error']
        >().toEqualTypeOf<CustomError | null>()
      })
    })

    describe('failureCount', () => {
      it('should be a number', () => {
        expectTypeOf<
          MutationState<
            { value: string },
            CustomError,
            number,
            string
          >['failureCount']
        >().toEqualTypeOf<number>()
      })
    })

    describe('failureReason', () => {
      it('should be the error or null', () => {
        expectTypeOf<
          MutationState<
            { value: string },
            CustomError,
            number,
            string
          >['failureReason']
        >().toEqualTypeOf<CustomError | null>()
      })
    })

    describe('isPaused', () => {
      it('should be a boolean', () => {
        expectTypeOf<
          MutationState<
            { value: string },
            CustomError,
            number,
            string
          >['isPaused']
        >().toEqualTypeOf<boolean>()
      })
    })

    describe('status', () => {
      it('should spell out every mutation status', () => {
        expectTypeOf<
          MutationState<
            { value: string },
            CustomError,
            number,
            string
          >['status']
        >().toEqualTypeOf<'idle' | 'pending' | 'success' | 'error'>()
      })

      it('should not widen beyond those literals on the default parameters', () => {
        expectTypeOf<MutationState['status']>().toEqualTypeOf<
          'idle' | 'pending' | 'success' | 'error'
        >()
      })
    })

    describe('variables', () => {
      it('should be the variables or undefined', () => {
        expectTypeOf<
          MutationState<
            { value: string },
            CustomError,
            number,
            string
          >['variables']
        >().toEqualTypeOf<number | undefined>()
      })
    })

    describe('submittedAt', () => {
      it('should be a number', () => {
        expectTypeOf<
          MutationState<
            { value: string },
            CustomError,
            number,
            string
          >['submittedAt']
        >().toEqualTypeOf<number>()
      })
    })
  })

  describe('Mutation', () => {
    it('should declare exactly its public members', () => {
      expectTypeOf<keyof Mutation>().toEqualTypeOf<
        | 'state'
        | 'options'
        | 'mutationId'
        | 'setOptions'
        | 'meta'
        | 'addObserver'
        | 'removeObserver'
        | 'continue'
        | 'execute'
        | 'gcTime'
        | 'destroy'
      >()
    })

    it('should default its type parameters', () => {
      expectTypeOf<Mutation>().toEqualTypeOf<
        Mutation<unknown, DefaultError, unknown, unknown>
      >()
    })

    describe('state', () => {
      it('should be the mutation state for the same type parameters', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        expectTypeOf(mutation.state).toEqualTypeOf<
          MutationState<{ value: string }, CustomError, number, string>
        >()
      })

      it('should stay writable', () => {
        // `Pick` preserves the `readonly` modifier that an indexed access such
        // as `Mutation<...>['state']` silently strips
        type State = Pick<
          Mutation<{ value: string }, CustomError, number, string>,
          'state'
        >

        expectTypeOf<State>().toEqualTypeOf<{
          -readonly [K in keyof State]: State[K]
        }>()
      })
    })

    describe('options', () => {
      it('should be the mutation options for the same type parameters', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        expectTypeOf(mutation.options).toEqualTypeOf<
          MutationOptions<{ value: string }, CustomError, number, string>
        >()
      })

      it('should always be declared, despite being assigned lazily', () => {
        type Keys = Mutation<{ value: string }, CustomError, number, string>
        type OptionalKeys = {
          [K in keyof Keys]-?: {} extends Pick<Keys, K> ? K : never
        }[keyof Keys]

        expectTypeOf<
          'options' extends OptionalKeys ? true : false
        >().toEqualTypeOf<false>()
      })
    })

    describe('mutationId', () => {
      it('should be a readonly number', () => {
        type Id = Pick<Mutation, 'mutationId'>

        expectTypeOf<Id>().toEqualTypeOf<{ readonly mutationId: number }>()
        expectTypeOf<Id>().not.toEqualTypeOf<{ mutationId: number }>()
      })
    })

    describe('setOptions', () => {
      it('should take the mutation options and return nothing', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        expectTypeOf(mutation.setOptions)
          .parameter(0)
          .toEqualTypeOf<
            MutationOptions<{ value: string }, CustomError, number, string>
          >()
        expectTypeOf(mutation.setOptions).returns.toEqualTypeOf<void>()
        expectTypeOf(mutation.setOptions).parameters.toEqualTypeOf<
          [MutationOptions<{ value: string }, CustomError, number, string>]
        >()
      })
    })

    describe('meta', () => {
      it('should be the mutation meta or undefined', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        expectTypeOf(mutation.meta).toEqualTypeOf<MutationMeta | undefined>()
      })

      it('should be a getter without a setter', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        // @ts-expect-error meta is a getter only
        mutation.meta = {}

        expectTypeOf<Mutation['meta']>().toEqualTypeOf<
          MutationMeta | undefined
        >()
      })
    })

    describe('addObserver', () => {
      it('should take a single observer and return nothing', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        expectTypeOf(mutation.addObserver).returns.toEqualTypeOf<void>()
        expectTypeOf(mutation.addObserver).parameters.toEqualTypeOf<
          [MutationObserver<any, any, any, any>]
        >()
      })
    })

    describe('removeObserver', () => {
      it('should take a single observer and return nothing', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        expectTypeOf(mutation.removeObserver).returns.toEqualTypeOf<void>()
        expectTypeOf(mutation.removeObserver).parameters.toEqualTypeOf<
          [MutationObserver<any, any, any, any>]
        >()
      })
    })

    describe('continue', () => {
      it('should take no arguments and resolve with an unknown value', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        expectTypeOf(mutation.continue).parameters.toEqualTypeOf<[]>()
        expectTypeOf(mutation.continue()).toEqualTypeOf<Promise<unknown>>()
      })
    })

    describe('execute', () => {
      it('should take the variables and resolve with the data', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        expectTypeOf(mutation.execute).parameters.toEqualTypeOf<[number]>()
        expectTypeOf(mutation.execute(1)).toEqualTypeOf<
          Promise<{ value: string }>
        >()
      })

      it('should reject variables of another type', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        // @ts-expect-error the variables must match the mutation function
        mutation.execute('1')

        expectTypeOf(mutation.execute).parameter(0).toEqualTypeOf<number>()
      })
    })

    describe('gcTime', () => {
      it('should be a number inherited from Removable', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        expectTypeOf(mutation.gcTime).toEqualTypeOf<number>()
      })
    })

    describe('destroy', () => {
      it('should take no arguments and return nothing', () => {
        const mutation = new MutationCache().build<
          { value: string },
          CustomError,
          number,
          string
        >(new QueryClient(), {
          mutationFn: (variables: number) =>
            Promise.resolve({ value: String(variables) }),
        })

        expectTypeOf(mutation.destroy).parameters.toEqualTypeOf<[]>()
        expectTypeOf(mutation.destroy).returns.toEqualTypeOf<void>()
      })
    })
  })

  describe('MutationOptions', () => {
    type Options = MutationOptions<
      { value: string },
      CustomError,
      number,
      string
    >

    describe('retry', () => {
      it('should be an optional retry value taking the error', () => {
        expectTypeOf<Options['retry']>().toEqualTypeOf<
          | boolean
          | number
          | ((failureCount: number, error: CustomError) => boolean)
          | undefined
        >()
      })
    })

    describe('retryDelay', () => {
      it('should be an optional delay taking the error', () => {
        expectTypeOf<Options['retryDelay']>().toEqualTypeOf<
          | number
          | ((failureCount: number, error: CustomError) => number)
          | undefined
        >()
      })
    })

    describe('networkMode', () => {
      it('should spell out every network mode', () => {
        expectTypeOf<Options['networkMode']>().toEqualTypeOf<
          'online' | 'always' | 'offlineFirst' | undefined
        >()
      })
    })

    describe('gcTime', () => {
      it('should be an optional number', () => {
        expectTypeOf<Options['gcTime']>().toEqualTypeOf<number | undefined>()
      })
    })

    describe('scope', () => {
      it('should be an optional scope carrying a string id', () => {
        expectTypeOf<Options['scope']>().toEqualTypeOf<
          { id: string } | undefined
        >()
      })
    })
  })

  describe('Action', () => {
    type MutationAction = Action<{ value: string }, CustomError, number, string>

    it('should union exactly its six action type literals', () => {
      expectTypeOf<MutationAction['type']>().toEqualTypeOf<
        'continue' | 'error' | 'failed' | 'pending' | 'pause' | 'success'
      >()
    })

    describe('failed', () => {
      it('should carry the failure count and the nullable error', () => {
        type Failed = Extract<MutationAction, { type: 'failed' }>

        expectTypeOf<Failed>().toEqualTypeOf<{
          type: 'failed'
          failureCount: number
          error: CustomError | null
        }>()
      })
    })

    describe('pause', () => {
      it('should carry nothing but its type', () => {
        expectTypeOf<
          Extract<MutationAction, { type: 'pause' }>
        >().toEqualTypeOf<{ type: 'pause' }>()
      })
    })

    describe('continue', () => {
      it('should carry nothing but its type', () => {
        expectTypeOf<
          Extract<MutationAction, { type: 'continue' }>
        >().toEqualTypeOf<{ type: 'continue' }>()
      })
    })

    describe('success', () => {
      it('should carry the data', () => {
        expectTypeOf<
          Extract<MutationAction, { type: 'success' }>
        >().toEqualTypeOf<{ type: 'success'; data: { value: string } }>()
      })
    })

    describe('error', () => {
      it('should carry the error', () => {
        expectTypeOf<
          Extract<MutationAction, { type: 'error' }>
        >().toEqualTypeOf<{ type: 'error'; error: CustomError }>()
      })
    })

    describe('pending', () => {
      it('should carry the paused flag, the variables and the on-mutate result', () => {
        expectTypeOf<
          Extract<MutationAction, { type: 'pending' }>
        >().toEqualTypeOf<{
          type: 'pending'
          isPaused: boolean
          variables?: number
          context?: string
        }>()
      })
    })
  })

  describe('MutateFunction', () => {
    it('should resolve with the data', () => {
      const mutate = {} as MutateFunction<string, CustomError, number, unknown>

      expectTypeOf(mutate(1)).toEqualTypeOf<Promise<string>>()
    })

    it('should default its type parameters', () => {
      expectTypeOf<MutateFunction>().toEqualTypeOf<
        MutateFunction<unknown, DefaultError, void, unknown>
      >()
    })

    it('should handle void variables', () => {
      const mutate = {} as MutateFunction

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
        undefined | void
      >()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        undefined | MutateOptions<unknown, DefaultError, void, unknown>
      >()

      mutate() // can be called with no arguments
      mutate(undefined, {
        onError: (e) => {
          expectTypeOf(e).toEqualTypeOf<DefaultError>()
        },
      })
    })

    it('should handle optional undefinable variables', () => {
      const mutate = {} as MutateFunction<
        unknown,
        DefaultError,
        number | undefined,
        unknown
      >

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
        number | undefined
      >()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        | undefined
        | MutateOptions<unknown, DefaultError, number | undefined, unknown>
      >()

      mutate() // can be called with no arguments
      mutate(undefined, {
        onError: (e) => {
          expectTypeOf(e).toEqualTypeOf<DefaultError>()
        },
      })
    })

    it('should handle unknown variables', () => {
      const mutate = {} as MutateFunction<
        unknown,
        DefaultError,
        unknown,
        unknown
      >

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<unknown>()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        undefined | MutateOptions<unknown, DefaultError, unknown, unknown>
      >()

      mutate() // can be called with no arguments
    })

    it('should handle any variables', () => {
      const mutate = {} as MutateFunction<unknown, DefaultError, any, unknown>

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<any>()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        undefined | MutateOptions<unknown, DefaultError, any, unknown>
      >()

      mutate() // can be called with no arguments
    })

    it('should handle void union variables', () => {
      const mutate = {} as MutateFunction<
        unknown,
        DefaultError,
        void | string,
        unknown
      >

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
        void | string | undefined
      >()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        undefined | MutateOptions<unknown, DefaultError, void | string, unknown>
      >()

      mutate() // can be called with no arguments
    })

    it('should handle required non-undefinable variables', () => {
      const mutate = {} as MutateFunction<
        unknown,
        DefaultError,
        number,
        unknown
      >

      expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<number>()

      expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
        undefined | MutateOptions<unknown, DefaultError, number, unknown>
      >()

      // @ts-expect-error --- required variables
      mutate()
      mutate(123, {
        onError: (e) => {
          expectTypeOf(e).toEqualTypeOf<DefaultError>()
        },
      })
    })

    describe('MutateFunctionRest', () => {
      // this is common pattern used internal so we need make sure it still works

      it('should handle void variables', () => {
        const mutate = {} as (...options: Parameters<MutateFunction>) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
          undefined | void
        >()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          undefined | MutateOptions<unknown, DefaultError, void, unknown>
        >()

        mutate() // can be called with no arguments
        mutate(undefined, {
          onError: (e) => {
            expectTypeOf(e).toEqualTypeOf<DefaultError>()
          },
        })
      })

      it('should handle optional undefinable variables', () => {
        const mutate = {} as (
          ...options: Parameters<
            MutateFunction<unknown, DefaultError, number | undefined, unknown>
          >
        ) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
          number | undefined
        >()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          | undefined
          | MutateOptions<unknown, DefaultError, number | undefined, unknown>
        >()

        mutate() // can be called with no arguments
        mutate(undefined, {
          onError: (e) => {
            expectTypeOf(e).toEqualTypeOf<DefaultError>()
          },
        })
      })

      it('should handle unknown variables', () => {
        const mutate = {} as (
          ...options: Parameters<
            MutateFunction<unknown, DefaultError, unknown, unknown>
          >
        ) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<unknown>()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          undefined | MutateOptions<unknown, DefaultError, unknown, unknown>
        >()

        mutate() // can be called with no arguments
      })

      it('should handle any variables', () => {
        const mutate = {} as (
          ...options: Parameters<
            MutateFunction<unknown, DefaultError, any, unknown>
          >
        ) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<any>()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          undefined | MutateOptions<unknown, DefaultError, any, unknown>
        >()

        mutate() // can be called with no arguments
      })

      it('should handle void union variables', () => {
        const mutate = {} as (
          ...options: Parameters<
            MutateFunction<unknown, DefaultError, void | string, unknown>
          >
        ) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<
          void | string | undefined
        >()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          | undefined
          | MutateOptions<unknown, DefaultError, void | string, unknown>
        >()

        mutate() // can be called with no arguments
      })

      it('should handle required non-undefinable variables', () => {
        const mutate = {} as (
          ...options: Parameters<
            MutateFunction<unknown, DefaultError, number, unknown>
          >
        ) => void

        expectTypeOf<Parameters<typeof mutate>[0]>().toEqualTypeOf<number>()

        expectTypeOf<Parameters<typeof mutate>[1]>().toEqualTypeOf<
          undefined | MutateOptions<unknown, DefaultError, number, unknown>
        >()

        // @ts-expect-error --- required variables
        mutate()
        mutate(123, {
          onError: (e) => {
            expectTypeOf(e).toEqualTypeOf<DefaultError>()
          },
        })
      })
    })
  })
})
