import { describe, expectTypeOf, it } from 'vitest'
import { reactive } from 'vue-demi'
import { sleep } from '@tanstack/query-test-utils'
import { useMutation } from '../useMutation'
import type {
  MutationFunctionContext,
  MutationKey,
  QueryClient,
} from '@tanstack/query-core'

describe('Discriminated union return type', () => {
  it('data should be possibly undefined by default', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
  })

  it('data should be defined when mutation is success', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    if (mutation.isSuccess) {
      expectTypeOf(mutation.data).toEqualTypeOf<string>()
    }
  })

  it('error should be null when mutation is success', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    if (mutation.isSuccess) {
      expectTypeOf(mutation.error).toEqualTypeOf<null>()
    }
  })

  it('data should be undefined when mutation is pending', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    if (mutation.isPending) {
      expectTypeOf(mutation.data).toEqualTypeOf<undefined>()
    }
  })

  it('error should be defined when mutation is error', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    if (mutation.isError) {
      expectTypeOf(mutation.error).toEqualTypeOf<Error>()
    }
  })

  it('should narrow variables', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    if (mutation.isIdle) {
      expectTypeOf(mutation.variables).toEqualTypeOf<undefined>()
      return
    }
    if (mutation.isPending) {
      expectTypeOf(mutation.variables).toEqualTypeOf<string>()
      return
    }
    if (mutation.isSuccess) {
      expectTypeOf(mutation.variables).toEqualTypeOf<string>()
      return
    }
    expectTypeOf(mutation.variables).toEqualTypeOf<string>()
  })
})

describe('useMutation', () => {
  it('should allow calling mutate with no arguments when TVariables is optional undefinable', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (_variables: number | undefined) => sleep(0).then(() => 1),
      }),
    )

    expectTypeOf(mutation.mutate).toBeCallableWith()
    expectTypeOf(mutation.mutateAsync).toBeCallableWith()
  })

  it('should type context as the last argument for mutationFn and every hook-level callback', () => {
    useMutation({
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
    })
  })

  it('should type context as the last argument for every per-call mutate option', () => {
    const mutation = useMutation({
      mutationFn: () => Promise.resolve('data'),
    })

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
    useMutation({
      mutationKey: ['todos', 'add'] as const,
      mutationFn: () => Promise.resolve('data'),
      onSuccess: (_data, _variables, _onMutateResult, context) => {
        expectTypeOf(context.mutationKey).toEqualTypeOf<
          MutationKey | undefined
        >()
      },
    })
  })
})
