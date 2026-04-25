import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { createMutation } from '../../src/index.js'
import type { DefaultError } from '@tanstack/query-core'
import type { CreateMutationResult } from '../../src/types.js'

describe('createMutation', () => {
  it('should infer TData from mutationFn return type', () => {
    const mutation = createMutation(() => ({
      mutationFn: () => Promise.resolve('data'),
    }))

    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
    expectTypeOf(mutation.error).toEqualTypeOf<DefaultError | null>()
  })

  it('should infer TVariables from mutationFn parameter', () => {
    const mutation = createMutation(() => ({
      mutationFn: (vars: { id: string }) => Promise.resolve(vars.id),
    }))

    expectTypeOf(mutation.mutate).toBeCallableWith({ id: '1' })
    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
  })

  it('should infer TOnMutateResult from onMutate return type', () => {
    createMutation(() => ({
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
    }))
  })

  it('should allow explicit generic types', () => {
    const mutation = createMutation<string, Error, { id: number }>(() => ({
      mutationFn: (vars) => {
        expectTypeOf(vars).toEqualTypeOf<{ id: number }>()
        return Promise.resolve('result')
      },
    }))

    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
    expectTypeOf(mutation.error).toEqualTypeOf<Error | null>()
  })

  it('should return correct CreateMutationResult type', () => {
    const mutation = createMutation(() => ({
      mutationFn: () => Promise.resolve(42),
    }))

    expectTypeOf(mutation).toEqualTypeOf<
      CreateMutationResult<number, DefaultError, void, unknown>
    >()
  })

  it('should type mutateAsync with correct return type', () => {
    const mutation = createMutation(() => ({
      mutationFn: (id: string) => Promise.resolve(id.length),
    }))

    expectTypeOf(mutation.mutateAsync).toBeCallableWith('test')
    expectTypeOf(mutation.mutateAsync('test')).toEqualTypeOf<Promise<number>>()
  })

  it('should default TVariables to void when mutationFn has no parameters', () => {
    const mutation = createMutation(() => ({
      mutationFn: () => Promise.resolve('data'),
    }))

    expectTypeOf(mutation.mutate).toBeCallableWith()
  })

  it('should infer custom TError type', () => {
    class CustomError extends Error {
      code: number
      constructor(code: number) {
        super()
        this.code = code
      }
    }

    const mutation = createMutation<string, CustomError>(() => ({
      mutationFn: () => Promise.resolve('data'),
    }))

    expectTypeOf(mutation.error).toEqualTypeOf<CustomError | null>()
    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
  })

  it('should infer types for onSettled callback', () => {
    createMutation(() => ({
      mutationFn: () => Promise.resolve(42),
      onSettled: (data, error, _variables, _onMutateResult) => {
        expectTypeOf(data).toEqualTypeOf<number | undefined>()
        expectTypeOf(error).toEqualTypeOf<DefaultError | null>()
      },
    }))
  })

  it('should infer custom TError in onError callback', () => {
    class CustomError extends Error {
      code: number
      constructor(code: number) {
        super()
        this.code = code
      }
    }

    createMutation<string, CustomError>(() => ({
      mutationFn: () => Promise.resolve('data'),
      onError: (error) => {
        expectTypeOf(error).toEqualTypeOf<CustomError>()
      },
    }))
  })

  it('should accept queryClient as second argument', () => {
    const queryClient = new QueryClient()

    const mutation = createMutation(
      () => ({
        mutationFn: () => Promise.resolve('data'),
      }),
      () => queryClient,
    )

    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
  })
})
