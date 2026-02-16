import { assertType, describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { useIsMutating, useMutation, useMutationState } from '..'
import { mutationOptions } from '../mutationOptions'
import type {
  DefaultError,
  MutationFunctionContext,
  MutationState,
  WithRequired,
} from '@tanstack/query-core'
import type { SolidMutationOptions, UseMutationResult } from '../types'

describe('mutationOptions', () => {
  it('should not allow excess properties', () => {
    // @ts-expect-error this is a good error, because onMutates does not exist!
    mutationOptions({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      onMutates: 1000,
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  it('should infer types for callbacks', () => {
    mutationOptions({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  it('should infer types for onError callback', () => {
    mutationOptions({
      mutationFn: () => {
        throw new Error('fail')
      },
      mutationKey: ['key'],
      onError: (error) => {
        expectTypeOf(error).toEqualTypeOf<DefaultError>()
      },
    })
  })

  it('should infer types for variables', () => {
    mutationOptions<number, DefaultError, { id: string }>({
      mutationFn: (vars) => {
        expectTypeOf(vars).toEqualTypeOf<{ id: string }>()
        return Promise.resolve(5)
      },
      mutationKey: ['with-vars'],
    })
  })

  it('should infer result type correctly', () => {
    mutationOptions<number, DefaultError, void, { name: string }>({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      onMutate: () => {
        return { name: 'onMutateResult' }
      },
      onSuccess: (_data, _variables, onMutateResult) => {
        expectTypeOf(onMutateResult).toEqualTypeOf<{ name: string }>()
      },
    })
  })

  it('should infer context type correctly', () => {
    mutationOptions<number>({
      mutationFn: (_variables, context) => {
        expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
        return Promise.resolve(5)
      },
      mutationKey: ['key'],
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
    })
  })

  it('should error if mutationFn return type mismatches TData', () => {
    assertType(
      mutationOptions<number>({
        // @ts-expect-error this is a good error, because return type is string, not number
        mutationFn: async () => Promise.resolve('wrong return'),
      }),
    )
  })

  it('should allow mutationKey to be omitted', () => {
    return mutationOptions({
      mutationFn: () => Promise.resolve(123),
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  it('should infer all types when not explicitly provided', () => {
    expectTypeOf(
      mutationOptions({
        mutationFn: (id: string) => Promise.resolve(id.length),
        mutationKey: ['key'],
        onSuccess: (data) => {
          expectTypeOf(data).toEqualTypeOf<number>()
        },
      }),
    ).toEqualTypeOf<
      WithRequired<
        SolidMutationOptions<number, DefaultError, string>,
        'mutationKey'
      >
    >()
    expectTypeOf(
      mutationOptions({
        mutationFn: (id: string) => Promise.resolve(id.length),
        onSuccess: (data) => {
          expectTypeOf(data).toEqualTypeOf<number>()
        },
      }),
    ).toEqualTypeOf<
      Omit<SolidMutationOptions<number, DefaultError, string>, 'mutationKey'>
    >()
  })

  it('should infer types when used with useMutation', () => {
    const mutation = useMutation(() =>
      mutationOptions({
        mutationKey: ['key'],
        mutationFn: () => Promise.resolve('data'),
        onSuccess: (data) => {
          expectTypeOf(data).toEqualTypeOf<string>()
        },
      }),
    )
    expectTypeOf(mutation).toEqualTypeOf<
      UseMutationResult<string, DefaultError, void, unknown>
    >()

    useMutation(() =>
      // should allow when used with useMutation without mutationKey
      mutationOptions({
        mutationFn: () => Promise.resolve('data'),
        onSuccess: (data) => {
          expectTypeOf(data).toEqualTypeOf<string>()
        },
      }),
    )
  })

  it('should infer types when used with useIsMutating', () => {
    const isMutating = useIsMutating(() =>
      mutationOptions({
        mutationKey: ['key'],
        mutationFn: () => Promise.resolve(5),
      }),
    )
    expectTypeOf(isMutating).toEqualTypeOf<() => number>()

    useIsMutating(
      // @ts-expect-error filters should have mutationKey
      () =>
        mutationOptions({
          mutationFn: () => Promise.resolve(5),
        }),
    )
  })

  it('should infer types when used with queryClient.isMutating', () => {
    const queryClient = new QueryClient()

    const isMutating = queryClient.isMutating(
      mutationOptions({
        mutationKey: ['key'],
        mutationFn: () => Promise.resolve(5),
      }),
    )
    expectTypeOf(isMutating).toEqualTypeOf<number>()

    queryClient.isMutating(
      // @ts-expect-error filters should have mutationKey
      mutationOptions({
        mutationFn: () => Promise.resolve(5),
      }),
    )
  })

  it('should infer types when used with useMutationState', () => {
    const mutationState = useMutationState(() => ({
      filters: mutationOptions({
        mutationKey: ['key'],
        mutationFn: () => Promise.resolve(5),
      }),
    }))
    expectTypeOf(mutationState).toEqualTypeOf<
      () => Array<MutationState<unknown, Error, unknown, unknown>>
    >()

    useMutationState(
      // @ts-expect-error filters should have mutationKey
      () => ({
        filters: mutationOptions({
          mutationFn: () => Promise.resolve(5),
        }),
      }),
    )
  })
})
