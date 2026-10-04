import { QueryClient } from '@tanstack/query-core'
import { LitElement } from 'lit'
import { describe, expectTypeOf, it } from 'vitest'
import { createMutationController } from '../createMutationController.js'
import type {
  DefaultError,
  MutationFunctionContext,
  MutationKey,
} from '@tanstack/query-core'
import type { MutationResultAccessor } from '../createMutationController.js'

class Host extends LitElement {}

describe('createMutationController', () => {
  it('should infer TData from mutationFn return type', () => {
    const mutation = createMutationController(
      new Host(),
      {
        mutationFn: () => Promise.resolve('data'),
      },
      new QueryClient(),
    )

    expectTypeOf(mutation().data).toEqualTypeOf<string | undefined>()
    expectTypeOf(mutation().error).toEqualTypeOf<DefaultError | null>()
  })

  it('should infer TVariables from mutationFn parameter', () => {
    const mutation = createMutationController(
      new Host(),
      {
        mutationFn: (vars: { id: string }) => Promise.resolve(vars.id),
      },
      new QueryClient(),
    )

    expectTypeOf(mutation.mutate).toBeCallableWith({ id: '1' })
    expectTypeOf(mutation().data).toEqualTypeOf<string | undefined>()
  })

  it('should infer TOnMutateResult from onMutate return type', () => {
    createMutationController(
      new Host(),
      {
        mutationFn: () => Promise.resolve('data'),
        onMutate: () => {
          return { token: 'abc' }
        },
        onSuccess: (_data, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<{ token: string }>()
        },
        onError: (_error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<
            { token: string } | undefined
          >()
        },
      },
      new QueryClient(),
    )
  })

  it('should allow explicit generic types', () => {
    const mutation = createMutationController<string, Error, { id: number }>(
      new Host(),
      {
        mutationFn: (vars) => {
          expectTypeOf(vars).toEqualTypeOf<{ id: number }>()
          return Promise.resolve('result')
        },
      },
      new QueryClient(),
    )

    expectTypeOf(mutation().data).toEqualTypeOf<string | undefined>()
    expectTypeOf(mutation().error).toEqualTypeOf<Error | null>()
  })

  it('should return correct MutationResultAccessor type', () => {
    const mutation = createMutationController(
      new Host(),
      {
        mutationFn: () => Promise.resolve(42),
      },
      new QueryClient(),
    )

    expectTypeOf(mutation).toEqualTypeOf<
      MutationResultAccessor<number, DefaultError, void, unknown>
    >()
  })

  it('should type mutateAsync with correct return type', () => {
    const mutation = createMutationController(
      new Host(),
      {
        mutationFn: (id: string) => Promise.resolve(id.length),
      },
      new QueryClient(),
    )

    expectTypeOf(mutation.mutateAsync).toBeCallableWith('test')
    expectTypeOf(mutation.mutateAsync('test')).toEqualTypeOf<Promise<number>>()
  })

  it('should type reset with correct type', () => {
    const mutation = createMutationController(
      new Host(),
      {
        mutationFn: (id: string) => Promise.resolve(id.length),
      },
      new QueryClient(),
    )

    expectTypeOf(mutation.reset).toEqualTypeOf<() => void>()
  })

  it('should default TVariables to void when mutationFn has no parameters', () => {
    const mutation = createMutationController(
      new Host(),
      {
        mutationFn: () => Promise.resolve('data'),
      },
      new QueryClient(),
    )

    expectTypeOf(mutation.mutate).toBeCallableWith()
  })

  it('should allow calling mutate with no arguments when TVariables is optional undefinable', () => {
    const mutation = createMutationController(
      new Host(),
      {
        mutationFn: (_variables: number | undefined) => Promise.resolve(1),
      },
      new QueryClient(),
    )

    expectTypeOf(mutation.mutate).toBeCallableWith()
    expectTypeOf(mutation.mutateAsync).toBeCallableWith()
  })

  it('should infer custom TError type', () => {
    class CustomError extends Error {
      code: number
      constructor(code: number) {
        super()
        this.code = code
      }
    }

    const mutation = createMutationController<string, CustomError>(
      new Host(),
      {
        mutationFn: () => Promise.resolve('data'),
      },
      new QueryClient(),
    )

    expectTypeOf(mutation().error).toEqualTypeOf<CustomError | null>()
    expectTypeOf(mutation().data).toEqualTypeOf<string | undefined>()
  })

  it('should infer types for onSettled callback', () => {
    createMutationController(
      new Host(),
      {
        mutationFn: () => Promise.resolve(42),
        onSettled: (data, error, _variables, _onMutateResult) => {
          expectTypeOf(data).toEqualTypeOf<number | undefined>()
          expectTypeOf(error).toEqualTypeOf<DefaultError | null>()
        },
      },
      new QueryClient(),
    )
  })

  it('should infer custom TError in onError callback', () => {
    class CustomError extends Error {
      code: number
      constructor(code: number) {
        super()
        this.code = code
      }
    }

    createMutationController<string, CustomError>(
      new Host(),
      {
        mutationFn: () => Promise.resolve('data'),
        onError: (error) => {
          expectTypeOf(error).toEqualTypeOf<CustomError>()
        },
      },
      new QueryClient(),
    )
  })

  it('should type context as the last argument for mutationFn and every hook-level callback', () => {
    createMutationController(
      new Host(),
      {
        mutationFn: (_variables, context) => {
          expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
          expectTypeOf(context.client).toEqualTypeOf<QueryClient>()
          return Promise.resolve('data')
        },
        onMutate: (_variables, context) => {
          expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
        },
        onSuccess: (_data, _variables, _onMutateResult, context) => {
          expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
        },
        onError: (_error, _variables, _onMutateResult, context) => {
          expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
        },
        onSettled: (_data, _error, _variables, _onMutateResult, context) => {
          expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
        },
      },
      new QueryClient(),
    )
  })

  it('should type context as the last argument for every per-call mutate option', () => {
    const mutation = createMutationController(
      new Host(),
      {
        mutationFn: () => Promise.resolve('data'),
      },
      new QueryClient(),
    )

    mutation.mutate(undefined, {
      onSuccess: (_data, _variables, _onMutateResult, context) => {
        expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
      },
      onError: (_error, _variables, _onMutateResult, context) => {
        expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
      },
      onSettled: (_data, _error, _variables, _onMutateResult, context) => {
        expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
      },
    })
  })

  it('should type context.mutationKey as MutationKey', () => {
    createMutationController(
      new Host(),
      {
        mutationKey: ['todos', 'add'] as const,
        mutationFn: () => Promise.resolve('data'),
        onSuccess: (_data, _variables, _onMutateResult, context) => {
          expectTypeOf(context.mutationKey).toEqualTypeOf<
            MutationKey | undefined
          >()
        },
      },
      new QueryClient(),
    )
  })
})
