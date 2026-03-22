import { assertType, describe, expectTypeOf, test } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import {
  createMutation,
  mutationOptions,
  useIsMutating,
  useMutationState,
} from '../../src/index.js'
import type {
  DefaultError,
  MutationFunctionContext,
  MutationState,
  WithRequired,
} from '@tanstack/query-core'
import type {
  CreateMutationOptions,
  CreateMutationResult,
} from '../../src/types.js'

describe('mutationOptions', () => {
  test('Should not allow excess properties', () => {
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

  test('Should infer types for callbacks', () => {
    mutationOptions({
      mutationFn: () => Promise.resolve(5),
      mutationKey: ['key'],
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  test('Should infer types for onError callback', () => {
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

  test('Should infer types for variables', () => {
    mutationOptions<number, DefaultError, { id: string }>({
      mutationFn: (vars) => {
        expectTypeOf(vars).toEqualTypeOf<{ id: string }>()
        return Promise.resolve(5)
      },
      mutationKey: ['with-vars'],
    })
  })

  test('Should infer result type correctly', () => {
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

  test('Should infer context type correctly', () => {
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

  test('Should error if mutationFn return type mismatches TData', () => {
    assertType(
      mutationOptions<number>({
        // @ts-expect-error this is a good error, because return type is string, not number
        mutationFn: async () => Promise.resolve('wrong return'),
      }),
    )
  })

  test('Should allow mutationKey to be omitted', () => {
    return mutationOptions({
      mutationFn: () => Promise.resolve(123),
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  test('Should infer all types when not explicitly provided', () => {
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
        CreateMutationOptions<number, DefaultError, string>,
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
      Omit<CreateMutationOptions<number, DefaultError, string>, 'mutationKey'>
    >()
  })

  test('Should work when used with createMutation', () => {
    const mutation = createMutation(() =>
      mutationOptions({
        mutationKey: ['key'],
        mutationFn: () => Promise.resolve('data'),
        onSuccess: (data) => {
          expectTypeOf(data).toEqualTypeOf<string>()
        },
      }),
    )
    expectTypeOf(mutation).toEqualTypeOf<
      CreateMutationResult<string, DefaultError, void, unknown>
    >()

    createMutation(() =>
      // should allow when used with createMutation without mutationKey
      mutationOptions({
        mutationFn: () => Promise.resolve('data'),
        onSuccess: (data) => {
          expectTypeOf(data).toEqualTypeOf<string>()
        },
      }),
    )
  })

  test('Should work when used with useIsMutating', () => {
    const isMutating = useIsMutating(
      mutationOptions({
        mutationKey: ['key'],
        mutationFn: () => Promise.resolve(5),
      }),
    )
    expectTypeOf(isMutating.current).toEqualTypeOf<number>()

    useIsMutating(
      // @ts-expect-error filters should have mutationKey
      mutationOptions({
        mutationFn: () => Promise.resolve(5),
      }),
    )
  })

  test('Should work when used with queryClient.isMutating', () => {
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

  test('Should work when used with useMutationState', () => {
    const mutationState = useMutationState({
      filters: mutationOptions({
        mutationKey: ['key'],
        mutationFn: () => Promise.resolve(5),
      }),
    })
    expectTypeOf(mutationState).toEqualTypeOf<
      Array<MutationState<unknown, Error, unknown, unknown>>
    >()

    useMutationState({
      // @ts-expect-error filters should have mutationKey
      filters: mutationOptions({
        mutationFn: () => Promise.resolve(5),
      }),
    })
  })
})
