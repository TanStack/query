import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { useMutation } from '../useMutation'
import type { DefaultError } from '@tanstack/query-core'
import type { UseMutationResult } from '../types'

describe('useMutation', () => {
  it('should infer TData from mutationFn return type', () => {
    const mutation = useMutation({
      mutationFn: () => Promise.resolve('data'),
    })

    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
    expectTypeOf(mutation.error).toEqualTypeOf<DefaultError | null>()
  })

  it('should infer TVariables from mutationFn parameter', () => {
    const mutation = useMutation({
      mutationFn: (vars: { id: string }) => Promise.resolve(vars.id),
    })

    expectTypeOf(mutation.mutate).toBeCallableWith({ id: '1' })
    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
  })

  it('should infer TOnMutateResult from onMutate return type', () => {
    useMutation({
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
    })
  })

  it('should allow explicit generic types', () => {
    const mutation = useMutation<string, Error, { id: number }>({
      mutationFn: (vars) => {
        expectTypeOf(vars).toEqualTypeOf<{ id: number }>()
        return Promise.resolve('result')
      },
    })

    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
    expectTypeOf(mutation.error).toEqualTypeOf<Error | null>()
  })

  it('should return correct UseMutationResult type', () => {
    const mutation = useMutation({
      mutationFn: () => Promise.resolve(42),
    })

    expectTypeOf(mutation).toEqualTypeOf<
      UseMutationResult<number, DefaultError, void, unknown>
    >()
  })

  it('should type mutateAsync with correct return type', () => {
    const mutation = useMutation({
      mutationFn: (id: string) => Promise.resolve(id.length),
    })

    expectTypeOf(mutation.mutateAsync).toBeCallableWith('test')
    expectTypeOf(mutation.mutateAsync('test')).toEqualTypeOf<Promise<number>>()
  })

  it('should default TVariables to void when mutationFn has no parameters', () => {
    const mutation = useMutation({
      mutationFn: () => Promise.resolve('data'),
    })

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

    const mutation = useMutation<string, CustomError>({
      mutationFn: () => Promise.resolve('data'),
    })

    expectTypeOf(mutation.error).toEqualTypeOf<CustomError | null>()
    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
  })

  it('should infer types for onSettled callback', () => {
    useMutation({
      mutationFn: () => Promise.resolve(42),
      onSettled: (data, error, _variables, _onMutateResult) => {
        expectTypeOf(data).toEqualTypeOf<number | undefined>()
        expectTypeOf(error).toEqualTypeOf<DefaultError | null>()
      },
    })
  })

  it('should infer custom TError in onError callback', () => {
    class CustomError extends Error {
      code: number
      constructor(code: number) {
        super()
        this.code = code
      }
    }

    useMutation<string, CustomError>({
      mutationFn: () => Promise.resolve('data'),
      onError: (error) => {
        expectTypeOf(error).toEqualTypeOf<CustomError>()
      },
    })
  })

  it('should accept queryClient as second argument', () => {
    const queryClient = new QueryClient()

    const mutation = useMutation(
      {
        mutationFn: () => Promise.resolve('data'),
      },
      queryClient,
    )

    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
  })
})
