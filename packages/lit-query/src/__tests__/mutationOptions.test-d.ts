import { QueryClient } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { createMutationController } from '../createMutationController.js'
import { mutationOptions } from '../mutationOptions.js'
import { useIsMutating } from '../useIsMutating.js'
import type {
  DefaultError,
  MutationFunctionContext,
} from '@tanstack/query-core'

class Host extends LitElement {}

describe('mutationOptions', () => {
  it('should not allow excess properties', () => {
    mutationOptions({
      mutationFn: () => Promise.resolve(5),
      // @ts-expect-error this is a good error, because onMutates does not exist!
      onMutates: 1000,
      mutationKey: queryKey(),
      onSuccess: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  it('should infer types for callbacks', () => {
    mutationOptions({
      mutationFn: () => Promise.resolve(5),
      mutationKey: queryKey(),
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
      mutationKey: queryKey(),
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
      mutationKey: queryKey(),
    })
  })

  it('should infer result type correctly', () => {
    mutationOptions<number, DefaultError, void, { name: string }>({
      mutationFn: () => Promise.resolve(5),
      mutationKey: queryKey(),
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
      mutationKey: queryKey(),
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

  it('should infer types when used with createMutationController', () => {
    const mutation = createMutationController(
      new Host(),
      mutationOptions({
        mutationFn: (input: { id: number }) =>
          Promise.resolve(input.id.toString()),
      }),
      new QueryClient(),
    )

    expectTypeOf(mutation().data).toEqualTypeOf<string | undefined>()
    expectTypeOf(mutation().variables).toEqualTypeOf<
      { id: number } | undefined
    >()
  })

  it('should infer types when used with useIsMutating', () => {
    const isMutating = useIsMutating(
      new Host(),
      mutationOptions({
        mutationKey: queryKey(),
        mutationFn: () => Promise.resolve(5),
      }),
      new QueryClient(),
    )
    expectTypeOf(isMutating()).toEqualTypeOf<number>()
  })

  it('should infer types when used with queryClient.isMutating', () => {
    const queryClient = new QueryClient()

    const isMutating = queryClient.isMutating(
      mutationOptions({
        mutationKey: queryKey(),
        mutationFn: () => Promise.resolve(5),
      }),
    )
    expectTypeOf(isMutating).toEqualTypeOf<number>()
  })
})
